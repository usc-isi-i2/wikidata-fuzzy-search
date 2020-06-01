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

from SPARQLWrapper import SPARQLWrapper, JSON  # type: ignore

import settings  # type: ignore
from util import Labels, Location

# sparql = SPARQLWrapper(settings.WD_QUERY_ENDPOINT)

# Load qnode labels
labels = Labels()

# Load curated variable metadata fields. Metadata here overides automatically discovered metadata
curated = {}
with open(os.path.join(settings.BACKEND_DIR, 'metadata', 'variables-curated.jsonl'), 'r') as f:
    for line in f:
        metadata = json.loads(line)
        curated[metadata['variable_id']] = metadata

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
    print(main_subject_query)
    response = sparql.query().convert()
    print(response)
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
    place_uris = ['wd:' + x for x in places[:5]]
    qualifer_query = f'''

SELECT DISTINCT ?qualifierLabel ?qualifierUri ?time_precision WHERE {{
  VALUES ?place {{ {' '.join(place_uris[:5])} }}
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
    # maps qualifier object qnode to its label
    qualifier_label = {}
    # maps qualifier property to a list of its objct qnodes
    qualifier_objs: typing.Dict[str, list] = {}
    precision = []
    for record in response['results']['bindings']:
        # qualifiers[record['qualifierLabel']['value']] = record['qualifierUri']['value']
        qualifiers[record['qualifierUri']['value']] = record['qualifierLabel']['value']
        p = int(record['time_precision']['value'])
        if p not in precision:
            precision.append(p)

    # Lookup qualifier value labels
    qualifer_label_query = f'''
SELECT DISTINCT ?qualifier ?pqv ?pqv_Label WHERE {{
  VALUES ?place {{ {' '.join(place_uris[:100])} }}
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
        qualifier_label[record['pqv']['value']] = record['pqv_Label']['value']
        if record['qualifier']['value'] in qualifier_objs:
            qualifier_objs[record['qualifier']['value']].append(record['pqv']['value'])
        else:
            qualifier_objs[record['qualifier']['value']] = [record['pqv']['value']]
    return {
        'precision': precision,
        'qualifiers': qualifiers,
        'qualifierObjects':qualifier_objs,
        'qualifierLabels': qualifier_label
        }

def get_quantity_units(variable, places) -> typing.List[dict]:
    '''get unit of measure'''
    place_uris = ['wd:' + x for x in places[:5]]
    quantity_query = f'''
SELECT DISTINCT ?unit ?unit_Label
WHERE {{
  VALUES ?place {{ {' '.join(place_uris[:5])} }}
  ?place p:{variable} ?statement.
  ?statement psv:{variable}/wikibase:quantityUnit ?unit_
  BIND(STR(REPLACE(STR(?unit_), "(^.*)(Q\\\\d+$)", "$2")) AS ?unit)
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
}}
'''
    sparql.setQuery(quantity_query)
    sparql.setReturnFormat(JSON)
    response = sparql.query().convert()
    results = []
    for record in response['results']['bindings']:
        unit = {}
        unit['unit'] = record['unit_Label']['value']
        unit['unit_id'] = record['unit']['value']
        results.append(unit)
    return results

def get_basic_metdata(input_file: str) -> dict:
    if input_file.endswith('.json'):
        # Assumes json is a dictionary, where key is a property name
        # and value is another dictionary with fields label,
        # description and alias
        with open(input_file) as f:
            all_metadata = json.load(f)
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
    else:
        raise ValueError('Basic variable metadata file suffix not recognized: ' + input_file)
    return all_metadata


def query_main_subjects_from_cache_index(all_metadata: dict, output_jsonl_path: str, *, limit=6000):
    # Look up main subject of properties. Limit the number main subjects to 6000.
    # os.path.join(settings.BACKEND_DIR, 'metadata', 'variables-main-subject.jsonl')
    print('Main subjects start: ', datetime.datetime.now())
    with open(output_jsonl_path, 'w') as f:
        count = 0
        empty = 0
        for variable, values in all_metadata.items():
            count += 1
            metadata = {
                'name': values['label'],
                'variable_id': variable,
                'description': values['description'],
                'aliases': values['aliases']
            }
            metadata['main_subject_id'] = gather_main_subject(variable, limit)
            print(variable, len(metadata['main_subject_id']))
            is_empty = len(metadata['main_subject_id']) == 0
            if is_empty:
                empty += 1
            if not is_empty:
                json_dump = json.dumps(metadata)
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
        for line in input:
            metadata = json.loads(line)
            variable_id = metadata['variable_id']
            index = int(variable_id[1:])
            print(index)
            try:
                level = -1
                if metadata['main_subject_id']:
                    # Get max administration level (most local level)
                    level = location.get_max_admin_level([x for x in metadata['main_subject_id']])
                    metadata['admin_level'] = int(level)

                    # get start and end time
                    times = get_times(variable_id)
                    metadata.update(times)

                    # get precision (data interval) and qualifiers
                    p_and_q = get_precision_and_qualifiers(variable_id, metadata['main_subject_id'])
                    metadata.update(p_and_q)

                    units = get_quantity_units(variable_id, metadata['main_subject_id'])
                    metadata['units'] = units

                    # get row count
                    count_obj: typing.Dict = get_count(variable_id, metadata['main_subject_id'])
                    metadata.update(count_obj)

                    json_dump = json.dumps(metadata)
                    output.write(json_dump)
                    output.write('\n')
            except:
                print('Failed:', variable_id)
                traceback.print_exc()
    print('Query metadata done : ', datetime.datetime.now())

def add_curated_metadata(input_jsonl_path: str, output_jsonl_path: str):
    print('Add curated metadata start: ', datetime.datetime.now())
    # os.path.join(settings.BACKEND_DIR, 'metadata', 'variables-more-metadata.jsonl'), 'r'
    # os.path.join(settings.BACKEND_DIR, 'metadata', 'variables-add-curated.jsonl'), 'w'
    with open(input_jsonl_path, 'r') as input, \
         open(output_jsonl_path, 'w') as output:
        for line in input:
            metadata = json.loads(line)
            variable_id = metadata['variable_id']
            if variable_id in curated:
                metadata.update(curated[variable_id])
                json_dump = json.dumps(metadata)
                output.write(json_dump)
                output.write('\n')
            else:
                output.write(line)
    print('Add curated metadata done : ', datetime.datetime.now())

def update_labels(jsonl_path: str):
    '''
    Update labels using given metadata jsonl file.
    '''
    # os.path.join(settings.BACKEND_DIR, 'metadata', 'variables-add-count.jsonl')
    print('update labels: ', datetime.datetime.now())
    with open(jsonl_path, 'r') as input:
        for line in input:
            metadata = json.loads(line)
            for main_subject_id  in metadata['main_subject_id']:
                if main_subject_id.startswith('http:'):
                    main_subject_id = re.sub(r'.*/', '', main_subject_id)
                if main_subject_id not in labels:
                    labels.add_missing_label(main_subject_id)
                    #missing_labels.add(main_subject_id)
            for qualifier_id, label in metadata['qualifierLabels'].items():
                if qualifier_id.startswith('http:'):
                    qualifier_id = re.sub(r'.*/', '', qualifier_id)
                if qualifier_id not in labels:
                    labels.add(qualifier_id, label)
                    #add_labels[qualifier_id] = label

    # for values in contains.values():
    #     for q_from, q_to in values.items():
    #         if q_from not in labels:
    #             labels.add_missing_label(q_from)
    #         if q_to not in labels:
    #             labels.add_missing_label(q_to)

    labels.query_missing_labels()
    labels.save()
    print('done labels:   ', datetime.datetime.now())

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

    # save and zip variable metadata
    shutil.copyfile(curated_metadata_file, final_result_file)
    os.system(f"gzip {final_result_file}")
