
import os
import random
import typing

from enum import Enum

from flask import request, make_response
from flask_restful import Resource
from SPARQLWrapper import SPARQLWrapper, JSON

import pandas as pd

import settings
from datamart import VariableMetadataCache, VariableMetadata
from util import Labels, Location, TimePrecision

from postgres import query_to_dicts

DROP_QUALIFIERS = [
    'pq:P585', 'P585' # time
    'pq:P1640',  # curator
    'pq:Pdataset', 'P2006020004' # dataset
]

sparql = SPARQLWrapper(settings.WD_QUERY_ENDPOINT)

# Load labels and location
labels = Labels()
location = Location()

variable_metadata = VariableMetadataCache(settings.METADATA_FILES['VARIABLES'])

# region.csv is an alternate cleaner version admin hiearchy, compared
# with the admin hierarchy in the Location class. Sub-administractive
# regions are required to have path to super-adminstractive regions
# all the way up to country.
region_df = pd.read_csv(settings.METADATA_FILES['REGIONS'], dtype=str)
region_df = region_df.fillna('')
for column in ['country', 'admin1', 'admin2', 'admin3']:
    region_df.loc[:, column] = region_df.loc[:, column].map(lambda s: s.lower())

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

        print((dataset, variable, include_cols, exclude_cols, limit, main_subjects))
        return self.get_using_cache(dataset, variable, include_cols, exclude_cols, limit, main_subjects=main_subjects)

        # return self.get_direct(dataset, variable, include_cols, exclude_cols, limit, main_subjects=main_subjects)

    def get_time_precision(self, precisions: typing.List[int]) -> str:
        if precisions:
            precision = max(precisions)
            try:
                return TimePrecision.to_name(precision)
            except ValueError:
                pass
        return ''

    def get_direct(self, dataset, variable, include_cols, exclude_cols, limit, main_subjects=[]):
        result = self.find_dataset(dataset, variable)
        if not result:
            content = {
                'Error': f'Could not find dataset {dataset} variable {variable}'
            }
            return content, 404
        admin_level = 1
        qualifiers = self.get_qualifiers(result['variable_id'], result['property_id'])
        qualifiers = {key: value for key, value in qualifiers.items() if key not in DROP_QUALIFIERS}
        select_cols = self.get_columns(admin_level, include_cols, exclude_cols, qualifiers)
        print(select_cols)
        response = self.get_direct_dataset(result['property_id'], qualifiers, limit)

    def find_dataset(self, dataset, variable):
        query = f'''
select ?dataset_id ?variable_id ?property_id
where {{
  ?dataset_ wdt:P1813 ?dname .
  FILTER (str(?dname) = "{dataset}")
  ?variable_ wdt:P361 ?d .
  ?variable_ wdt:P1813 ?vname .
  FILTER (str(?vname) = "{variable}")
  ?variable_ wdt:P1687 ?property_ .
  BIND(REPLACE(STR(?dataset_), "(^.*)(Q.+$)", "$2") AS ?dataset_id)
  BIND(REPLACE(STR(?variable_), "(^.*)(Q.+$)", "$2") AS ?variable_id)
  BIND(REPLACE(STR(?property_), "(^.*)(Q.+$)", "$2") AS ?property_id)
}}
'''
        print(query)
        sparql.setQuery(query)
        sparql.setReturnFormat(JSON)
        result = sparql.query()
        response = result.convert()
        print(response)
        if response['results']['bindings']:
            binding = response['results']['bindings'][0]
            return {
                'dataset_id': binding['dataset_id']['value'],
                'variable_id': binding['variable_id']['value'],
                'property_id': binding['property_id']['value']
            }
        return {}

    def get_qualifiers(self, variable_id, property_id):
        query = f'''
select ?qualifier_id ?qual_name
where {{
  wd:{variable_id} p:{property_id} ?st .
  ?st ps:{property_id} ?qual_ .
  ?st pq:P1932 ?qual_name .
  BIND(REPLACE(STR(?qual_), "(^.*)(P.+$)", "$2") AS ?qualifier_id)
}}
'''
        print(query)
        sparql.setQuery(query)
        sparql.setReturnFormat(JSON)
        result = sparql.query()
        response = result.convert()
        print(response)
        qualifiers = {binding['qualifier_id']['value']:binding['qual_name']['value']
                      for binding in response['results']['bindings']}
        return qualifiers


    def get_direct_dataset(self, property_id, qualifiers, limit):
        select_columns = '?dataset ?main_subject_id ?value ?value_unit ?time ?coordinate ' + ' '.join(f'?{name}_id' for name in qualifiers.values())

        qualifier_query = ''
        for pq_property, name  in qualifiers.items():
            qualifier_query += f'''
  ?o {pq_property} ?{name}_ .
  BIND(REPLACE(STR(?{name}_), "(^.*)(Q.\\\\d+$)", "$2") AS ?{name}_id)
'''
        dataset_query = self.get_direct_dataset_query(
            property_id, select_columns, qualifier_query, limit)
        print(dataset_query)

        sparql.setQuery(dataset_query)
        sparql.setReturnFormat(JSON)
        result = sparql.query()
        response = result.convert()
        return response

    def get_direct_dataset_query(
            self, property_id, select_columns, qualifier_query, limit):

        dataset_query = f'''
SELECT {select_columns} WHERE {{
  VALUES(?property_id_ ?p ?ps ?psv) {{
      (wd:{property_id} p:{property_id} ps:{property_id} psv:{property_id})
  }}

  ?main_subject_ ?p ?o .

  # ?o ?ps ?value .
  ?o ?psv ?value_obj .
  ?value_obj wikibase:quantityAmount ?value .
  optional {{
    ?value_obj wikibase:quantityUnit ?unit_id .
    ?unit_id rdfs:label ?value_unit .
    FILTER(LANG(?value_unit) = "en")
  }}

  ?o pq:P585 ?time .

  optional {{
    ?main_subject_ wdt:P625 ?coordinate
  }}

  optional {{
    ?o pq:P2006020004 ?dataset_ .
    BIND(REPLACE(STR(?dataset_), "(^.*/)(Q.*)", "$2") as ?dataset)
  }}

  {qualifier_query}

  BIND(REPLACE(STR(?main_subject_), "(^.*/)(Q.*)", "$2") AS ?main_subject_id)

}}
ORDER BY ?main_subject_id ?time
'''
        if limit > -1:
            dataset_query = dataset_query + f'\nLIMIT {limit}'
        print(dataset_query)
        return dataset_query

    def get_using_cache(self, dataset, variable, include_cols, exclude_cols, limit, main_subjects=[]):
        metadata: VariableMetadata = variable_metadata.get(variable)
        if not metadata:
            content = {
                'Error': f'No metadata found for dataset {dataset} variable {variable}'
                }
            return content, 404

        if main_subjects:
            places = main_subjects
        else:
            places = metadata.mainSubject
            if len(metadata.mainSubject) > 10:
                places = [obj['identifier'] for obj in random.sample(metadata.mainSubject, 10)]
            else:
                places = [obj['identifier'] for obj in metadata.mainSubject]
        place_uris = ['wd:' + qnode for qnode in places]
        admin_level = metadata._max_admin_level
        qualifiers = metadata.qualifier
        qualifiers = {key: value for key, value in qualifiers.items() if key not in DROP_QUALIFIERS}

        property_id = metadata.correspondsToProperty

        select_cols = self.get_columns(admin_level, include_cols, exclude_cols, qualifiers)
        print(select_cols)

        # Needed for place columns
        if 'main_subject_id' in select_cols:
            temp_cols = select_cols
        else:
            temp_cols = ['main_subject_id'] + select_cols

        if settings.BACKEND_MODE == 'postgres':
            results = self.perform_sql_query(dataset, property_id, places, limit)
        else: # SPARQL
            results = self.perform_sparql_query(dataset, property_id, qualifiers, place_uris, limit, temp_cols)

        result_df = pd.DataFrame(results, columns=temp_cols)

        if 'dataset_id' in result_df.columns:
            result_df['dataset_id'] = dataset
        if 'variable_id' in result_df.columns:
            result_df['variable_id'] = variable

        result_df.loc[:, 'variable'] = metadata.name
        # Use per row value unit
        # result_df.loc[:, 'value_unit'] = metadata.unitOfMeasure
        result_df.loc[:, 'time_precision'] = self.get_time_precision(metadata._precision)
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

    def perform_sparql_query(self, dataset_id, property_id, qualifiers, place_uris, limit, cols):
        response = self.get_minimal_dataset(property_id, qualifiers, place_uris, limit)
        print('len(response) = ', len(response['results']['bindings']))
        #pprint(
        results = []
        # for row, record in enumerate(response['results']['bindings']):
        for record in response['results']['bindings']:
            record_dataset = ''
            if 'dataset' in record:
                record_dataset = record['dataset']['value']

            # Skip record if dataset does not match
            if not record_dataset == 'Q' + dataset_id:
                # Make an exception for Wikidata, which does not have a dataset field
                if dataset_id == 'Wikidata' and record_dataset == '':
                    pass
                else:
                    print(f'Skipping: not {record_dataset} == Q{dataset_id}')
                    # continue

            result = {}
            for col_name, typed_value in record.items():
                value = typed_value['value']
                if col_name in cols:
                    result[col_name] = value
                    # col = result_df.columns.get_loc(col_name)
                    # result_df.iloc[row, col] = value
                if col_name not in COMMON_COLUMN.keys():

                    # remove suffix '_id'
                    qualifier = col_name[:-3]
                    if qualifier not in cols:
                        continue
                    result[qualifier] = labels.get(value, value)
                    # if value in metadata['qualifierLabels']:
                    #     result[qualifier] = metadata['qualifierLabels'][value]
                    #     # result_df.iloc[row, result_df.columns.get_loc(qualifier)] = metadata['qualifierLabels'][value]
                    # else:
                    #     print('missing qualifier label: ', value)
                    #     result[qualifier] = value
            results.append(result)
        return results

    def perform_sql_query(self, dataset_id, property_id, places, limit):
        # For now just return a limited set of values, since everything else is added from the metadata cache:
        # main_subject_id, time, value, value_unit
        quoted_places = [f"'{place}'" for place in places]
        places_in_clause = ', '.join(quoted_places)

        query = f"""
        SELECT e_main.node1 AS main_subject_id,
               q_main.number AS value,
               s_value_unit.text AS value_unit,
               to_json(d_value_date.date_and_time)#>>'{{}}' || 'Z' AS time
        FROM edges AS e_main   -- Main edge
            JOIN quantities AS q_main ON (e_main.id=q_main.edge_id)
            JOIN edges AS e_value_unit ON (e_value_unit.node1=q_main.unit AND e_value_unit.label='label')
            JOIN strings AS s_value_unit ON (e_value_unit.id=s_value_unit.edge_id)
            JOIN edges AS e_value_date ON (e_value_date.node1=e_main.id AND e_value_date.label='P585')
            JOIN dates AS d_value_date ON (e_value_date.id=d_value_date.edge_id)
        WHERE e_main.node1 IN ({places_in_clause}) AND e_main.label='{property_id}'
        ORDER BY main_subject_id, time
        """
        if limit > 0:
            query += f"\nLIMIT {limit}\n"
        print(query)

        return query_to_dicts(query)

        # Conversion of date to iso string explained here: https://stackoverflow.com/a/55387470/871910


    def get_minimal_dataset(self, property_id, qualifiers, place_uris, limit):
        select_columns = '?dataset ?main_subject_id ?value ?value_unit ?time ?coordinate ' + ' '.join(f'?{name}_id' for name in qualifiers.values())

        qualifier_query = ''
        for pq_property, name  in qualifiers.items():
            qualifier_query += f'''
  ?o {pq_property} ?{name}_ .
  BIND(REPLACE(STR(?{name}_), "(^.*)(Q.\\\\d+$)", "$2") AS ?{name}_id)
'''
        dataset_query = self.get_minimal_dataset_query(
            property_id, select_columns, qualifier_query, place_uris, limit)
        print(dataset_query)

        sparql.setQuery(dataset_query)
        sparql.setReturnFormat(JSON)
        result = sparql.query()
        response = result.convert()
        return response

    def get_minimal_dataset_query(
            self, property_id, select_columns, qualifier_query, place_uris, limit):

        dataset_query = f'''
SELECT {select_columns} WHERE {{
  VALUES(?property_id_ ?p ?ps ?psv) {{
      (wd:{property_id} p:{property_id} ps:{property_id} psv:{property_id})
  }}

  VALUES ?main_subject_ {{
    {' '.join(place_uris)}
  }}
  ?main_subject_ ?p ?o .

  # ?o ?ps ?value .
  ?o ?psv ?value_obj .
  ?value_obj wikibase:quantityAmount ?value .
  optional {{
    ?value_obj wikibase:quantityUnit ?unit_id .
    ?unit_id rdfs:label ?value_unit .
    FILTER(LANG(?value_unit) = "en")
  }}

  ?o pq:P585 ?time .

  optional {{
    ?main_subject_ wdt:P625 ?coordinate
  }}

  optional {{
    ?o pq:P2006020004 ?dataset_ .
    BIND(REPLACE(STR(?dataset_), "(^.*/)(Q.*)", "$2") as ?dataset)
  }}

  {qualifier_query}

  BIND(REPLACE(STR(?main_subject_), "(^.*/)(Q\\\\d+$)", "$2") AS ?main_subject_id)

}}
ORDER BY ?main_subject_id ?time
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

# Scratch pad for queries
#
# Almost full query that returns most of the metadata (with the wrong field names)
# -- Variable: PVUAZ-0
# -- Dataset: UAZ
# -- Main subject: Q115

# SELECT e1.node1 as main_subject_id,
#        s2.text as main_subject,
# 	   e1.label as property_id,
# 	   s3.text as property,
# 	   q1.number as quantity,
# 	   q1.unit as unit_id,
# 	   s6.text as unit,
# 	   d4.date_and_time as time,
# 	   d4.precision as precision,
# 	   '' as place,
# 	   CONCAT('POINT(', c5.longitude, ', ', c5.latitude, ')') as coordinate
# 	FROM edges e1
# 	JOIN quantities q1 ON (e1.id=q1.edge_id)
# 	JOIN edges e2 ON (e1.node1=e2.node1 AND e2.label='label')
# 	JOIN strings s2 ON (e2.id=s2.edge_id)
# 	JOIN edges e3 on (e3.node1=e1.label and e3.label='label')
# 	JOIN strings s3 on (e3.id=s3.edge_id)
# 	JOIN edges e4 ON (e4.node1=e1.id AND e4.label='P585')
# 	JOIN dates d4 ON (e4.id=d4.edge_id)
# 	JOIN edges e6 ON (e6.node1=q1.unit AND e6.label='label')
# 	JOIN strings s6 ON (s6.edge_id=e6.id)
# 	LEFT JOIN edges e5 ON (e5.node1=e1.node1 AND e5.label='P625')
# 	LEFT JOIN coordinates c5 ON (e5.id=c5.edge_id)
# WHERE e1.node1 IN ('Q115') AND e1.label='PVUAZ-2'
# ORDER BY e1.node1, d4.date_and_time
