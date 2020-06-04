'''
The script backend/generate-metadata.py generates the dataset variable
metadata file backend/metadata/variables.jsonl, and the labels file
metadata/labels.tsv. The script uses SPARQL to directly Wikidata. Just
run the backend/generate-metadata.py script with no arguments.
'''
import argparse
import csv
import datetime
import json
import os
import re
import shutil
import traceback
import typing

from pathlib import Path

from yaml import load, dump
try:
    from yaml import CLoader as Loader, CDumper as Dumper
except ImportError:
    from yaml import Loader, Dumper

from SPARQLWrapper import SPARQLWrapper, JSON  # type: ignore

import settings  # type: ignore
from datamart import VariableMetadata
from util import Labels, Location

# Load qnode labels
labels = Labels()

# Load geoplace containment
location = Location()

def gather_main_subject(variable, limit=-1) -> typing.List[str]:
    '''Get any main subject associated with variable as long as it has time component'''

    main_subject_query = f'''
# SELECT DISTINCT ?main_subject ?main_subject_id
SELECT DISTINCT ?main_subject_id
WHERE {{
  VALUES(?variable_ ?p ?ps) {{
      (wd:{variable} p:{variable} ps:{variable})
  }}

  ?main_subject_ ?p ?o .

  ?o pq:P585 ?any

#  ?main_subject_ skos:prefLabel ?main_subject .
#  FILTER((LANG(?main_subject1)) = "en")
  BIND(REPLACE(STR(?main_subject_), "(^.*)(Q\\\\d+$)", "$2") AS ?main_subject_id)
  BIND(REPLACE(STR(?main_subject_id), "(^.*)(P\\\\d+$)", "$2") AS ?main_subject_id)

  SERVICE wikibase:label {{bd:serviceParam wikibase:language "en". }}
}}
'''
    if limit > -1:
        main_subject_query += f'LIMIT {limit}'
    sparql.setQuery(main_subject_query)
    sparql.setReturnFormat(JSON)
    # print(main_subject_query)
    response = sparql.query().convert()
    # print(response)
    main_subject_ids = [d['main_subject_id']['value'] for d in response['results']['bindings']]
    main_subject_ids.sort()
    return main_subject_ids

def get_times(variable) -> dict:
    '''Get start and end times'''
    query = f'''
SELECT (MIN(?pqv) AS ?start) (MAX(?pqv) AS ?end) WHERE {{
  VALUES ?qualifier {{
    pq:P585
  }}
  ?place p:{variable} ?statement.
  ?statement ?qualifier ?pqv.
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
}}
'''
    sparql.setQuery(query)
    sparql.setReturnFormat(JSON)
    response = sparql.query().convert()
    if response['results']['bindings'][0]:
        return {
            'startTime': response['results']['bindings'][0]['start']['value'],
            'endTime': response['results']['bindings'][0]['end']['value']
        }
    else:
        print('No time bounds:', variable)
        return {}

def get_count(variable, places) -> dict:
    '''Get row count'''
    variable_uri = 'p:' + variable
    place_uris = ['wd:' + x for x in places]
    total = len(place_uris)
    step = 500
    i = 0
    count = 0
    while i < total:
        qualifer_query = f'''
SELECT (COUNT(?statement) as ?count) WHERE {{
  VALUES ?place {{ {' '.join(place_uris[i:i+step])} }}
  ?place {variable_uri} ?statement.
  ?statement pq:P585 ?pqv_.
}}
'''
        sparql.setQuery(qualifer_query)
        sparql.setReturnFormat(JSON)
        response = sparql.query().convert()
        count += int(response['results']['bindings'][0]['count']['value'])
        i += step
    result = {'count': count}
    return result

def get_precision_and_qualifiers(variable, places) -> dict:
    '''Get precision (data interval) and qualifiers'''
    variable_uri = 'p:' + variable
    place_uris = ['wd:' + x for x in places[:50]]
    qualifer_query = f'''

SELECT DISTINCT ?qualifierLabel ?qualifierUri ?time_precision WHERE {{
  VALUES ?place {{ {' '.join(place_uris[:50])} }}
  ?place {variable_uri} ?statement.
  OPTIONAL {{
    ?statement ?pq ?pqv.
    ?qualifier wikibase:qualifier ?pq.
    BIND(STR(REPLACE(STR(?pq), STR(<http://www.wikidata.org/prop/qualifier/>), "pq:")) AS ?qualifierUri)
  }}
  ?statement (pqv:P585/wikibase:timePrecision) ?time_precision.
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
}}
'''
    sparql.setQuery(qualifer_query)
    sparql.setReturnFormat(JSON)
    response = sparql.query().convert()
    # maps qualifier property to its label
    qualifiers = {}
    precision = []
    for record in response['results']['bindings']:
        qualifiers[record['qualifierUri']['value']] = record['qualifierLabel']['value']
        labels.add(record['qualifierUri']['value'], record['qualifierLabel']['value'])
        p = int(record['time_precision']['value'])
        if p not in precision:
            precision.append(p)

    # Lookup qualifier value labels
    qualifer_label_query = f'''
SELECT DISTINCT ?qualifier ?pqv ?pqv_Label WHERE {{
  VALUES ?place {{ {' '.join(place_uris[:50])} }}
  ?place {variable_uri} ?statement.
  ?statement ?qualifier_ ?pqv_.
  FILTER(STRSTARTS(STR(?pqv_), "http://www.wikidata.org/entity/"))
  BIND(REPLACE(STR(?pqv_), "(^.*)(Q\\\\d+$)", "$2") AS ?pqv)
  BIND(STR(REPLACE(STR(?qualifier_), "http://www.wikidata.org/prop/qualifier/", "pq:")) AS ?qualifier)
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
}}
'''
    sparql.setQuery(qualifer_label_query)
    sparql.setReturnFormat(JSON)
    response = sparql.query().convert()

    for record in response['results']['bindings']:
        labels.add(record['pqv']['value'], record['pqv_Label']['value'])
    return {
        '_precision': precision,
        'qualifier': qualifiers,
        }

def get_quantity_units(variable, places) -> typing.List[dict]:
    '''get unit of measure'''
    place_uris = ['wd:' + x for x in places[:50]]
    quantity_query = f'''
SELECT DISTINCT ?unit ?unit_Label
WHERE {{
  VALUES ?place {{ {' '.join(place_uris[:50])} }}
  ?place p:{variable} ?statement.
  ?statement psv:{variable}/wikibase:quantityUnit ?unit_
  BIND(STR(REPLACE(STR(?unit_), "(^.*)(Q\\\\d+$)", "$2")) AS ?unit)
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
}}
'''
    sparql.setQuery(quantity_query)
    sparql.setReturnFormat(JSON)
    response = sparql.query().convert()
    units = []
    for record in response['results']['bindings']:
        unit = {}
        unit['name'] = record['unit_Label']['value']
        unit['identifier'] = record['unit']['value']
        units.append(unit)
    return {'unitOfMeasure': units}

def get_basic_metdata(input_file: str) -> typing.List[dict]:
    result = []
    if input_file.endswith('.json'):
        # Assumes json is a dictionary, where key is a property name
        # and value is another dictionary with fields label,
        # description and alias
        with open(input_file) as f:
            all_metadata = json.load(f)
        for key, value in all_metadata.items():
            variable_metadata = VariableMetadata()
            setattr(variable_metadata, 'correspondsToProperty', key)
            setattr(variable_metadata, 'name', value['label'])
            setattr(variable_metadata, 'description', value['description'])
            result.append(variable_metadata)
    elif input_file.endswith('.tsv'):
        all_metadata = {}
        with open(input_file, 'r') as csvfile:
            reader = csv.DictReader(csvfile, delimiter='\t')
            for row in reader:
                property_name = row['node1']
                if property_name not in all_metadata:
                    all_metadata[property_name] = {'label': '', 'description': '', 'aliases': []}
                if row['label'] == 'label':
                    all_metadata[property_name]['label'] = row['node2']
                if row['label'] == 'description' or row['label'] == 'descriptions':
                    all_metadata[property_name]['description'] = row['node2']
        for key, value in all_metadata.items():
            variable_metadata = VariableMetadata()
            setattr(variable_metadata, 'correspondsToProperty', key)
            if 'label' in value:
                setattr(variable_metadata, 'name', value['label'])
            if 'description' in value:
                setattr(variable_metadata, 'description', value['description'])
            result.append(variable_metadata)
    else:
        raise ValueError('Basic variable metadata file suffix not recognized: ' + input_file)
    return result


def query_main_subjects_from_cache_index(metadata_list: typing.List[dict], output_jsonl_path: str, *, limit=6000):
    # Look up main subject of properties. Limit the number main subjects to 6000.
    # os.path.join(settings.BACKEND_DIR, 'metadata', 'variables-main-subject.jsonl')
    print('Main subjects start: ', datetime.datetime.now())
    with open(output_jsonl_path, 'w') as f:
        count = 0
        empty = 0
        for i, variable_metadata in enumerate(metadata_list):
            if i % 1000 == 0:
                print(i)
            count += 1
            variable = variable_metadata.correspondsToProperty
            variable_metadata.mainSubject = gather_main_subject(variable, limit)
            print(variable, len(variable_metadata.mainSubject))
            is_empty = len(variable_metadata.mainSubject) == 0
            if is_empty:
                empty += 1
            if not is_empty:
                json_dump = variable_metadata.to_json(include_internal_fields=True)
                f.write(json_dump)
                f.write('\n')

    print('Main subjects done: ', datetime.datetime.now())
    print('number of variables:', count)
    print('number of empty main subjects:', empty)

def query_metadata(input_jsonl_path: str, output_jsonl_path: str):
    # Add more metadata
    print('Query metadata start: ', datetime.datetime.now())
    # input: os.path.join(settings.BACKEND_DIR, 'metadata', 'variables-main-subject.jsonl')
    # output: os.path.join(settings.BACKEND_DIR, 'metadata', 'variables-more-metadata.jsonl')
    with open(input_jsonl_path, 'r') as input, \
         open(output_jsonl_path, 'w') as output:
        for i, line in enumerate(input):
            if i % 100 == 0:
                print(i)
            variable_metadata = VariableMetadata()
            variable_metadata.from_json(line)
            variable_id = variable_metadata.correspondsToProperty
            # index = int(variable_id[1:])
            # print(index)
            level = -1
            if variable_metadata.mainSubject:
                # Get max administration level (most local level)
                level = location.get_max_admin_level([x for x in variable_metadata.mainSubject])
                variable_metadata._max_admin_level = int(level)

                # get start and end time
                times = get_times(variable_id)
                variable_metadata.update(times)

                # get precision (data interval) and qualifiers
                p_and_q = get_precision_and_qualifiers(variable_id, variable_metadata.mainSubject)
                variable_metadata.update(p_and_q)

                # Assume the finest interval
                if variable_metadata._precision:
                    variable_metadata.dataInterval = max(variable_metadata._precision)

                units = get_quantity_units(variable_id, variable_metadata.mainSubject)
                variable_metadata.update(units)

                # get row count
                count_obj: typing.Dict = get_count(variable_id, variable_metadata.mainSubject)
                variable_metadata.update(count_obj)

                json_dump = variable_metadata.to_json(include_internal_fields=True)
                output.write(json_dump)
                output.write('\n')
    print('Query metadata done : ', datetime.datetime.now())

def add_curated_metadata(input_jsonl_path: str, output_jsonl_path: str):
    print('Add curated metadata start: ', datetime.datetime.now())
    # Load curated variable metadata fields. Metadata here overides automatically discovered metadata
    curated = {}
    with open(os.path.join(settings.BACKEND_DIR, 'metadata', 'variables-curated.jsonl'), 'r') as f:
        for line in f:
            metadata = json.loads(line)
            curated[metadata['correspondsToProperty']] = metadata

    property_definitions = {}
    for yaml_file in Path('metadata', 'property-yamls').glob('*.yaml'):
        with open(yaml_file, 'r') as input:
            property_definitions.update(load(input, Loader=Loader))

    with open(input_jsonl_path, 'r') as input, \
         open(output_jsonl_path, 'w') as output:
        for line in input:
            variable_metadata = VariableMetadata()
            variable_metadata.from_json(line)
            variable_id = variable_metadata.correspondsToProperty
            variable_metadata.variableID = 'V' + variable_metadata.correspondsToProperty
            if variable_id in curated:
                variable_metadata.update(curated[variable_id])
            if variable_id in property_definitions:
                definition = property_definitions[variable_id]
                label = definition.get('label', {}).get('en', '')
                if isinstance(label, list):
                    label = label[0]
                description = definition.get('description', {}).get('en', '')
                if isinstance(description, list):
                    description = description[0]
                urls = []
                identifiers = []
                if not description:
                    description = label
                # URLs
                for url_def in definition.get('statements', {}).get('P1896', []):
                    if 'value' in url_def:
                        urls.append(url_def['value'])
                # world bank ID
                for url in urls:
                    if 'data.worldbank.org/indicator/' in url:
                        identifiers.append(url.split('/')[-1])
                variable_metadata.name = label
                variable_metadata.description = description
                if identifiers:
                    variable_metadata.variableID = 'V' + identifiers[0]
            json_dump = variable_metadata.to_json(include_internal_fields=True)
            output.write(json_dump)
            output.write('\n')
    print('Add curated metadata done : ', datetime.datetime.now())

def update_labels(jsonl_path: str):
    '''
    Update labels using given metadata jsonl file.
    '''
    # os.path.join(settings.BACKEND_DIR, 'metadata', 'variables-add-count.jsonl')
    print('update labels: ', datetime.datetime.now())
    with open(jsonl_path, 'r') as input:
        for line in input:
            variable_metadata = VariableMetadata()
            variable_metadata.from_json(line)
            for main_subject_id  in variable_metadata.mainSubject:
                if main_subject_id.startswith('http:'):
                    main_subject_id = re.sub(r'.*/', '', main_subject_id)
                if main_subject_id not in labels:
                    labels.add_missing_label(main_subject_id)
    print('Number of missing labels: ', len(labels._missing_labels))
    print(labels._missing_labels)
    # labels.query_missing_labels()
    # labels.save()
    print('done labels:   ', datetime.datetime.now())

def generate_objects(input_jsonl_path: str, output_jsonl_path: str):
    print('Convert to objects start: ', datetime.datetime.now())
    with open(input_jsonl_path, 'r') as input, \
         open(output_jsonl_path, 'w') as output:
        for line in input:
            variable_metadata = VariableMetadata()
            variable_metadata.from_json(line)
            variable_metadata.country = labels.to_object(location.lookup_countries(variable_metadata.mainSubject))
            variable_metadata.location = labels.to_object(location.filter(variable_metadata.mainSubject))
            variable_metadata.mainSubject = labels.to_object(variable_metadata.mainSubject)
            json_dump = variable_metadata.to_json(include_internal_fields=True)
            output.write(json_dump)
            output.write('\n')
    print('Convert to objects done : ', datetime.datetime.now())

if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Generate metadata cache for faster queries')
    parser.add_argument('--sparql-endpoint', default=settings.WD_QUERY_ENDPOINT,
                        help='SPARQL endpoint URL (default: %(default)s)')
    parser.add_argument('--variable-properties-file',
                        help='''
KGKTK variable properties tsv file. This file defines which properties
to generate metadata. If not given then the cache index wikidata.json
will be used define the set of properties.''')
    parser.add_argument('--output-prefix', default='',
                        help='Output file prefix. Use it to differentiate among differ versions of variable metadata')

    args = parser.parse_args()
    prefix = args.output_prefix

    final_result_file = os.path.join(settings.BACKEND_DIR, 'metadata', f'{prefix}variables.jsonl')
    final_result_gz_file = os.path.join(settings.BACKEND_DIR, 'metadata', f'{prefix}variables.jsonl.gz')
    if os.path.exists(final_result_file):
        print('Output metadata file already exists. Delete it or move it.')
        print(final_result_file)
        exit(1)

    if os.path.exists(final_result_file):
        print('Output metadata gz file already exists. Delete it or move it.')
        print(final_result_gz_file)
        exit(2)

    sparql = SPARQLWrapper(args.sparql_endpoint)

    variable_properties_file = os.path.join(settings.WIKIDATA_INDEX_PATH, 'wikidata.json')
    if args.variable_properties_file:
        variable_properties_file = args.variable_properties_file

    basic_metadata = get_basic_metdata(variable_properties_file)

    # get main subject nodes for properties in cahce index
    main_subj_file = os.path.join(settings.BACKEND_DIR, 'metadata', f'{prefix}variables-main-subject.jsonl')
    query_main_subjects_from_cache_index(basic_metadata, main_subj_file)

    # Add metadata
    more_metadata_file = os.path.join(settings.BACKEND_DIR, 'metadata', f'{prefix}variables-more-metadata.jsonl')
    query_metadata(main_subj_file, more_metadata_file)

    # Add curated metadata
    curated_metadata_file = os.path.join(settings.BACKEND_DIR, 'metadata', f'{prefix}variables-add-curated.jsonl')
    add_curated_metadata(more_metadata_file, curated_metadata_file)

    # Add additional labels, if needed
    update_labels(curated_metadata_file)

    # convert to objects
    generate_objects(curated_metadata_file, final_result_file)

    # zip variable metadata
    os.system(f"gzip {final_result_file}")
