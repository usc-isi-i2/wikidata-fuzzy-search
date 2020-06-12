import asyncio
import csv

from pprint import pprint

import pandas as pd

from flask import Flask, request, jsonify, make_response
from flask_restful import Resource, reqparse

from datamart import DatasetMetadata, VariableMetadata
from dataset import SQLProvider, SPARQLProvider
from fuzzy import config, get_variable_metadata
from kgtk import id_generator, NodeLabelIdGenerator

import settings


pd.set_option('display.width', 200)
pd.set_option('display.max_columns', None)

# TODO: Need to request qnode from backend store
qnode = id_generator('Q', 9000)

# TODO: Need to look up dataset qnode by name
def get_dataset_id(dataset_short_name: str):
    if dataset_short_name == 'UAZ':
        return 'QUAZ'
    else:
        return next(qnode)

# These property names will change in the future
property_map = {
    'correspondsToProperty': 'pd:correspondsToProperty',
    'hasQualifier': 'pd:hasQualifier'
}

provider = SQLProvider() if settings.BACKEND_MODE == 'postgres' else SPARQLProvider()

class ApiMetadata(Resource):
    def get(self, dataset: str = None, variable: str = None):
        if variable:
            return asyncio.run(get_variable_metadata(dataset, variable))
        name = request.args.getlist('name')
        name = [item for alist in map(lambda x: x.strip().split(','), name) for item in alist]
        keywords = request.args.getlist('keywords')
        keywords = [item for alist in map(lambda x: x.strip().split(','), keywords) for item in alist]
        keywords = keywords + name

        # Not yet implemented
        # geo = request.args.get('geo', None)
        # intersects = request.args.get('intersects', None)

        if not keywords:
            return {'error': 'Invalid keywords'}, 400

        script = config['script']['linking']
        align_list = script.process_keywords(keywords)

        results = [item
                   for by_keyword in align_list
                   for item in by_keyword['alignments']
                   if item['score'] > 0]
        results = sorted(results, key=lambda item: -item['score'])
        return results


class ApiMetadataList(Resource):
    def __init__(self):
        self.edge_generator = NodeLabelIdGenerator()

    def post(self, dataset: str = None):
        if not request.json:
            content = {
                'Error': 'JSON content body is empty'
            }
            return content, 400

        if dataset:
            return self.post_variable(dataset, request.json)
        else:
            return self.post_dataset(request.json)

    def post_dataset(self, desc: dict):
        # Posting a dataset
        print('Dataset')
        pprint(desc)

        metadata = DatasetMetadata()
        status, code = metadata.from_request(desc)
        if not code == 200:
            return status, code

        if provider.dataset_exists(metadata.shortName):
            content = {
                'Error': f'Dataset identifier {metadata.shortName} has already by used'
            }
            return content, 409

        dataset_id = f'Q{metadata.shortName}'
        if provider.item_exists(dataset_id):
            dataset_id = provider.next_qnode()
        metadata.datasetID = metadata.shortName
        metadata._dataset_id = dataset_id

        pprint(metadata.to_dict())
        edges = pd.DataFrame(metadata.to_kgtk_edges(self.edge_generator, dataset_id))
        pprint(edges)
        content = metadata.to_dict()

        if 'tsv' in request.args:
            tsv = edges.to_csv(sep='\t', quoting=csv.QUOTE_NONE, index=False)
            output = make_response(tsv)
            output.headers['Content-Disposition'] = f'attachment; filename={metadata.shortName}.tsv'
            output.headers['Content-type'] = 'text/tsv'
            return output


        return content, 200

    def post_variable(self, dataset: str, desc: dict):
        print('Variable')
        pprint(desc)

        # desc['datasetID'] = dataset
        # desc['variableID'] = desc.get('shortName', None)

        # parse
        metadata = VariableMetadata()
        status, code = metadata.from_request(desc)
        if not code == 200:
            return status, code

        dataset_id = provider.dataset_exists(dataset)
        if not dataset_id:
            status = {
                'Error': f'Cannot find dataset {dataset}'
            }
            return  status, 404
        metadata.datasetID = dataset

        if metadata.shortName and provider.variable_exists(dataset_id, metadata.shortName):
            status = {
                'Error': f'Variable {metadata.shortName} has already been defined in dataset {dataset}'
            }
            return status, 404

        if not metadata.shortName:
            prefix = f'V{metadata.datasetID}-'
            number = provider.next_variable_value(dataset_id, prefix)
            metadata.shortName = f'{prefix}{number}'
        metadata.variableID = metadata.shortName

        variable_id = f'Q{metadata.datasetID}-{metadata.variableID}'
        if provider.item_exists(variable_id):
            variable_id = provider.next_qnode()
        metadata._variable_id = variable_id

        # property_id = f'P{metadata.datasetID}-{metadata.variableID}'
        # if provider.item_exists(property_id):
        #     property_id = provider.next_pnode()
        # metadata._property_id = property_id


        pprint(metadata.to_dict())
        edges = pd.DataFrame(metadata.to_kgtk_edges(self.edge_generator, dataset_id, variable_id))
        pprint(edges)
        content = metadata.to_dict()

        if 'tsv' in request.args:
            tsv = edges.to_csv(sep='\t', quoting=csv.QUOTE_NONE, index=False)
            output = make_response(tsv)
            output.headers['Content-Disposition'] = f'attachment; filename={metadata.datasetID}-{metadata.variableID}.tsv'
            output.headers['Content-type'] = 'text/tsv'
            return output

        return content, 200
