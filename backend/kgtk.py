import sys
import typing

from collections import defaultdict

from util import TimePrecision

PROPERTY_LABEL = {
    'P17': 'country',
    'P31': 'instance of',
    'P580': 'start time',
    'P582': 'end time',
    'P921': 'main subject',
    'P1114': 'quantity',
    'P1476': 'title',
    'P1813': 'short name',
    'P1687': 'Wikidata property',
    'P1880': 'measurement scale',
    'P2699': 'url',
    'P6339': 'data interval',
    'label': '',
    'descriptions': '',
    'Pdataset': 'dataset',
    'PcorrespondsToProperty': 'corresponds to',
    'PhasQualifier': 'has qualifier',
    'PvariableMeasured': 'variable measured'
}

def id_generator(prefix: str, index: int = 0):
    while True:
        yield f'{prefix}{index}'
        index += 1

class NodeLabelIdGenerator:
    def __init__(self):
        self._counter_map: typing.Dict[str, int] = defaultdict(int)

    def next(self, node1: str, label: str):
        key = f'{node1}-{label}'
        identifier = f'{key}-{self._counter_map[key]}'
        self._counter_map[key] += 1
        return identifier

class Literal:
    @staticmethod
    def time_int_precision(datetime: str, precision: int) -> str:
        if precision:
            return f"^{datetime}/{precision}"
        else:
            return f"^{datetime}"

    @staticmethod
    def time_str_precision(datetime: str, precision_name: str) -> str:
        if precision_name:
            precision = TimePrecision.to_int(precision_name)
            return f"^{datetime}/{precision}"
        else:
            return f"^{datetime}"

class EdgeOutput:
    '''Create and print KGTK edges '''
    header = ['node1', 'label', 'node2', 'id', 'label;label']

    def __init__(self, output: typing.TextIO = sys.stdout):
        self.out = output

        # track 'label' property to avoid repeats
        self.defined_labels: typing.Set[str] = set()

        # print header line
        print('\t'.join(self.header), file=self.out)

    def create_edge(self, node1: str, label: str, node2: str, *, edge_id: str = None):
        if label not in PROPERTY_LABEL:
            print(f'NEW LABEL: {label}')
        edge = {
            'node1': node1,
            'label': label,
            'node2': node2,
            'label;label': PROPERTY_LABEL.get(label, '')
        }
        if edge_id:
            edge['id'] = edge_id
        return edge

    def print_edges(self, edges: typing.List[dict]) -> None:
        for edge in edges:
            if edge['label'] == 'label':
                if edge['node1'] in self.defined_labels:
                    continue
                else:
                    self.defined_labels.add(edge['node1'])
            print('\t'.join([str(edge.get(key, '')) for key in self.header]), file=self.out)

    def print_edge(self, edge: dict) -> None:
        self.print_edges([edge])

    def print_spo(self, node1: str, label: str, node2: str, edge_id: str = None):
        self.print_edge(self.create_edge(node1, label, node2, edge_id=edge_id))

    def print_property_edges(self):
        self.print_spo('P2006020005', 'label', 'corresponds to property', 'P2006020005-label-1')
        self.print_spo('P2006020005', 'data', 'type', 'property	P2006020005-data_type-1')
        self.print_spo('P2006020002', 'label', 'has qualifier', 'P2006020002-label-1')
        self.print_spo('P2006020002', 'data', 'type', 'property	P2006020002-data_type-1')
        self.print_spo('P2006020003', 'label', 'variable measured', 'P2006020003-label-1')
        self.print_spo('P2006020003', 'data', 'type', 'item	P2006020003-data_type-1')
        self.print_spo('P2006020004', 'label', 'dataset', 'P2006020004-label-1')
        self.print_spo('P2006020004', 'data', 'type', 'item	P2006020004-data_type-1')
        self.print_spo('P2006020001', 'label', 'has column index', 'P200602000-label-1')
        self.print_spo('P2006020001', 'data', 'type', 'quantity	P2006020001-data_type-1')
        self.print_spo('P2006020006', 'label', 'mapping file', 'P2006020006-label-1')
        self.print_spo('P2006020006', 'data', 'type', 'url	P2006020006-data_type-1')
