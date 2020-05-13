
import gzip
import json
import os
import random
import typing

from enum import Enum
from pprint import pprint

from flask import request, make_response
from flask_restful import Resource
from SPARQLWrapper import SPARQLWrapper, JSON, CSV

import pandas as pd

import settings

DROP_QUALIFIERS = [
    'pq:P585',  # time
    'pq:P1640'  # curator
]

sparql = SPARQLWrapper(settings.WD_QUERY_ENDPOINT)

# Load labels
labels = {}
labels_gz_file = os.path.join(settings.BACKEND_DIR, 'metadata', 'labels.tsv.gz')
with gzip.open(labels_gz_file, 'rt') as f:
    next(f)
    for line in f:
        try:
            node, _, label = line.rstrip('\n').split('\t')
            if label.startswith("'") and label.endswith("'@en"):
                labels[node] = label[1:-4]
            else:
                labels[node] = label
        except:
            print('label error:', line.rstrip('\n'))

# with open(os.path.join(settings.BACKEND_DIR, 'metadata', 'label.json')) as f:
#     label = json.load(f)

with open(os.path.join(settings.BACKEND_DIR, 'metadata', 'contains.json')) as f:
    contains = json.load(f)

region_df = pd.read_csv(os.path.join(settings.BACKEND_DIR, 'metadata', 'region.csv'), dtype=str)
region_df = region_df.fillna('')
for column in ['country', 'admin1', 'admin2', 'admin3']:
    region_df.loc[:, column] = region_df.loc[:, column].map(lambda s: s.lower())

class ColumnStatus(Enum):
    REQUIRED = 0
    DEFAULT = 1
    OPTIONAL = 2

COMMON_COLUMN = {
    'dataset_id': ColumnStatus.OPTIONAL,
    'variable': ColumnStatus.REQUIRED,
    'variable_id': ColumnStatus.OPTIONAL,
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

variable_metadata = {}
variables_gz_file = os.path.join(settings.BACKEND_DIR, 'metadata', 'variables.jsonl.gz')
with gzip.open(variables_gz_file, 'rt') as f:
    for line in f:
        value = json.loads(line)
        variable_metadata[value['variable_id']] = value

def lookup_place(admin_level: int, qnode: str):
    result = {}
    if qnode.startswith('wd:'):
        qnode = qnode[3:]
    if admin_level == 0:
        result['country_id'] = qnode
        result['country'] = labels.get(qnode, '')
    else:
        result['country_id'] = contains['toCountry'].get(qnode, '')
        result['country'] = labels.get(result['country_id'], '')
    if admin_level == 3:
        result['admin3_id'] = qnode
        result['admin3'] = labels.get(qnode, '')
        if qnode in contains['toAdmin2']:
            admin_level = 2
            qnode = contains['toAdmin2'][qnode]
    if admin_level == 2:
        result['admin2_id'] = qnode
        result['admin2'] = labels.get(qnode, '')
        if qnode in contains['toAdmin1']:
            admin_level = 1
            qnode = contains['toAdmin1'][qnode]
    if admin_level == 1:
        result['admin1_id'] = qnode
        result['admin1'] = labels.get(qnode, '')
    return result

# for qnode in variable_metadata['P1200149']['main_subject_id']:
#     result = lookup_place(3, qnode)
#     print(result)

class GeographyLevel(Enum):
    COUNTRY = 0
    ADMIN1 = 1
    ADMIN2 = 2
    ADMIN3 = 3
    OTHER = 4


class ApiDataset(Resource):
    def get(self, dataset=None, variable=None):
        if dataset != 'Qwikidata' and dataset != 'Qwikidata2':
            content = {
                'Error': f'path not found: /datasets/{dataset}',
                'Usage': 'Use path /datasets/Qwikidata/variables/{variable}'
            }
            return content, 404
        if variable is None:
            content = {
                'Error': f'path not found: /datasets/{dataset}/variables/{variable}',
                'Usage': f'Use path /datasets/{dataset}/variables/{{PNode}}',
                'Example': f'Use path /datasets/{dataset}/variables/P1200149'
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
                print(f'Add {keyword}({request.args.get(keyword)}):', region_df.loc[index, lower_admin_col].unique())
                main_subjects += qnodes

        # Add administrative locations using the qnode of parent administrative location
        for keyword, admin_col, lower_admin_col in zip(
                ['in_country_id', 'in_admin1_id', 'in_admin2_id'],
                ['country_id', 'admin1_id', 'admin2_id'],
                ['admin1_id', 'admin2_id', 'admin3_id']):
            if request.args.get(keyword) is not None:
                admin_ids = request.args.get(keyword).split(',')
                index = region_df.loc[:, admin_col].isin(admin_ids)
                print(f'Add {keyword}({request.args.get(keyword)}):', region_df.loc[index, lower_admin_col].unique())
                main_subjects += [x for x in region_df.loc[index, lower_admin_col].unique()]

        if dataset == 'Qwikidata':
            return self.get_using_cache(variable, include_cols, exclude_cols, limit, main_subjects=main_subjects)
        else:
            return self.get_no_cache(variable, include_cols, exclude_cols, limit)

    def get_no_cache(self, variable, include_cols, exclude_cols, limit):
        variable_uri = 'p:' +  variable
        place_uris = self.get_places(variable_uri)
        print(f'place_uris = {place_uris}')
        admin_level = self.get_max_admin_level(variable_uri, place_uris[:10])
        print(f'admin_level = {admin_level}')
        qualifiers = self.get_dataset_qualifiers(variable_uri, place_uris)
        select_cols = self.get_columns(admin_level, include_cols, exclude_cols, qualifiers)

        response = self.get_dataset(variable, select_cols, qualifiers, place_uris, limit)
        # pprint(response)
        result_df = pd.DataFrame(columns=response['head']['vars'],
                                 index=range(len(response['results']['bindings'])))
        for row, record in enumerate(response['results']['bindings']):
            for col, name in enumerate(response['head']['vars']):
                if name in record:
                    result_df.iloc[row, col] = record[name]['value']
        csv = result_df.to_csv(index=False)
        output = make_response(csv)
        output.headers['Content-Disposition'] = f'attachment; filename={variable}.csv'
        output.headers['Content-type'] = 'text/csv'
        return output

    def get_using_cache(self, variable, include_cols, exclude_cols, limit, main_subjects=[]):
        metadata = self.get_variable_metadata(variable)
        variable_uri = 'p:' +  variable

        if main_subjects:
            places = main_subjects
        else:
            places = metadata.get('main_subject_id', [])
            if len(places) > 10:
                places = random.sample(places, 10)
        place_uris = ['wd:' + qnode for qnode in places]
        admin_level = metadata.get('admin_level', -1)
        qualifiers = metadata.get('qualifiers', {})
        qualifiers = {key: value.replace(' ', '_') for key, value in qualifiers.items() if key not in DROP_QUALIFIERS}

        response = self.get_minimal_dataset(variable, qualifiers, place_uris, limit)
        # pprint(response)

        select_cols = self.get_columns(admin_level, include_cols, exclude_cols, qualifiers)
        print(select_cols)

        # Needed for place columns
        if 'main_subject_id' in select_cols:
            temp_cols = select_cols
        else:
            temp_cols = ['main_subject_id'] + select_cols
        result_df = pd.DataFrame(columns=temp_cols,
                                  index=range(len(response['results']['bindings'])))
        for row, record in enumerate(response['results']['bindings']):
            for col_name, typed_value in record.items():
                value = typed_value['value']
                if col_name in result_df.columns:
                    col = result_df.columns.get_loc(col_name)
                    result_df.iloc[row, col] = value
                if col_name not in COMMON_COLUMN.keys():
                    qualifier = col_name[:-3]
                    if qualifier not in select_cols:
                        continue
                    if value in metadata['qualifier_label']:
                        result_df.iloc[row, result_df.columns.get_loc(qualifier)] = metadata['qualifier_label'][value]
                    else:
                        print('missing qualifier label: ', value)
        result_df.loc[:, 'variable'] = metadata.get('name', '')
        result_df.loc[:, 'value_unit'] = metadata.get('value_unit', '')
        result_df.loc[:, 'time_precision'] = metadata.get('precision', '')
        for main_subject_id in result_df.loc[:, 'main_subject_id'].unique():
            place = lookup_place(admin_level, main_subject_id)
            index = result_df.loc[:, 'main_subject_id'] == main_subject_id
            if main_subject_id in labels:
                result_df.loc[index, 'main_subject'] = labels[main_subject_id]
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

    def get_minimal_dataset(self, variable, qualifiers, place_uris, limit):
        select_columns = '?main_subject_id ?value ?time ' + ' '.join(f'?{name}_id' for name in qualifiers.values())

        qualifier_query = ''
        for pq_property, name  in qualifiers.items():
            qualifier_query += f'''
  ?o {pq_property} ?{name}_ .
  BIND(REPLACE(STR(?{name}_), "(^.*)(Q.\\\\d+$)", "$2") AS ?{name}_id)
'''
  # ?{name}_ skos:prefLabel ?{name} .
  # FILTER((LANG(?{name})) = "en")
        dataset_query = self.get_minimal_dataset_query(variable, select_columns, qualifier_query, place_uris, limit)
        sparql.setQuery(dataset_query)
        sparql.setReturnFormat(JSON)
        result = sparql.query()
        response = result.convert()
        return response

    def get_dataset(self, variable, select_columns, qualifiers, place_uris, limit=-1):
        select_columns = ' '.join(f'?{name}' for name in select_columns)

        qualifier_optionals = ''
        for pq_property, name in qualifiers.items():
            qualifier_optionals += f'''
  OPTIONAL {{ ?o {pq_property} ?{name}_ .
    ?{name}_ skos:prefLabel ?{name} .
    FILTER((LANG(?{name})) = "en")
    BIND(REPLACE(STR(?{name}_), "(^.*)(Q.\\\\d+$)", "$2") AS ?{name}_id)
  }}
'''
        dataset_query = self.get_dataset_query(variable, select_columns, qualifier_optionals, place_uris, limit)
        sparql.setQuery(dataset_query)
        sparql.setReturnFormat(JSON)
        result = sparql.query()
        response = result.convert()
        return response


    def get_minimal_dataset_query(self, variable, select_columns, qualifier_query, place_uris, limit):

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

    def get_dataset_qualifiers(self, variable_uri, place_uris) -> dict:
        qualifiers = self.get_qualifiers(variable_uri, place_uris)

        # remove common qualifiers
        if 'point in time' in qualifiers:
            del qualifiers['point in time']
        else:
            print(f'Variable {variable_uri} does not have time qualifiers!')
        if 'curator' in qualifiers:
            del qualifiers['curator']

        # rename qualifiers
        temp = {}
        for key, value in qualifiers.items():
            temp[key.replace(' ', '_')] = value
        qualifiers = temp
        return qualifiers

    def get_qualifiers(self, variable_uri, place_uris) -> dict:
        qualifer_query = f'''
SELECT DISTINCT ?qualifierLabel ?qualifierUri WHERE {{
    VALUES ?place {{ {' '.join(place_uris[:5])} }}
    ?place {variable_uri} ?statement .
    ?statement ?pq ?pqv .
    ?qualifier wikibase:qualifier ?pq .
    BIND (STR(REPLACE(STR(?pq), STR(pq:), "pq:")) AS ?qualifierUri)
    SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
}}
'''
        print(qualifer_query)
        sparql.setQuery(qualifer_query)
        sparql.setReturnFormat(JSON)
        response = sparql.query().convert()
        # pprint(response)
        qualifiers = {}
        for record in response['results']['bindings']:
            qualifiers[record['qualifierLabel']['value']] = record['qualifierUri']['value']
        return qualifiers


    def get_max_admin_level(self, variable_uri, place_uris):
        admin_query = f'''
SELECT DISTINCT ?adminLevel ?adminLevelLabel WHERE {{
    VALUES ?place {{ {' '.join(place_uris)} }}
    ?place {variable_uri} ?statement .
    ?place wdt:P31/wdt:P279 ?adminLevel .
    SERVICE wikibase:label {{bd:serviceParam wikibase:language "en". }}
}}
'''
        print(admin_query)
        sparql.setQuery(admin_query)
        sparql.setReturnFormat(JSON)
        response = sparql.query().convert()
        pprint(response)
        max_admin_level = 0
        for record in response['results']['bindings']:
            admin_level_uri = record['adminLevel']['value']
            admin_level = 0
            if admin_level_uri.endswith('Q13221722'):
                admin_level = 3
            elif admin_level_uri.endswith('Q13220204'):
                admin_level = 2
            elif admin_level_uri.endswith('Q10864048'):
                admin_level = 1
            if admin_level > max_admin_level:
                max_admin_level = admin_level
            if max_admin_level == 3:
                break
        return max_admin_level

    def get_places(self, variable_uri) -> typing.List[str]:
        place_query = f'''
SELECT DISTINCT ?place ?place_Label WHERE {{
    ?place_ {variable_uri} ?statement .
    BIND (STR(REPLACE(STR(?place_), STR(wd:), "wd:")) AS ?place)
    SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
}}
'''
        print(place_query)
        sparql.setQuery(place_query)
        sparql.setReturnFormat(JSON)
        response = sparql.query().convert()
        pprint(response)
        place_uris = []
        for record in response['results']['bindings']:
            qnode = record['place']['value']
            place_uris.append(qnode)
        return place_uris

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
        for col in qualifiers:
            if col not in exclude_cols:
                result.append(col)
            col_id = f'{col}_id'
            if col_id in include_cols:
                result.append(col_id)
        return result

    def get_variable_metadata(self, variable: str) -> dict:
        if variable in variable_metadata:
            return variable_metadata[variable]

    def generate_metadata(self, variable: str) -> dict:
        variable_uri = 'p:' +  variable
        place_uris = self.get_places(variable_uri)
        print(f'place_uris = {place_uris}')
        admin_level = self.get_max_admin_level(variable_uri, place_uris[:10])
        print(f'admin_level = {admin_level}')
        qualifiers = self.get_dataset_qualifiers(variable_uri, place_uris)

        metadata = {}
        return metadata
