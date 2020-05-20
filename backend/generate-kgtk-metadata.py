'''
Script to convert metadata in jsonl format to kgtk format.
'''
import json
import os
import typing

import settings

with open(os.path.join(settings.BACKEND_DIR, 'metadata', 'contains.json')) as f:
    contains = json.load(f)

header = ['node1', 'property', 'node2', 'id', 'label;label']

property = {
    'P31': 'instance of',
    'label': '',
    'P1476': 'title',
    'P1813': 'short name',
    'descriptions': '',
    # 'P1687': 'Wikidata property',
    'correspondsToProperty': 'corresponds to',
    'P921': 'main subject',
    'P1880': 'measurement scale',
    'P17': 'country',
    'P580': 'start time',
    'P582': 'end time',
    'P6339': 'data interval',
    'P1114': 'quantity',
    'dataset': '',
    'hasQualifier': '',
    'variableMeasured': ''
}

time_interval = {
    6: 'Q36507',  # millennium
    7: 'Q578',    # century
    8: 'Q39911',  # decade
    9: 'Q577',    # year
    10: 'Q5151',  # month
    11: 'Q573',   # day
    12: 'Q25235', # hour
    13: 'Q7727',  # minute
    14: 'Q11574'  # second
}
qnode_base = 201000000
edge_id_base = 0
defined_label = set()

def get_qnode():
    global qnode_base
    node = f'Q{qnode_base}'
    qnode_base += 1
    return node

def get_edge_id():
    global edge_id_base
    edge = f'E{edge_id_base}'
    edge_id_base += 1
    return edge

def get_time_literal(datetime: str, precision: int) -> str:
    return f"^{datetime}/{precision}"

def lookup_countries(qnodes: typing.List[str]) -> typing.Set[str]:
    countries = set()
    for qnode in qnodes:
        if qnode in contains['toCountry']:
            countries.add(contains['toCountry'][qnode])
    return countries

def gen_edge(node1, label, node2, *, gen_id=False) -> dict:
    edge = {
        'node1': node1,
        'property': label,
        'node2': node2,
        'property;label': property.get(label, '')
        }
    if gen_id:
        edge['id'] = get_edge_id()
    return edge

def generate_variable_kgtk(qnode: str, desc: dict) -> typing.List[typing.Dict]:
    global defined_label

    edges = []
    title = desc['name']
    short_name = ''
    for alias in desc['aliases']:
        if len(alias) < len(title):
            short_name = alias
            break

    # Sort to make diff comparison of outputs easier
    countries = [x for x in lookup_countries(desc['main_subject_id'])]
    countries.sort()

    edges.append(gen_edge('Q2013', 'variableMeasured', qnode))
    edges.append(gen_edge(qnode, 'dataset', 'Q2013'))
    edges.append(gen_edge(qnode, 'P31', 'Q50701'))
    edges.append(gen_edge(qnode, 'label', title))
    edges.append(gen_edge(qnode, 'P1476', title))
    if short_name:
        edges.append(gen_edge(qnode, 'P1813', short_name))
    edges.append(gen_edge(qnode, 'descriptions', desc['description']))
    # edges.append(gen_edge(qnode, 'P1687', desc['variable_id']))
    edges.append(gen_edge(qnode, 'correspondsToProperty', desc['variable_id']))

    units = desc.get('units', [])
    for unit in units:
        edges.append(gen_edge(qnode, 'P1880', unit['unit_id']))
        if unit['unit_id'] not in defined_label:
            defined_label.add(unit['unit_id'])
            edges.append(gen_edge(unit['unit_id'], 'label', unit['unit']))

    for main_subject in desc['main_subject_id']:
        edges.append(gen_edge(qnode, 'P921', main_subject))

    for country in countries:
        edges.append(gen_edge(qnode, 'P17', country))

    edges.append(gen_edge(qnode, 'P580', get_time_literal(desc['startTime'], desc['precision'])))
    edges.append(gen_edge(qnode, 'P582', get_time_literal(desc['endTime'], desc['precision'])))
    edges.append(gen_edge(qnode, 'P6339', time_interval[desc['precision']]))
    edges.append(gen_edge(qnode, 'P1114', desc['count']))
    if desc['qualifiers']:
        for qualifier in desc['qualifiers']:
            qualifier_objects = desc['qualifierObjects'].get(qualifier, [])
            gen_id = len(qualifier_objects) > 0
            if qualifier.startswith('pq:'):
                qualifier = qualifier[3:]
            edges.append(gen_edge(qnode, 'hasQualifier', qualifier, gen_id=gen_id))
            edge_id = edges[-1].get('id', '')
            for obj in qualifier_objects:
                edges.append(gen_edge(edge_id, 'P921', obj))
                if obj not in defined_label:
                    defined_label.add(obj)
                    edges.append(gen_edge(obj, 'label', desc['qualifierLabels'][obj]))
    return edges

def print_edges(out: typing.TextIO, edges: typing.List) -> None:
    for edge in edges:
        print('\t'.join([str(edge.get(key, '')) for key in header]), file=out)


with open(os.path.join(settings.BACKEND_DIR, 'metadata', 'variables.jsonl'), 'r') as input, \
     open(os.path.join(settings.BACKEND_DIR, 'metadata', 'variable-metadata.tsv'), 'w') as output:
    print('\t'.join(header), file=output)
    property_edges = []
    property_edges.append(gen_edge('variableMeasured', 'label', 'variable measured'))
    property_edges.append(gen_edge('dataset', 'label', 'dataset'))
    property_edges.append(gen_edge('hasQualifier', 'label', 'has qualifier'))
    print_edges(output, property_edges)
    for line in input:
        metadata = json.loads(line)
        new_qnode = get_qnode()
        variable_edges = generate_variable_kgtk(new_qnode, metadata)
        print_edges(output, variable_edges)
