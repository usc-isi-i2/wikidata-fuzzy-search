
import gzip
import json
import os
import random
import typing

from enum import Enum

from flask import request, make_response
from flask_restful import Resource
from SPARQLWrapper import SPARQLWrapper, JSON

import pandas as pd

import settings
from util import Labels, Location, TimePrecision

DROP_QUALIFIERS = [
    'pq:P585',  # time
    'pq:P1640'  # curator
]

sparql = SPARQLWrapper(settings.WD_QUERY_ENDPOINT)

# Load labels and location
labels = Labels()
location = Location()

# region.csv is an alternate cleaner version admin hiearchy, compared
# with the admin hierarchy in the Location class. Sub-administractive
# regions are required to have path to super-adminstractive regions
# all the way up to country.
region_df = pd.read_csv(os.path.join(settings.BACKEND_DIR, 'metadata', 'region.csv'), dtype=str)
region_df = region_df.fillna('')
for column in ['country', 'admin1', 'admin2', 'admin3']:
    region_df.loc[:, column] = region_df.loc[:, column].map(lambda s: s.lower())

variable_metadata = {}
variables_gz_file = os.path.join(settings.BACKEND_DIR, 'metadata', 'variables.jsonl.gz')
with gzip.open(variables_gz_file, 'rt') as f:
    for line in f:
        _value = json.loads(line)
        _variable_id = _value['variable_id']
        if _variable_id[0] == 'P':
            _variable_id = 'V' + _variable_id
        variable_metadata[_variable_id] = _value

class ColumnStatus(Enum):
    REQUIRED = 0
    DEFAULT = 1
    OPTIONAL = 2

COMMON_COLUMN = {
    'dataset_id': ColumnStatus.DEFAULT,
    'variable_id': ColumnStatus.DEFAULT,
    'variable': ColumnStatus.REQUIRED,
    'category': ColumnStatus.OPTIONAL,
    'main_subject': ColumnStatus.REQUIRED,
    'main_subject_id': ColumnStatus.DEFAULT,
    'value': ColumnStatus.REQUIRED,
    'value_unit': ColumnStatus.DEFAULT,
    'time': ColumnStatus.REQUIRED,
    'time_precision': ColumnStatus.DEFAULT,
    'country': ColumnStatus.DEFAULT,
    'country_id': ColumnStatus.OPTIONAL,
    'admin1': ColumnStatus.DEFAULT,
    'admin1_id': ColumnStatus.OPTIONAL,
    'admin2': ColumnStatus.DEFAULT,
    'admin2_id': ColumnStatus.OPTIONAL,
    'admin3': ColumnStatus.DEFAULT,
    'admin3_id': ColumnStatus.OPTIONAL,
    'place': ColumnStatus.DEFAULT,
    'place_id': ColumnStatus.OPTIONAL,
    'coordinate': ColumnStatus.DEFAULT,
    'shape': ColumnStatus.OPTIONAL
}

class GeographyLevel(Enum):
    COUNTRY = 0
    ADMIN1 = 1
    ADMIN2 = 2
    ADMIN3 = 3
    OTHER = 4

class ApiDataset(Resource):
    def get(self, dataset=None, variable=None):
        if dataset == 'Qwikidata':
            dataset = 'Wikidata'
        if dataset not in ['Wikidata', 'UAZ']:
            content = {
                'Error': f'path not found: /datasets/{dataset}',
                'Usage': 'Use path /datasets/Wikidata/variables/{variable}'
            }
            return content, 404
        if variable is None:
            content = {
                'Error': f'path not found: /datasets/{dataset}/variables/{variable}',
                'Usage': f'Use path /datasets/{dataset}/variables/{{PNode}}',
                'Example': f'Use path /datasets/{dataset}/variables/VP1200149'
            }
            return content, 404

        include_cols = []
        exclude_cols = []
        main_subjects = []
        limit = -1
        if request.args.get('include') is not None:
            include_cols = request.args.get('include').split(',')
        if request.args.get('exclude') is not None:
            exclude_cols = request.args.get('exclude').split(',')
        if request.args.get('limit') is not None:
            try:
                limit = int(request.args.get('limit'))
            except:
                pass

        # Add main subject by exact English label
        for keyword in ['country', 'admin1', 'admin2', 'admin3']:
            if request.args.get(keyword) is not None:
                admins = [x.lower() for x in request.args.get(keyword).split(',')]
                index = region_df.loc[:, keyword].isin(admins)
                print(f'Add {keyword}:', region_df.loc[index, keyword + '_id'].unique())
                main_subjects += [x for x in region_df.loc[index, keyword + '_id'].unique()]

        # Add main subject by qnode
        for keyword in ['main_subject_id', 'country_id', 'admin1_id', 'admin2_id', 'admin3_id']:
            if request.args.get(keyword) is not None:
                qnodes = request.args.get(keyword).split(',')
                print(f'Add {keyword}:', qnodes)
                main_subjects += qnodes

        # Add administrative locations using the name of parent administrative location
        for keyword, admin_col, lower_admin_col in zip(
                ['in_country', 'in_admin1', 'in_admin2'],
                ['country', 'admin1', 'admin2'],
                ['admin1_id', 'admin2_id', 'admin3_id']):
            if request.args.get(keyword) is not None:
                admins = [x.lower() for x in request.args.get(keyword).split(',')]
                index = region_df.loc[:, admin_col].isin(admins)
                print(f'Add {keyword}({request.args.get(keyword)}):',
                      region_df.loc[index, lower_admin_col].unique())
                main_subjects += qnodes

        # Add administrative locations using the qnode of parent administrative location
        for keyword, admin_col, lower_admin_col in zip(
                ['in_country_id', 'in_admin1_id', 'in_admin2_id'],
                ['country_id', 'admin1_id', 'admin2_id'],
                ['admin1_id', 'admin2_id', 'admin3_id']):
            if request.args.get(keyword) is not None:
                admin_ids = request.args.get(keyword).split(',')
                index = region_df.loc[:, admin_col].isin(admin_ids)
                print(f'Add {keyword}({request.args.get(keyword)}):',
                      region_df.loc[index, lower_admin_col].unique())
                main_subjects += [x for x in region_df.loc[index, lower_admin_col].unique()]

        return self.get_using_cache(dataset, variable, include_cols, exclude_cols, limit, main_subjects=main_subjects)

    def get_time_precision(self, precisions: typing.List[int]) -> str:
        if precisions:
            precision = max(precisions)
            try:
                return TimePrecision.to_name(precision)
            except ValueError:
                pass
        return ''

    def get_using_cache(self, dataset, variable, include_cols, exclude_cols, limit, main_subjects=[]):
        metadata = self.get_variable_metadata(variable)
        if not metadata:
            content = {
                'Error': f'No metadata found for dataset {dataset} variable {variable}'
                }
            return content, 404

        if main_subjects:
            places = main_subjects
        else:
            places = metadata.get('main_subject_id', [])
            if len(places) > 10:
                places = random.sample(places, 10)
        place_uris = ['wd:' + qnode for qnode in places]
        admin_level = metadata.get('admin_level', -1)
        qualifiers = metadata.get('qualifiers', {})
        qualifiers = {key: value.replace(' ', '_')
                      for key, value in qualifiers.items() if key not in DROP_QUALIFIERS}

        variable_id = metadata['variable_id']
        response = self.get_minimal_dataset(variable_id, qualifiers, place_uris, limit)
        # pprint(response)

        select_cols = self.get_columns(admin_level, include_cols, exclude_cols, qualifiers)
        print(select_cols)

        # Needed for place columns
        if 'main_subject_id' in select_cols:
            temp_cols = select_cols
        else:
            temp_cols = ['main_subject_id'] + select_cols

        results = []
        # for row, record in enumerate(response['results']['bindings']):
        for record in response['results']['bindings']:
            record_dataset = record.get('dataset', '')

            # Skip record if dataset does not match
            if not record_dataset == dataset:
                # Make an exception for Wikidata, which does not have a dataset field
                if dataset == 'Wikidata' and record_dataset == '':
                    pass
                else:
                    continue

            result = {}
            for col_name, typed_value in record.items():
                value = typed_value['value']
                if col_name in temp_cols:
                    result[col_name] = value
                    # col = result_df.columns.get_loc(col_name)
                    # result_df.iloc[row, col] = value
                if col_name not in COMMON_COLUMN.keys():

                    # remove suffix '_id'
                    qualifier = col_name[:-3]
                    if qualifier not in select_cols:
                        continue
                    if value in metadata['qualifierLabels']:
                        result[qualifier] = metadata['qualifierLabels'][value]
                        # result_df.iloc[row, result_df.columns.get_loc(qualifier)] = metadata['qualifierLabels'][value]
                    else:
                        print('missing qualifier label: ', value)
                        result[qualifier] = value
            results.append(result)

        result_df = pd.DataFrame(results, columns=temp_cols)

        if 'dataset_id' in result_df.columns:
            result_df['dataset_id'] = dataset
        if 'variable_id' in result_df.columns:
            result_df['variable_id'] = variable

        result_df.loc[:, 'variable'] = metadata.get('name', '')
        result_df.loc[:, 'value_unit'] = metadata.get('value_unit', '')
        result_df.loc[:, 'time_precision'] = self.get_time_precision(metadata.get('precision', []))
        for main_subject_id in result_df.loc[:, 'main_subject_id'].unique():
            place = location.lookup_admin_hierarchy(admin_level, main_subject_id)
            index = result_df.loc[:, 'main_subject_id'] == main_subject_id
            if main_subject_id in labels:
                result_df.loc[index, 'main_subject'] = labels.get(main_subject_id, '')
            for col, val in place.items():
                if col in select_cols:
                    result_df.loc[index, col] = val

        print(result_df.head())
        if 'main_subject_id' not in select_cols:
            result_df = result_df.drop(columns=['main_subject_id'])

        csv = result_df.to_csv(index=False)
        output = make_response(csv)
        output.headers['Content-Disposition'] = f'attachment; filename={variable}.csv'
        output.headers['Content-type'] = 'text/csv'
        return output

    def get_minimal_dataset(self, variable_id, qualifiers, place_uris, limit):
        select_columns = '?dataset ?main_subject_id ?value ?time ?coordinate ' + ' '.join(f'?{name}_id' for name in qualifiers.values())

        qualifier_query = ''
        for pq_property, name  in qualifiers.items():
            qualifier_query += f'''
  ?o {pq_property} ?{name}_ .
  BIND(REPLACE(STR(?{name}_), "(^.*)(Q.\\\\d+$)", "$2") AS ?{name}_id)
'''
        dataset_query = self.get_minimal_dataset_query(
            variable_id, select_columns, qualifier_query, place_uris, limit)
        sparql.setQuery(dataset_query)
        sparql.setReturnFormat(JSON)
        result = sparql.query()
        response = result.convert()
        return response

    def get_minimal_dataset_query(
            self, variable, select_columns, qualifier_query, place_uris, limit):

        dataset_query = f'''
SELECT {select_columns} WHERE {{
  VALUES(?variable_ ?p ?ps) {{
      (wd:{variable} p:{variable} ps:{variable})
  }}

  VALUES ?main_subject_ {{
    {' '.join(place_uris)}
  }}
  ?main_subject_ ?p ?o .
  ?o ?ps ?value .

  ?o pq:P585 ?time .

  optional {{
    ?main_subject_ wdt:P625 ?coordinate
  }}

  optional {{
    ?o pq:Pdataset ?dataset_ .
    BIND(REPLACE(STR(?dataset_), "(^.*/)(Q.*)", "$2") as ?dataset)
  }}

  {qualifier_query}

  BIND(REPLACE(STR(?main_subject_), "(^.*)(Q.\\\\d+$)", "$2") AS ?main_subject_id)

}}
ORDER BY ?main_subject_id ?time
'''
        if limit > -1:
            dataset_query = dataset_query + f'\nLIMIT {limit}'
        print(dataset_query)
        return dataset_query

    def get_dataset_query(self, variable, select_columns, qualifier_optionals, place_uris, limit):
        dataset_query = f'''
SELECT {select_columns} WHERE {{
  VALUES(?variable_ ?p ?ps) {{
      (wd:{variable} p:{variable} ps:{variable})
  }}

  VALUES ?main_subject_ {{
    {' '.join(place_uris)}
  }}
  ?main_subject_ ?p ?o .
  ?o ?ps ?value .

  # OPTIONAL {{ ?main_subject_ ?p ?statement . ?statement (pqv:P585/wikibase:timePrecision) ?precision. }}
  # OPTIONAL {{ ?o (pqv:P585/wikibase:timePrecision) ?time_precision. }}


  ?o pq:P585 ?time .
  {qualifier_optionals}

  ?variable_ skos:prefLabel ?variable .
  ?main_subject_ skos:prefLabel ?main_subject .
  FILTER((LANG(?variable)) = "en")
  FILTER((LANG(?main_subject)) = "en")

  BIND("Qwikidata" AS ?dataset_id)
  BIND(REPLACE(STR(?variable_), "(^.*)(P.\\\\d+$)", "$2") AS ?variable_id)
  BIND(REPLACE(STR(?main_subject_), "(^.*)(Q.\\\\d+$)", "$2") AS ?main_subject_id)

  OPTIONAL {{
    ?main_subject_ wdt:P17 ?country_ .
    ?main_subject_ skos:prefLabel ?country .
    FILTER((LANG(?country)) = "en")
    BIND(REPLACE(STR(?main_subject_), "(^.*)(Q.\\\\d+$)", "$2") AS ?country_id)
  }}
  OPTIONAL {{
    # If is a third level admin (district)
    ?main_subject_ wdt:P31/wdt:P279 wd:Q13221722.
    BIND(?main_subject_ as ?admin3_)
    ?admin3_ wdt:P131 ?admin2_ .
    ?admin2_ wdt:P131 ?admin1_ .

    ?admin1_ skos:prefLabel ?admin1 .
    ?admin2_ skos:prefLabel ?admin2 .
    ?admin3_ skos:prefLabel ?admin3 .
    FILTER((LANG(?admin1)) = "en")
    FILTER((LANG(?admin2)) = "en")
    FILTER((LANG(?admin3)) = "en")
    BIND(REPLACE(STR(?admin1_), "(^.*)(Q.\\\\d+$)", "$2") AS ?admin1_id)
    BIND(REPLACE(STR(?admin2_), "(^.*)(Q.\\\\d+$)", "$2") AS ?admin2_id)
    BIND(REPLACE(STR(?admin3_), "(^.*)(Q.\\\\d+$)", "$2") AS ?admin3_id)
  }}
  OPTIONAL {{
    # If is second level admin (zone)
    ?main_subject_ wdt:P31/wdt:P279 wd:Q13220204 .
    BIND(?main_subject_ as ?admin2_)
    ?admin2_ wdt:P131 ?admin1_ .

    ?admin1_ skos:prefLabel ?admin1 .
    ?admin2_ skos:prefLabel ?admin2 .
    FILTER((LANG(?admin1)) = "en")
    FILTER((LANG(?admin2)) = "en")
    BIND(REPLACE(STR(?admin1_), "(^.*)(Q.\\\\d+$)", "$2") AS ?admin1_id)
    BIND(REPLACE(STR(?admin2_), "(^.*)(Q.\\\\d+$)", "$2") AS ?admin2_id)
  }}
  OPTIONAL {{
    # If is first level admin (region)
    ?main_subject_ wdt:P31/wdt:P279 wd:Q10864048 .
    BIND(?main_subject_ as ?admin1_)

    ?admin1_ skos:prefLabel ?admin1 .
    FILTER((LANG(?admin1)) = "en")
    BIND(REPLACE(STR(?admin1_), "(^.*)(Q.\\\\d+$)", "$2") AS ?admin1_id)
  }}

  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
}}
ORDER BY ?variable ?main_subject ?time
'''
        if limit > -1:
            dataset_query = dataset_query + f'\nLIMIT {limit}'
        print(dataset_query)
        return dataset_query

    def get_columns(self, admin_level, include_cols, exclude_cols, qualifiers) -> typing.List[str]:
        result = []
        for col, status in COMMON_COLUMN.items():
            if status == ColumnStatus.REQUIRED or col in include_cols:
                result.append(col)
                continue
            if col in exclude_cols:
                continue
            if status == ColumnStatus.DEFAULT:
                if col.startswith('admin'):
                    level = int(col[5])
                    if level <= admin_level:
                        result.append(col)
                else:
                    result.append(col)
        for pq_node, col in qualifiers.items():
            if col not in exclude_cols:
                result.append(col)
            col_id = f'{col}_id'
            if col_id in include_cols:
                result.append(col_id)
        return result

    def get_variable_metadata(self, variable: str) -> dict:
        if variable in variable_metadata:
            return variable_metadata[variable]
