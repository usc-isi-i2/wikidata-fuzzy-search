import asyncio
import csv

from pprint import pprint

import pandas as pd

from flask import Flask, request, jsonify, make_response
from flask_restful import Resource, reqparse
from SPARQLWrapper import SPARQLWrapper, JSON

from datamart import DatasetMetadata, VariableMetadata
from fuzzy import config, get_variable_metadata
from kgtk import id_generator, NodeLabelIdGenerator

import settings


sparql = SPARQLWrapper(settings.BLAZEGRAPH_QUERY_ENDPOINT)
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

# dataset_metadata_parser = reqparse.RequestParser()
# for field in DatasetMetadata.fields():
#     action = 'append' if DatasetMetadata.is_list_field(field) else 'store'
#     dataset_metadata_parser.add_argument(
#         field, default=DatasetMetadata.is_required_field(field), action=action
#         )

# variable_metadata_parser = reqparse.RequestParser()
# for field in VariableMetadata.fields():
#     # action = 'append' if VariableMetadata.is_list_field(field) else 'store'
#     # variable_metadata_parser.add_argument(
#     #     field, default=DatasetMetadata.is_required_field(field), action=action
#     #     )
#     field_type = list if VariableMetadata.is_list_field(field) else str
#     variable_metadata_parser.add_argument(
#         field, default=DatasetMetadata.is_required_field(field), type=field_type
#         )

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

        dataset_id = get_dataset_id(metadata.shortName)
        pprint(metadata.to_dict())
        edges = pd.DataFrame(metadata.to_kgtk_edges(self.edge_generator, dataset_id))
        pprint(edges)
        content = {
            'name': metadata.name,
            'description': metadata.description,
            'url': metadata.url,
            'datasetID': metadata.shortName
        }

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

        desc['datasetID'] = dataset
        desc['variableID'] = desc.get('shortName', None)

        # parse
        metadata = VariableMetadata()
        status, code = metadata.from_request(desc)
        if not code == 200:
            return status, code

        metadata.datasetID = dataset
        metadata.variableID = metadata.shortName
        dataset_id = get_dataset_id(dataset)
        variable_id = next(qnode)
        pprint(metadata.to_dict())
        edges = pd.DataFrame(metadata.to_kgtk_edges(self.edge_generator, dataset_id, variable_id))
        pprint(edges)
        content = {
            'name':  metadata.name,
            'datasetID': metadata.datasetID,
            'variableID': metadata.variableID
        }

        if 'tsv' in request.args:
            tsv = edges.to_csv(sep='\t', quoting=csv.QUOTE_NONE, index=False)
            output = make_response(tsv)
            output.headers['Content-Disposition'] = f'attachment; filename={metadata.datasetID}-{metadata.variableID}.tsv'
            output.headers['Content-type'] = 'text/tsv'
            return output

        return content, 200
