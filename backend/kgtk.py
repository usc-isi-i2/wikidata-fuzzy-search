import sys
import typing

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
        yield f'{prefix}-{index}'
        index += 1

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
    header = ['node1', 'property', 'node2', 'id', 'label;label']

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
            'property': label,
            'node2': node2,
            'property;label': PROPERTY_LABEL.get(label, '')
        }
        if edge_id:
            edge['id'] = edge_id
        return edge

    def print_edges(self, edges: typing.List[dict]) -> None:
        for edge in edges:
            if edge['property'] == 'label':
                if edge['node1'] in self.defined_labels:
                    continue
                else:
                    self.defined_labels.add(edge['node1'])
            print('\t'.join([str(edge.get(key, '')) for key in self.header]), file=self.out)

    def print_edge(self, edge: dict) -> None:
        self.print_edges([edge])

    def print_spo(self, node1: str, label: str, node2: str, *, edge_id: str = None):
        self.print_edge(self.create_edge(node1, label, node2, edge_id=edge_id))

    def print_property_edges(self):
        self.print_spo('PvariableMeasured', 'label', 'variable measured')
        self.print_spo('Pdataset', 'label', 'dataset')
        self.print_spo('PhasQualifier', 'label', 'has qualifier')
        self.print_spo('PcorrespondsToProperty', 'label', 'corresponds to')
