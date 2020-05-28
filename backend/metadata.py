import asyncio

from flask import Flask, request, jsonify
from flask_restful import Resource
from SPARQLWrapper import SPARQLWrapper, JSON

from fuzzy import config, get_variable_metadata
import settings

sparql = SPARQLWrapper(settings.BLAZEGRAPH_QUERY_ENDPOINT)

# These property names will change in the future
property_map = {
    'correspondsToProperty': 'pd:correspondsToProperty',
    'hasQualifier': 'pd:hasQualifier'
}

class ApiMetadata(Resource):
    def get(self, pnode: str = None):
        if pnode:
            return asyncio.run(get_variable_metadata(pnode))
        name = request.args.getlist('name')
        name = [item for alist in map(lambda x: x.strip().split(','), name) for item in alist ]
        keywords = request.args.getlist('keywords')
        keywords = [item for alist in map(lambda x: x.strip().split(','), keywords) for item in alist ]
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
