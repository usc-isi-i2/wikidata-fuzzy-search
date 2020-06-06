
import gzip
import json
import shutil
import typing

from pathlib import Path

import numpy as np  # type: ignore

from SPARQLWrapper import SPARQLWrapper, JSON  # type: ignore

import settings  # type: ignore

class DataInterval:
    name_qnode_map = {
        'millennium': 'Q36507',
        'century': 'Q578',
        'decade': 'Q39911',
        'year': 'Q577',
        'month': 'Q5151',
        'day': 'Q573',
        'hour': 'Q25235',
        'minute': 'Q7727',
        'second': 'Q11574'
    }

    int_name_map = {
        6: 'millennium',
        7: 'century',
        8: 'decade',
        9: 'year',
        10: 'month',
        11: 'day',
        12: 'hour',
        13: 'minute',
        14: 'second'
    }

    int_qnode_map = {
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

    name_int_map = {name: value for value, name in int_name_map.items()}
    qnode_name_map = {qnode: name for name, qnode in name_qnode_map.items()}

    @classmethod
    def name_to_qnode(cls, name: str) -> str:
        'Convert date interval name to corresponding qnode'
        name = name.lower()
        try:
            return cls.name_qnode_map[name]
        except KeyError:
            raise ValueError(f'Illegal data interval name: {name}')

    @classmethod
    def qnode_to_name(cls, qnode: str) -> str:
        'Convert date interval name to corresponding qnode'
        try:
            return cls.qnode_name_map[qnode]
        except KeyError:
            raise ValueError(f'Illegal data interval name: {qnode}')

    @classmethod
    def int_to_name(cls, precision: int) -> str:
        'Convert precision to corresponding date interval name'
        try:
            return cls.int_name_map[precision]
        except KeyError:
            raise ValueError(f'Illegal precision value: {precision}')

    @classmethod
    def name_to_int(cls, name: str) -> int:
        'Convert precision to corresponding date interval name'
        try:
            return cls.name_int_map[name]
        except KeyError:
            raise ValueError(f'Illegal data interval name: {name}')

    @classmethod
    def is_name(cls, name) -> bool:
        return name in cls.name_int_map


class TimePrecision:
    int_name_map = {
        0: 'billion years',
        1: 'hundred million years',
        3: 'million years',
        4: 'hundred thousand years',
        5: 'ten thousand years',
        6: 'millennium',
        7: 'century',
        8: 'decade',
        9: 'year',
        10: 'month',
        11: 'day',
        12: 'hour',
        13: 'minute',
        14: 'second'
    }

    name_int_map = {value: key for key, value in int_name_map.items()}

    @classmethod
    def to_name(cls, precision: int) -> str:
        'Convert time precision integer to corresponding name'
        try:
            return cls.int_name_map[precision]
        except KeyError:
            raise ValueError(f'Illegal precision: {precision}')

    @classmethod
    def to_int(cls, name: str) -> int:
        'Convert time precision integer to corresponding name'
        name = name.lower()
        try:
            return cls.name_int_map[name]
        except KeyError:
            raise ValueError(f'Illegal precision value: {name}')

    @classmethod
    def is_name(cls, name: str) -> int:
        return name in cls.name_int_map

class Labels:
    '''Wikidata labels'''
    _labels: typing.Dict[str, str] = {}
    _missing_labels: typing.Set[str] = set()
    _changed = False

    @classmethod
    def initialize(cls):
        labels_gz_file = Path(settings.BACKEND_DIR, 'metadata', 'labels.tsv.gz')
        with gzip.open(labels_gz_file, 'rt') as f:
            next(f)
            for line in f:
                node, _, label = line.rstrip('\n').split('\t')
                cls._labels[node] = label

    def __init__(self):
        if not Labels._labels:
            Labels.initialize()

    def get(self, qnode: str, default: str) -> str:
        return Labels._labels.get(qnode, default)

    def add(self, qnode: str, label: str):
        if qnode == label:
            return
        if qnode in Labels._labels and Labels._labels[qnode] == label:
            return
        Labels._labels[qnode] = label
        Labels._changed = True

    def has_label(self, qnode: str):
        return qnode in Labels._labels

    def __contains__(self, qnode: str):
        return qnode in Labels._labels

    def to_object(self, qnodes: typing.List[str]) -> typing.List[dict]:
        '''Returns list of qnode objects'''
        result = []
        for node in qnodes:
            if node in Labels._labels:
                name = Labels._labels[node]
            else:
                name = node
                Labels._missing_labels.add(node)
            result.append({'name': name, 'identifier': node})
        return result

    def add_missing_label(self, qnode: str):
        Labels._missing_labels.add(qnode)

    def query_missing_labels(self, *, endpoint: str = '') -> dict:
        '''
        Query Wikidata for missing labels
        '''
        if not Labels._missing_labels:
            return {}

        Labels._changed = True
        new_labels = {}
        if not endpoint:
            endpoint = settings.WD_QUERY_ENDPOINT
        sparql = SPARQLWrapper(endpoint)
        start = 0
        delta = 100
        missing_labels = list(Labels._missing_labels)
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
                qnode = record['node']['value']
                qnode = qnode.split('/')[-1]
                new_labels[qnode] = record['nodeLabel']['value']
            start += delta
        Labels._labels.update(new_labels)
        Labels._missing_labels = set()
        return new_labels

    def save(self):
        '''Save labels'''
        if not Labels._changed:
            return

        self._changed = False

        labels_gz_file = Path(settings.BACKEND_DIR, 'metadata', 'labels.tsv.gz')

        # backup file
        version = 0
        files = Path(settings.BACKEND_DIR, 'metadata').glob('labels.tsv.gz.*')
        for backup in files:
            try:
                suffix = int(backup.name.split('.')[-1])
                if suffix >= version:
                    version = suffix + 1
            except ValueError:
                pass
        backup_file = Path(settings.BACKEND_DIR, 'metadata', f'labels.tsv.gz.{version}')
        shutil.copyfile(labels_gz_file, backup_file)

        # clean up
        for key in list(Labels._labels.keys()):
            if key == Labels._labels[key]:
                del Labels._labels[key]

        # index = np.argsort([int(qnode[1:]) for qnode in Labels._labels.keys()])
        keys = np.asarray(list(Labels._labels.keys()))
        index = np.argsort(keys)

        with gzip.open(labels_gz_file, 'wt') as fout:
            print('node1\tlabel\tnode2', file=fout)
            for i in index:
                key = keys[i]
                print(f'{key}\tlabel\t{Labels._labels[key]}', file=fout)

class Location:
    contains: typing.Dict[str, typing.Dict[str, str]] = {}
    countries: typing.Set[str] = set()
    admin1: typing.Set[str] = set()
    admin2: typing.Set[str] = set()
    admin3: typing.Set[str] = set()
    all: typing.Set[str] = set()

    @classmethod
    def initialize(cls):
        with open(Path(settings.BACKEND_DIR, 'metadata', 'contains.json')) as f:
            cls.contains = json.load(f)
        cls.countries = set(cls.contains['toCountry'].values())
        cls.admin1 = set(cls.contains['toAdmin1'].values())
        cls.admin2 = set(cls.contains['toAdmin1'].keys())
        cls.admin3 = set(cls.contains['toAdmin2'].keys())
        cls.all = set(cls.contains['toCountry']).union(
            cls.countries).union(cls.admin1).union(cls.admin2).union(cls.admin3)

    def __init__(self):
        if not Location.contains:
            Location.initialize()
        self.labels = Labels()

    def lookup_countries(self, qnodes: typing.List[str]) -> typing.List[str]:
        '''Returns the set of countries that contain the given list of place qnodes'''
        countries = set()
        for qnode in qnodes:
            if qnode in self.contains['toCountry']:
                countries.add(self.contains['toCountry'][qnode])
        return list(countries)

    def filter(self, qnodes: typing.List[str]) -> typing.List[str]:
        '''Returns sublist of qnodes that are locations'''
        places = set()
        for qnode in qnodes:
            if qnode in self.all:
                places.add(qnode)
        result = list(places)
        return result

    @classmethod
    def is_place(cls, qnode: str) -> bool:
        '''Returns true is qnode is a place node'''
        return qnode in Location.all

    @classmethod
    def get_admin_level(cls, qnode: str) -> int:
        '''Returns the administrative level of the qnode. Returns -1 qnode is
        not in the first four administrative levels.'''
        if qnode.startswith('wd:'):
            qnode = qnode[3:]
        if qnode in Location.admin3:
            return 3
        if qnode in Location.admin2:
            return 2
        if qnode in Location.admin1:
            return 1
        if qnode in Location.countries:
            return 0
        return -1

    def get_max_admin_level(self, qnode_list: typing.List[str]) -> int:
        '''
        Returns the maximum admin level (most local admin) of qnode place list.
        '''
        levels = np.array([self.get_admin_level(x) for x in qnode_list])
        (unique, counts) = np.unique(levels, return_counts=True)
        if len(unique) == 1:
            return unique[0]
        # print(f'multiple levels: {unique} {counts}')
        return max(unique)

    def lookup_admin_hierarchy(self, admin_level: int, qnode: str):
        '''Returns the adminstrative containment of qnode. Assume qnode is at
        administrative level admin_level.'''
        result = {}
        if qnode.startswith('wd:'):
            qnode = qnode[3:]
        if admin_level == 0:
            result['country_id'] = qnode
            result['country'] = self.labels.get(qnode, '')
        else:
            result['country_id'] = self.contains['toCountry'].get(qnode, '')
            result['country'] = self.labels.get(result['country_id'], '')
        if admin_level == 3:
            result['admin3_id'] = qnode
            result['admin3'] = self.labels.get(qnode, '')
            if qnode in self.contains['toAdmin2']:
                admin_level = 2
                qnode = self.contains['toAdmin2'][qnode]
        if admin_level == 2:
            result['admin2_id'] = qnode
            result['admin2'] = self.labels.get(qnode, '')
            if qnode in self.contains['toAdmin1']:
                admin_level = 1
                qnode = self.contains['toAdmin1'][qnode]
        if admin_level == 1:
            result['admin1_id'] = qnode
            result['admin1'] = self.labels.get(qnode, '')
        print(admin_level, qnode, result)
        return result
