import json
import typing
import sys

from util import DataInterval, Labels, TimePrecision
from kgtk import Literal

PROPERTY_LABEL = {
    'P17': 'country',
    'P31': 'instance of',
    'P276': 'location',
    'P580': 'start time',
    'P582': 'end time',
    'P921': 'main subject',
    'P1114': 'quantity',
    'P1476': 'title',
    'P1813': 'short name',
    'P1687': 'Wikidata property',
    'P1880': 'measurement scale',
    'P1932': 'stated as',
    'P2699': 'url',
    'P6339': 'data interval',
    'label': '',
    'descriptions': '',
    'Pdataset': 'dataset',
    'PcorrespondsToProperty': 'corresponds to',
    'PhasQualifier': 'has qualifier',
    'PvariableMeasured': 'variable measured'
}

class Metadata:
    fields: typing.List[str] = []
    name_to_pnode_map: typing.Dict[str, str] = {}

    def __init__(self):
        self.labels = Labels()
        self.unseen_properties = []
        for attr in self.fields:
            setattr(self, attr, None)
            if attr in self.name_to_pnode_map:
                setattr(self, f'{attr}_pnode', self.name_to_pnode_map[attr])

    def create_edge(self, node1: str, label: str, node2: str,
                    *, edge_id: str = None):
        '''Create a KGTK edge'''
        if label not in PROPERTY_LABEL and label not in self.unseen_properties:
            self.unseen_properties.append(label)
            print(f'!!!! Need new label for property: {label}', file=sys.stderr)
        edge = {
            'node1': node1,
            'property': label,
            'node2': node2,
            'property;label': PROPERTY_LABEL.get(label, '')
        }
        if edge_id:
            edge['id'] = edge_id
        return edge

    def to_dict(self) -> dict:
        result = {}
        for attr in self.fields:
            if getattr(self, attr):
                result[attr] = getattr(self, attr)
        return result

    def from_dict(self, desc: dict):
        for key, value in desc.items():
            try:
                setattr(self, key, value)
            except AttributeError:
                raise ValueError(f'Key not allowed: {key}')

    def to_json(self, **kwargs) -> str:
        return json.dumps(self.to_dict(), **kwargs)

    def from_json(self, desc: str):
        self.from_dict(json.loads(desc))

class DatasetMetadata(Metadata):
    '''
    Datamart dataset metadata.
    See: https://datamart-upload.readthedocs.io/en/latest/
    '''

    fields = [
        'name',
        'description',
        'url',
        'shortName',
        'datasetID',
        'keywords',
        'creator',
        'contributor',
        'citesWork',
        'copyrightLicense',
        'version',
        'doi',
        'mainSubject',
        'coordinateLocation',
        'geoshape',
        'country',
        'location',
        'startTime',
        'endTime',
        'dataInterval',
        'variableMeasured',
        'mappingFile'
    ]
    name_to_pnode_map = {
        'name': 'P1476',
        'description': 'descriptions',
        'url': 'P2699',
        'shortName': 'P1813',
        # 'datasetID': 'None',
        'keywords': 'schema:keywords',
        'creator': 'P170',
        'contributor': 'P767',
        'citesWork': 'P2860',
        'copyrightLicense': 'P275',
        'version': 'schema:version',
        'doi': 'P356',
        'mainSubject': 'P921',
        'coordinateLocation': 'P921',
        'geoshape': 'P3896',
        'country': 'P17',
        'location': 'P276',
        'startTime': 'P580',
        'endTime': 'P582',
        'dataInterval': 'P6339',
        'variableMeasured': 'PvariableMeasured',
        'mappingFile': 'PNodeToBeDetermined'
    }
    def __init__(self):
        super().__init__()
        self.name = None
        self.description = None
        self.url = None
        self.shortName = None
        self.datasetID = None
        self.keywords = []
        self.creator = None
        self.contributor = None
        self.citesWork = None
        self.copyrightLicense = None
        self.version = None
        self.doi = None
        self.mainSubject = []
        self.coordinateLocation = None
        self.geoshape = None
        self.country = []
        self.location = []
        self.startTime = None
        self.endTime = None
        self.dataInterval = None
        self.variableMeasured = None
        self.mappingFile = None

    def to_kgtk_edges(self, edge_id_generator: typing.Generator, *,
                      dataset_node: str = None, variable_node: str = None, defined_labels: set = None,
    ) -> typing.List[dict]:
        edges = []

        if not dataset_node:
            dataset_node = f"Q{self.datasetID}"

        # isa data set
        edge = self.create_edge(dataset_node, 'P31', 'Q1172284', edge_id=next(edge_id_generator))
        edges.append(edge)

        # stated as
        edges.append(self.create_edge(edge['id'], 'P1932', self.datasetID))

        # label and title
        edges.append(self.create_edge(dataset_node, 'label', self.name))
        edges.append(self.create_edge(dataset_node, 'P1476', self.name))

        edges.append(self.create_edge(dataset_node, 'descriptions', self.description))
        edges.append(self.create_edge(dataset_node, 'P2699', self.url))
        return edges


class VariableMetadata(Metadata):
    '''
    Datamart variable metadata.
    See: https://datamart-upload.readthedocs.io/en/latest/
    '''
    fields = [
        'name',
        'variableID',
        'datasetID',
        'shortName',
        'description',
        'correspondsToProperty',
        'mainSubject',
        'unitOfMeasure',
        'country',
        'location',
        'startTime',
        'endTime',
        'startTime_precision',
        'endTime_precision',
        'dataInterval',
        'columnIndex',
        'qualifier',
        'count'
    ]
    name_to_pnode_map = {
        'name': 'P1476',
        # 'variableID': 'None',
        # 'datasetID': 'None',
        'shortName': 'P1813',
        'description': 'descriptions',
        'correspondsToProperty': 'P1687',
        'mainSubject': 'P921',
        'unitOfMeasure': 'P1880',
        'country': 'P17',
        'location': 'P276',
        'startTime': 'P580',
        'endTime': 'P582',
        'dataInterval': 'P6339',
        'columnIndex': 'PcolumnIndex',
        'qualifier': 'PhasQualifier',
        'count': 'P1114'
    }

    def __init__(self):
        super().__init__()
        self.name = None
        self.variableID = None
        self.datasetID = None
        self.shortName = None
        self.description = None
        self.correspondsToProperty = None
        self.mainSubject = []
        self.unitOfMeasure = []
        self.country = []
        self.location = []
        self.startTime = None
        self.endTime = None
        self.startTime_precision = None
        self.endTime_precision = None
        self.dataInterval = None
        self.columnIndex = None
        self.qualifier = []
        self.count = None

    def from_sparql_dict(self, desc: dict):
        super().from_dict(desc)
        self.mainSubject = self.labels.to_object([uri.split('/')[-1] for uri in self.mainSubject])
        self.country = self.labels.to_object([uri.split('/')[-1] for uri in self.country])
        self.location = self.labels.to_object([uri.split('/')[-1] for uri in self.location])
        self.dataInterval = DataInterval.qnode_to_name(self.dataInterval.split('/')[-1])
        try:
            precision_name = TimePrecision.to_name(int(self.startTime_precision))
            self.startTime_precision = precision_name
        except (TypeError, ValueError):
            pass
        try:
            precision_name = TimePrecision.to_name(int(self.endTime_precision))
            self.endTime_precision = precision_name
        except (TypeError, ValueError):
            pass

    def to_kgtk_edges(self, edge_id_generator: typing.Generator, *,
                      dataset_node: str = None, variable_node: str = None, defined_labels: set = None,
    ) -> typing.List[dict]:
        edges = []

        if not dataset_node:
            dataset_node = f"Q{self.datasetID}"
        if not variable_node:
            variable_node = f'Q{self.variableID}'

        # is instance of variable
        edge = self.create_edge(variable_node, 'P31', 'Q50701', edge_id=next(edge_id_generator))
        edges.append(edge)
        edges.append(self.create_edge(edge['id'], 'P1932', self.variableID))

        # has title
        edges.append(self.create_edge(variable_node, 'label', self.name))
        edges.append(self.create_edge(variable_node, 'P1476', self.name))

        if self.shortName:
            edges.append(self.create_edge(variable_node, 'P1813', self.shortName))

        edges.append(self.create_edge(variable_node, 'descriptions', self.description))

        edges.append(self.create_edge(dataset_node, 'PvariableMeasured', variable_node))
        edges.append(self.create_edge(variable_node, 'Pdataset', dataset_node))

        # Wikidata property (P1687) expects object to be a property. KGTK
        # does not support object with type property (May 2020).
        # edges.append(self.create_edge(variable_node, 'P1687', self.correspondsToProperty))
        edges.append(self.create_edge(
            variable_node, 'PcorrespondsToProperty', self.correspondsToProperty))

        if self.unitOfMeasure:
            for unit in self.unitOfMeasure:
                edges.append(self.create_edge(variable_node, 'P1880', unit['identifier']))
                if defined_labels is not None and unit['identifier'] not in defined_labels:
                    defined_labels.add(unit['identifier'])
                    edges.append(self.create_edge(unit['identifier'], 'label', unit['name']))

        if self.mainSubject:
            for main_subject_obj in self.mainSubject:
                edges.append(
                    self.create_edge(variable_node, 'P921', main_subject_obj['identifier']))

        # precision = DataInterval.name_to_int(self.dataInterval)
        edges.append(self.create_edge(
            variable_node, 'P580',
            Literal.time_str_precision(self.startTime, self.startTime_precision)))
        edges.append(self.create_edge(
            variable_node, 'P582',
            Literal.time_str_precision(self.endTime, self.endTime_precision)))

        edges.append(self.create_edge(
            variable_node, 'P6339', DataInterval.name_to_qnode(self.dataInterval)))

        # columnIndex not yet implement, use P3903?

        edges.append(self.create_edge(variable_node, 'P1114', self.count))
        if self.qualifier:
            for qualifier_obj in self.qualifier:
                qualifier_node = qualifier_obj['identifier']
                if qualifier_node.startswith('pq:'):
                    qualifier_node = qualifier_node[3:]
                edge = self.create_edge(variable_node, 'PhasQualifier', qualifier_node,
                                        edge_id=next(edge_id_generator))
                edges.append(edge)
                # qualifier stated as
                edges.append(self.create_edge(edge['id'], 'P1932', qualifier_obj['name']))

        if self.country:
            for country_obj in self.country:
                edges.append(self.create_edge(variable_node, 'P17', country_obj['identifier']))

        if self.location:
            for location_obj in self.location:
                edges.append(self.create_edge(variable_node, 'P276', location_obj['identifier']))

        return edges
