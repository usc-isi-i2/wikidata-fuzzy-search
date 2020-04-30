
import datetime
import json
import os
import re
import traceback
import typing

from enum import Enum
from pprint import pprint

from flask import request, make_response
from flask_restful import Resource
from SPARQLWrapper import SPARQLWrapper, JSON, CSV

import numpy as np
import pandas as pd

import settings

sparql = SPARQLWrapper(settings.WD_QUERY_ENDPOINT)

# Load curated variable metadata fields. Metadata here overides automatically discovered metadata
curated = {}
with open(os.path.join(settings.BACKEND_DIR, 'metadata', 'variables-curated.jsonl'), 'r') as f:
    for line in f:
        print(line)
        metadata = json.loads(line)
        curated[metadata['variable_id']] = metadata

# Load labels
labels = {}
labels_file = os.path.join(settings.BACKEND_DIR, 'metadata', 'labels.tsv')
labels_gz_file = os.path.join(settings.BACKEND_DIR, 'metadata', 'labels.tsv.gz')
if os.path.exists(labels_gz_file) and not os.path.exists(labels_file):
    os.system(f'gunzip {labels_gz_file}')
with open(labels_file, 'r') as f:
    next(f)
    for line in f:
        node, _, label = line.rstrip('/n').split('\t')
        labels[node] = label

# Load geoplace containment
with open(os.path.join(settings.BACKEND_DIR, 'metadata', 'contains.json')) as f:
    contains = json.load(f)

region_df = pd.read_csv(os.path.join(settings.BACKEND_DIR, 'metadata', 'region.csv'), dtype=str)
region_df = region_df.fillna('')

admin3_id = set(region_df.loc[:, 'admin3_id'].unique())
admin2_id = set(region_df.loc[:, 'admin2_id'].unique())
admin1_id = set(region_df.loc[:, 'admin1_id'].unique())
country_id = set(region_df.loc[:, 'country_id'].unique())

def get_admin_level(qnode) -> int:
    if qnode.startswith('wd:'):
        qnode = qnode[3:]
    if qnode in admin3_id:
        return 3
    if qnode in admin2_id:
        return 2
    if qnode in admin1_id:
        return 1
    if qnode in country_id:
        return 0
    return -1

def get_alt_admin_level(qnode) -> int:
    # Try contains.json, which has more entries
    level = -1
    if qnode in contains['toAdmin2'].keys():
        level = 3
    if qnode in contains['toAdmin1'].keys():
        level = 2
    if qnode in contains['toCountry'].keys():
        level = 1
    if qnode in contains['toCountry'].values():
        level = 0
    return level

def get_max_admin_level(qnode_list: typing.List[str]) -> int:
    levels = np.array([get_admin_level(x) for x in qnode_list])
    (unique, counts) = np.unique(levels, return_counts=True)
    if len(unique) == 1:
        return unique[0]
    print(f'multiple levels: {unique} {counts}')
    return max(unique)


def gather_main_subject(variable, limit=-1) -> typing.List[str]:
    main_subject_query = f'''
# SELECT DISTINCT ?main_subject ?main_subject_id
SELECT DISTINCT ?main_subject_id
WHERE {{
  VALUES(?variable_ ?p ?ps) {{
      (wd:{variable} p:{variable} ps:{variable})
  }}

  ?main_subject_ ?p ?o .
#  ?main_subject_ skos:prefLabel ?main_subject .
#  FILTER((LANG(?main_subject1)) = "en")
  BIND(REPLACE(STR(?main_subject_), "(^.*)(Q.\\\\d*$)", "$2") AS ?main_subject_id)
  BIND(REPLACE(STR(?main_subject_id), "(^.*)(P.\\\\d*$)", "$2") AS ?main_subject_id)

  SERVICE wikibase:label {{bd:serviceParam wikibase:language "en". }}
}}
'''
    if limit > -1:
        main_subject_query += f'LIMIT {limit}'
    sparql.setQuery(main_subject_query)
    sparql.setReturnFormat(JSON)
    response = sparql.query().convert()
    main_subject_ids = [d['main_subject_id']['value'] for d in response['results']['bindings']]
    return main_subject_ids

def get_times(variable) -> dict:
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
        return {'startTime': response['results']['bindings'][0]['start']['value'],
                'endTime': response['results']['bindings'][0]['end']['value']
        }
    else:
        print('No time bounds:', variable)
        return {}

def get_precision_and_qualifiers(variable, places) -> dict:
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
    qualifiers = {}
    qualifier_label = {}
    precision = -1
    for record in response['results']['bindings']:
        qualifiers[record['qualifierLabel']['value']] = record['qualifierUri']['value']
        precision = max(precision, int(record['time_precision']['value']))

    # Lookup qualifier value labels
    qualifer_label_query = f'''
SELECT DISTINCT ?qualifier ?pqv ?pqv_Label WHERE {{
  VALUES ?place {{ {' '.join(place_uris[:100])} }}
  VALUES ?qualifier {{ {' '.join(qualifiers.values())} }}
  ?place {variable_uri} ?statement.
  ?statement ?qualifier ?pqv_.
  FILTER(!isliteral(?pqv_))
  BIND(REPLACE(STR(?pqv_), "(^.*)(Q.\\\\d+$)", "$2") AS ?pqv)
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
}}
'''
    sparql.setQuery(qualifer_label_query)
    sparql.setReturnFormat(JSON)
    response = sparql.query().convert()

    for record in response['results']['bindings']:
        qualifier_label[record['pqv']['value']] = record['pqv_Label']['value']

    return {
        'precision': precision,
        'qualifiers': qualifiers,
        'qualifierLabels': qualifier_label
        }

with open(os.path.join(settings.WIKIDATA_INDEX_PATH, 'wikidata.json')) as f:
    # fields: label, description, alias
    all_metadata = json.load(f)

# Look up main subject of properties. Limit the number main subjects to 6000.
print(datetime.datetime.now())
with open(os.path.join(settings.BACKEND_DIR, 'metadata', 'variables-main-subject.jsonl'), 'w') as f:
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
        metadata['main_subject_id'] = gather_main_subject(variable, 6000)
        if len(metadata['main_subject_id']) == 0:
            empty += 1
        print(variable, len(metadata['main_subject_id']))
        json_dump = json.dumps(metadata)
        f.write(json_dump)
        f.write('\n')

print(datetime.datetime.now())
print('number of variables:', count)
print('number of empty main subjects:', empty)

# Add more metadata
print('start 2', datetime.datetime.now())
with open(os.path.join(settings.BACKEND_DIR, 'metadata', 'variables-main-subject.jsonl'), 'r') as input, \
     open(os.path.join(settings.BACKEND_DIR, 'metadata', 'variables-more-metadata.jsonl'), 'w') as output:
    for i, line in enumerate(input):
        metadata = json.loads(line)
        variable_id = metadata['variable_id']
        index = int(variable_id[1:])
        print(index)
        try:
            level = -1
            if metadata['main_subject_id']:
                levels = np.array([get_alt_admin_level(x) for x in metadata['main_subject_id']])
                (unique, counts) = np.unique(levels, return_counts=True)
                if len(unique) == 1:
                    level = unique[0]
                else:
                    level = max(unique)
                    print(f'{variable_id} main subject at multiple levels: {unique} {counts}')
                times = get_times(variable_id)
                p_and_q = get_precision_and_qualifiers(variable_id, metadata['main_subject_id'])
                metadata.update(p_and_q)
                metadata.update(times)
                json_dump = json.dumps(metadata)
                output.write(json_dump)
                output.write('\n')
        except:
            print('Failed:', variable_id)
            traceback.print_exc()
print('end 2', datetime.datetime.now())

print('start 3', datetime.datetime.now())
with open(os.path.join(settings.BACKEND_DIR, 'metadata', 'variables-more-metadata.jsonl'), 'r') as input, \
     open(os.path.join(settings.BACKEND_DIR, 'metadata', 'variables-add-curated.jsonl'), 'w') as output:
    for i, line in enumerate(input):
        metadata = json.loads(line)
        variable_id = metadata['variable_id']
        if variable_id in curated:
            metadata.update(curated[variable_id])
            json_dump = json.dumps(metadata)
            output.write(json_dump)
            output.write('\n')
            print(json_dump)
        else:
            output.write(line)
print('end 3', datetime.datetime.now())


# Update labels
print('start 4', datetime.datetime.now())
missing_labels = []
add_labels = {}
with open(os.path.join(settings.BACKEND_DIR, 'metadata', 'variables-add-curated.jsonl'), 'r') as input:
    for i, line in enumerate(input):
        metadata = json.loads(line)
        for main_subject_id  in metadata['main_subject_id']:
            if main_subject_id not in labels:
                missing_labels.append(main_subject_id)
        for qualifier_id, label in metadata['qualifierLabels'].items():
            if qualifier_id not in labels:
                add_labels[qualifier_id] = label

start = 0
delta = 100
while start < len(missing_labels):
    print(start)
    query = f'''
SELECT ?node ?nodeLabel WHERE {{
  VALUES ?node {{
    {' '.join(['wd:'+x for x in missing_labels[start:start+delta]])}
  }}
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
}}
'''
    sparql.setQuery(query)
    sparql.setReturnFormat(JSON)
    response = sparql.query().convert()
    for record in response['results']['bindings']:
        add_labels[record['node']['value']] = record['nodeLabel']['value']
    start += delta

pattern = re.compile('.*(Q[0-9]+)')
with open(labels_file, 'a') as f:
    for node, label in add_labels.items():
        m = pattern.match(node)
        if m:
            print(f'{m.group(1)}\tlabel\t{label}', file=f)
        else:
            print(f'Skip label: {node} {label}')
os.system(f'gzip {labels_file}')
