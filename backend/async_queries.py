# pylint: disable=import-error, undefined-variable
# This code imports from linking_script, which is unaccessible to pylint, so we disable the above warnings


# Configuration parameters:
# data-label-augmentation path
# word2vec model path
# SPARQL endpoint
# CONFIG_DIR_PATH (current code is based on the current folder)
# Cache folder

import os
import sys
import glob
import json
import settings
from flask import Flask, request, jsonify
from flask_restful import Api, Resource, reqparse
from flask_cors import CORS
settings.set_python_path()
from linking_script import *
from flask_restful import Resource

import json
import requests 
import xmltodict
import asyncio

class ApiAsyncQuery(Resource):
    async def make_request(self ,country, pnode):
        loop = asyncio.get_event_loop()
        query = '''?query=SELECT DISTINCT ?qualifier_no_prefix WHERE {wd:'''+country+''' p:'''+pnode+''' ?o . ?o ?qualifier ?qualifier_value . FILTER (STRSTARTS(STR(?qualifier), STR(pq:))) . FILTER (!STRSTARTS(STR(?qualifier), STR(pqv:))) . BIND (IRI(REPLACE(STR(?qualifier), STR(pq:), STR(wd:))) AS ?qualifier_entity) . ?qualifier_entity wikibase:propertyType wikibase:Time . BIND (STR(REPLACE(STR(?qualifier), STR(pq:), "")) AS ?qualifier_no_prefix) . }'''
        url = settings.WD_QUERY_ENDPOINT+query
        futures = [
            loop.run_in_executor(
                None, 
                requests.get, 
                url
            )
            for i in range(20)
        ]
        for response in await asyncio.gather(*futures):
            print(response.text)

    def get(self):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        country = request.args.get('country', None)
        pnode = request.args.get('pnode', None)
        loop.run_until_complete(self.make_request(country, pnode))
        
        


