import datetime
import gzip
import json
import typing
import os
import sys

from dateutil.parser import parse
from enum import Enum

from util import DataInterval, Labels, TimePrecision
from kgtk import Literal, NodeLabelIdGenerator

import settings

DEFAULT_DATE = datetime.datetime(1900, 1, 1)
labels = Labels()

class DataType(Enum):
    QNODE = 1
    PNODE = 2
    QLIST = 3
    PLIST = 4
    STRING = 5
    URL = 6
    DATE = 7
    PRECISION = 8
    INTERVAL = 9
    INTEGER = 10
    FLOAT = 11

PROPERTY_LABEL = {
    'P17': 'country',
    'P31': 'instance of',
    'P170': 'creator',
    'P276': 'location',
    'P275': 'copyrightLicense',
    'P356': 'doi',
    'P527': 'hasPart',
    'P580': 'start time',
    'P582': 'end time',
    'P767': 'contributor',
    'P921': 'main subject',
    'P1114': 'quantity',
    'P1476': 'title',
    'P1813': 'short name',
    'P1687': 'Wikidata property',
    'P1880': 'measurement scale',
    'P1932': 'stated as',
    'P2699': 'url',
    'P2860': 'cites work',
    'P3896': 'geoshape',
    'P6269': 'apiEndpoint',
    'P6339': 'data interval',
    'label': '',
    'descriptions': 'description',
    'schema:dateCreated': 'dateCreated',
    'schema:includedInDataCatalog': 'includedInDataCatalog',
    'schema:keywords': 'keywords',
    'schema:version': 'version',
    'P2006020004': 'dataset',
    'P2006020005': 'corresponds to',
    'P2006020002': 'has qualifier',
    'P2006020003': 'variable measured',
    'P2006020006': 'mapping file'
}

def isQnode(name: str) -> bool:
    if not isinstance(name, str):
        return False
    try:
        if not name[0] == 'Q':
            return False
        int(name[1:])
        return True
    except:
        return False

def isPnode(name: str) -> bool:
    if not isinstance(name, str):
        return False
    try:
        if not name[0] == 'P':
            return False
        int(name[1:])
        return True
    except:
        return False

def wikify(description: str):
    if description.startswith('Q'):
        return description
    return 'Q'+description

def wikify_property(description: str):
    if description.startswith('P'):
        return description
    return 'P'+description

def process_qnode_obj(item: typing.Union[str, dict]) -> dict:
    if isinstance(item, str):
        if isQnode(item):
            qnode = item
            name = labels.get(qnode, qnode)
        else:
            name = item
            qnode = wikify(item)
    elif isinstance(item, dict):
        if not ('name' in item and 'identifier' in item):
            raise ValueError('Must have "name" and "identifier" keys in object.')
        name = item['name']
        qnode = item['identifier']
    else:
        raise ValueError(f'Not recognized qnode object type: {type(item)}')
    return {'name': name, 'identifier': qnode}

def process_pnode_obj(item: typing.Union[str, dict]) -> dict:
    if isinstance(item, str):
        if isQnode(item):
            qnode = item
            name = labels.get(qnode, qnode)
        else:
            name = item
            qnode = wikify_property(item)
    elif isinstance(item, dict):
        if not 'name' in item or not 'identifier' in item:
            raise ValueError('Must have "name" and "identifier" keys in object.')
        name = item['name']
        qnode = item['identifier']
    else:
        raise ValueError(f'Not recognized qnode object type: {type(item)}')
    return {'name': name, 'identifier': qnode}

def process_qnode_list(qlist: typing.List) -> typing.List[dict]:
    result = []
    for item in qlist:
        result.append(process_qnode_obj(item))
    return result

def process_pnode_list(qlist: typing.List) -> typing.List[dict]:
    result = []
    for item in qlist:
        result.append(process_pnode_obj(item))
    return result


class Metadata:

    # official properties
    _datamart_fields: typing.List[str] = []

    _datamart_field_type: typing.Dict[str, DataType] = {}

    # properties for internal use
    _internal_fields: typing.List[str] = []

    _required_fields: typing.List[str] = []

    _list_fields: typing.List[str] = []

    # mapping for properties to pnodes
    _name_to_pnode_map: typing.Dict[str, str] = {}

    def __init__(self):
        self._labels = Labels()
        self._unseen_properties = []
        self._edge_id_generator: NodeLabelIdGenerator = None
        for attr in self._datamart_fields:
            setattr(self, attr, None)
            # if attr in self._name_to_pnode_map:
            #     setattr(self, f'_{attr}_pnode', self._name_to_pnode_map[attr])
        for attr in self._internal_fields:
            setattr(self, attr, None)

    def __setattr__(self, name, value):
        if name.startswith('_') or name in self._datamart_fields or name in self._internal_fields:
            super().__setattr__(name, value)
        else:
            raise ValueError(f'attribute not allowed: {name}')

    @classmethod
    def fields(cls) -> list:
        return cls._datamart_fields

    @classmethod
    def is_required_field(cls, field: str) -> bool:
        return field in cls._required_fields

    @classmethod
    def is_list_field(cls, field: str) -> bool:
        return field in cls._list_fields

    def create_edge(self, node1: str, label: str, node2: str):
        '''Create a KGTK edge'''
        if label not in PROPERTY_LABEL and label not in self._unseen_properties:
            self._unseen_properties.append(label)
            print(f'!!!! Need new label for property: {label}', file=sys.stderr)
        edge = {
            'node1': node1,
            'property': label,
            'node2': node2,
            'property;label': PROPERTY_LABEL.get(label, ''),
            'id': self._edge_id_generator.next(node1, label)
        }
        return edge

    def field_edge(self, node1: str, field_name: str, *, required: bool = False,
                   is_time: bool = False, is_qnode: bool = False):
        value = getattr(self, field_name, None)
        label = self._name_to_pnode_map[field_name]

        if value is None:
            if required:
                raise ValueError(f'Missing field for node {node1}: {field_name}')
            return
        if isinstance(value, dict):
            if 'identifier' in value:
                value = value['identifier']
            else:
                raise ValueError(f'Do not know how to handle dict: {node1} {field_name} {value}')
        elif not isinstance(value, (float, int, str)):
            raise ValueError(f'Do not know how to handle: {node1} {field_name} {value}')

        if is_time:
            precision = getattr(self, f'{field_name}_precision')
            edge = self.create_edge(
                node1, label, Literal.time_int_precision(value, precision))
        elif is_qnode:
            if isinstance(value, str) and not value.startswith('Q'):
                print(f'Object for {field_name} should be a qnode: {value}')
                edge = self.create_edge(node1, label, value)
            elif isinstance(value, dict):
                edge = self.create_edge(node1, label, value['identifier'])
            else:
                edge = self.create_edge(node1, label, value)
        else:
            edge = self.create_edge(node1, label, value)
        return edge

    def update(self, metadata: dict) -> None:
        for key, value in metadata.items():
            setattr(self, key, value)

    def to_dict(self, *, include_internal_fields=False) -> dict:
        result = {}
        for attr in self._datamart_fields:
            if getattr(self, attr):
                result[attr] = getattr(self, attr)
        if include_internal_fields:
            for attr in self._internal_fields:
                if getattr(self, attr):
                    result[attr] = getattr(self, attr)
        return result

    def from_dict(self, desc: dict):
        for key, value in desc.items():
            if key in self._datamart_fields or key in self._internal_fields:
                setattr(self, key, value)
            else:
                raise ValueError(f'Key not allowed: {key}')

    def to_json(self, *, include_internal_fields=False, **kwargs) -> str:
        return json.dumps(self.to_dict(include_internal_fields=include_internal_fields), **kwargs)

    def from_json(self, desc: str):
        self.from_dict(json.loads(desc))

    def from_request(self, desc: dict) -> typing.Tuple[dict, int]:
        '''Process description from REST request'''
        result = {}
        error = {}

        # Check required fields
        for required in self._required_fields:
            if required not in desc:
                error['Error'] = 'Missing required properties'
                if 'Missing' in error:
                    error['Missing'].append(required)
                else:
                    error['Missing'] = [required]
        if error:
            return error, 400

        # Parse each field
        for name in self._datamart_fields:
            value = desc.get(name, None)
            if not value:
                continue
            data_type = self._datamart_field_type[name]

            print(name, data_type, value)

            if data_type == DataType.QNODE:
                try:
                    result[name] = process_qnode_obj(value)
                except ValueError as err:
                    error[name] = str(err)
            elif data_type == DataType.PNODE:
                try:
                    result[name] = process_pnode_obj(value)
                except ValueError as err:
                    error[name] = str(err)
            elif data_type == DataType.QLIST:
                if isinstance(value, list):
                    try:
                        result[name] = process_qnode_list(value)
                    except ValueError as err:
                        error[name] = str(err)
                else:
                    error[name] = 'Expecting a list'
            elif data_type == DataType.PLIST:
                if isinstance(value, list):
                    try:
                        result[name] = process_pnode_list(value)
                    except ValueError as err:
                        error[name] = str(err)
                else:
                    error[name] = 'Expecting a list'
            elif data_type == DataType.STRING:
                if isinstance(value, str):
                    result[name] = value
                else:
                    error[name] = 'Expecting a string'
            elif data_type == DataType.URL:
                if isinstance(value, str):
                    # TODO: validate URL
                    result[name] = value
                else:
                    error[name] = 'Expecting a string'
            elif data_type == DataType.DATE:
                try:
                    result[name] = parse(value, default=DEFAULT_DATE).isoformat()
                    print(name, result[name])
                except (ValueError, OverflowError) as error:
                    print(error)
                    error[name] = str(error)
            elif data_type == DataType.PRECISION:
                if TimePrecision.is_name(value):
                    result[name] = TimePrecision.to_int(value)
                else:
                    error[name] = f'Precision value not recognized: {value}'
            elif data_type == DataType.INTERVAL:
                if DataInterval.is_name(value):
                    result[name] = DataInterval.name_to_qnode(value)
                else:
                    error[name] = f'Value not recognized: {value}'
            elif data_type == DataType.INTEGER:
                if isinstance(value, int):
                    result[name] = value
                else:
                    try:
                        result[name] = int(value)
                    except:
                        error[name] = f'Value not recognized int value: {value}'
            elif data_type == DataType.FLOAT:
                if isinstance(value, float):
                    result[name] = value
                else:
                    try:
                        result[name] = float(value)
                    except:
                        error[name] = f'Value not recognized int value: {value}'
            else:
                return {'Unknow datatype': data_type}, 500
        if error:
            error['Error'] = 'Cannot parse JSON body'
            return error, 400
        self.from_dict(result)
        return {}, 200




class DatasetMetadata(Metadata):
    '''
    Datamart dataset metadata.
    See: https://datamart-upload.readthedocs.io/en/latest/
    '''

    _datamart_fields = [
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
        'startTime_precision',
        'endTime_precision',
        'dataInterval',
        'variableMeasured',
        'mappingFile',
        'officialWebsite',
        'dateCreated',
        'apiEndpoint',
        'includedInDataCatalog',
        'hasPart'
    ]
    _required_fields = [
        'name',
        'description',
        'url',
        'shortName'
    ]
    _internal_fields = [
        '_dataset_id'
    ]
    _datamart_field_type = {
        'name': DataType.STRING,
        'description': DataType.STRING,
        'url': DataType.URL,
        'shortName': DataType.STRING,
        'datasetID': DataType.STRING,
        'keywords': DataType.STRING,
        'creator': DataType.QNODE,
        'contributor': DataType.QNODE,
        'citesWork': DataType.STRING,
        'copyrightLicense': DataType.QNODE,
        'version': DataType.STRING,
        'doi': DataType.STRING,
        'mainSubject': DataType.QNODE,
        'coordinateLocation': DataType.STRING,
        'geoshape': DataType.STRING,
        'country': DataType.QNODE,
        'location': DataType.QNODE,
        'startTime': DataType.DATE,
        'endTime': DataType.DATE,
        'startTime_precision': DataType.PRECISION,
        'endTime_precision': DataType.PRECISION,
        'dataInterval': DataType.INTERVAL,
        'variableMeasured': DataType.QNODE,
        'mappingFile': DataType.URL,
        'officialWebsite': DataType.URL,
        'dateCreated': DataType.DATE,
        'apiEndpoint': DataType.URL,
        'includedInDataCatalog': DataType.QNODE,
        'hasPart': DataType.URL
    }
    _name_to_pnode_map = {
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
        'variableMeasured': 'P2006020003',
        'mappingFile': 'P2006020006',
        'officialWebsite': 'P856',
        'dateCreated': 'schema:dateCreated',
        'apiEndpoint': 'P6269',
        'includedInDataCatalog': 'schema:includedInDataCatalog',
        'hasPart': 'P527'

    }
    def __init__(self):
        super().__init__()
        self.name = None
        self.description = None
        self.url = None
        self.shortName = None
        # self.datasetID = None
        self.keywords = None
        self.creator = None
        self.contributor = None
        self.citesWork = None
        self.copyrightLicense = None
        self.version = None
        self.doi = None
        self.mainSubject = None
        self.coordinateLocation = None
        self.geoshape = None
        self.country = None
        self.location = None
        self.startTime = None
        self.endTime = None
        self.dataInterval = None
        self.variableMeasured = None
        self.mappingFile = None

    def to_kgtk_edges(self, edge_id_generator: NodeLabelIdGenerator, dataset_node, *,
                      defined_labels: set = None
    ) -> typing.List[dict]:

        self._edge_id_generator = edge_id_generator

        edges = []

        # isa data set
        edge = self.create_edge(dataset_node, 'P31', 'Q1172284')
        edges.append(edge)

        # stated as
        # edges.append(self.create_edge(edge['id'], 'P1932', self.shortName))

        # label and title
        edges.append(self.create_edge(dataset_node, 'label', self.name))
        edges.append(self.field_edge(dataset_node, 'name', required=True))
        edges.append(self.field_edge(dataset_node, 'description', required=True))
        edges.append(self.field_edge(dataset_node, 'url', required=True))

        # Optional
        edges.append(self.field_edge(dataset_node, 'shortName'))
        edges.append(self.field_edge(dataset_node, 'keywords'))
        edges.append(self.field_edge(dataset_node, 'creator'))
        edges.append(self.field_edge(dataset_node, 'contributor'))
        edges.append(self.field_edge(dataset_node, 'citesWork'))
        edges.append(self.field_edge(dataset_node, 'copyrightLicense', is_qnode=True))
        edges.append(self.field_edge(dataset_node, 'version'))
        edges.append(self.field_edge(dataset_node, 'doi'))
        edges.append(self.field_edge(dataset_node, 'mainSubject', is_qnode=True))
        edges.append(self.field_edge(dataset_node, 'geoshape'))
        edges.append(self.field_edge(dataset_node, 'country', is_qnode=True))
        edges.append(self.field_edge(dataset_node, 'location', is_qnode=True))
        edges.append(self.field_edge(dataset_node, 'startTime', is_time=True))
        edges.append(self.field_edge(dataset_node, 'endTime', is_time=True))
        edges.append(self.field_edge(dataset_node, 'dataInterval'))
        edges.append(self.field_edge(dataset_node, 'variableMeasured', is_qnode=True))
        edges.append(self.field_edge(dataset_node, 'mappingFile'))

        edges = [edge for edge in edges if edge is not None ]
        return edges


class VariableMetadata(Metadata):
    '''
    Datamart variable metadata.
    See: https://datamart-upload.readthedocs.io/en/latest/
    '''
    _datamart_fields = [
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
    _required_fields = [
        'name',
        'shortName'
    ]
    _internal_fields = [
        '_dataset_id',
        '_variable_id',
        '_aliases',
        '_max_admin_level',
        '_precision'
    ]
    _list_fields = ['mainSubject', 'unitOfMeasure', 'country', 'qualifier']
    _datamart_field_type = {
        'name': DataType.STRING,
        'variableID': DataType.STRING,
        'datasetID': DataType.STRING,
        'shortName': DataType.STRING,
        'description': DataType.STRING,
        'correspondsToProperty' : DataType.PNODE,
        'mainSubject': DataType.QLIST,
        'unitOfMeasure': DataType.QLIST,
        'country': DataType.QLIST,
        'location': DataType.QLIST,
        'startTime': DataType.DATE,
        'endTime': DataType.DATE,
        'startTime_precision': DataType.PRECISION,
        'endTime_precision': DataType.PRECISION,
        'dataInterval': DataType.INTERVAL,
        'columnIndex': DataType.STRING,
        'qualifier': DataType.QLIST,
        'count': DataType.INTEGER
    }
    _name_to_pnode_map = {
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
        'columnIndex': 'P2006020001',
        'qualifier': 'P2006020002',
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
        self.columnIndex: typing.Union(int, None) = None
        self.qualifier = []
        self.count = None

        self._max_admin_level = None
        self._precision = None

    def from_sparql_dict(self, desc: dict):
        super().from_dict(desc)
        self.mainSubject = self._labels.to_object([uri.split('/')[-1] for uri in self.mainSubject])
        self.country = self._labels.to_object([uri.split('/')[-1] for uri in self.country])
        self.location = self._labels.to_object([uri.split('/')[-1] for uri in self.location])
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

    def to_kgtk_edges(self, edge_id_generator: NodeLabelIdGenerator, dataset_node: str,
                      variable_node, defined_labels: set = None,
    ) -> typing.List[dict]:

        self._edge_id_generator = edge_id_generator

        edges = []

        # is instance of variable
        edge = self.create_edge(variable_node, 'P31', 'Q50701')
        edges.append(edge)
        edges.append(self.create_edge(edge['id'], 'P1932', self.variableID))

        # has title
        edges.append(self.create_edge(variable_node, 'label', self.name))
        edges.append(self.field_edge(variable_node, 'name', required=True))

        edges.append(self.field_edge(variable_node, 'shortName'))

        edges.append(self.field_edge(variable_node, 'description'))

        edges.append(self.create_edge(dataset_node, 'P2006020003', variable_node))
        edges.append(self.create_edge(variable_node, 'P2006020004', dataset_node))

        # Wikidata property (P1687) expects object to be a property. KGTK
        # does not support object with type property (May 2020).
        # edges.append(self.create_edge(variable_node, 'P1687', self.correspondsToProperty))
        edges.append(self.field_edge(variable_node, 'correspondsToProperty'))

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
        edges.append(self.field_edge(variable_node, 'startTime', is_time=True))
        edges.append(self.field_edge(variable_node, 'endTime', is_time=True))

        edges.append(self.create_edge(
            # variable_node, 'P6339', DataInterval.name_to_qnode(self.dataInterval))
            variable_node, 'P6339', self.dataInterval)
        )

        edges.append(self.field_edge(variable_node, 'columnIndex'))

        edges.append(self.field_edge(variable_node, 'count'))

        if self.qualifier:
            for qualifier_obj in self.qualifier:
                qualifier_node = qualifier_obj['identifier']
                if qualifier_node.startswith('pq:'):
                    qualifier_node = qualifier_node[3:]
                edge = self.create_edge(variable_node, 'P2006020002', qualifier_node)
                edges.append(edge)
                # qualifier stated as
                edges.append(self.create_edge(edge['id'], 'P1932', qualifier_obj['name']))

        if self.country:
            for country_obj in self.country:
                edges.append(self.create_edge(variable_node, 'P17', country_obj['identifier']))

        if self.location:
            for location_obj in self.location:
                edges.append(self.create_edge(variable_node, 'P276', location_obj['identifier']))

        edges = [edge for edge in edges if edge is not None ]
        return edges


class VariableMetadataCache:
    _cache: typing.Dict[str, VariableMetadata] = {}

    def __init__(self, variable_jsonl_gz_file: str = None):
        if variable_jsonl_gz_file is None:
            variables_jsonl_gz_file = os.path.join(settings.BACKEND_DIR, 'metadata', 'variables.jsonl.gz')
        self.variables_jsonl_gz_file = variables_jsonl_gz_file

        with gzip.open(self.variables_jsonl_gz_file, 'rt') as fin:
            for line in fin:
                vm = VariableMetadata()
                vm.from_json(line)
                VariableMetadataCache._cache[vm.variableID] = vm

    def get(self, variableID: str) -> typing.Union[VariableMetadata, None]:
        if variableID in VariableMetadataCache._cache:
            return VariableMetadataCache._cache[variableID]
        else:
            print('VariableMetadataCache: dyanmically get metadata not yet implemented')
            return None
