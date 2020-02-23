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
from SPARQLWrapper import SPARQLWrapper, JSON

from flask import Flask, request, jsonify
from flask_restful import Api, Resource, reqparse
from flask_cors import CORS
from wikidata import ApiWikidata

settings.set_python_path()
from linking_script import *
from flask_restful import Resource

configs = {}
resources = {}

CONFIG_DIR_PATH = os.path.abspath(os.path.join('cfg/', '*.yml'))
sparql_endpoint = SPARQLWrapper(settings.WD_QUERY_ENDPOINT)
import urllib.request
import json
import requests 


class ApiAsyncQuery(Resource):
    def get(self):
        country = request.args.get('country', None)
        pnode = request.args.get('pnode', None)
        query = '''?query=SELECT DISTINCT ?qualifier_no_prefix WHERE {wd:'''+country+''' p:'''+pnode+''' ?o . ?o ?qualifier ?qualifier_value . FILTER (STRSTARTS(STR(?qualifier), STR(pq:))) . FILTER (!STRSTARTS(STR(?qualifier), STR(pqv:))) . BIND (IRI(REPLACE(STR(?qualifier), STR(pq:), STR(wd:))) AS ?qualifier_entity) . ?qualifier_entity wikibase:propertyType wikibase:Time . BIND (STR(REPLACE(STR(?qualifier), STR(pq:), "")) AS ?qualifier_no_prefix) . }'''

        data = settings.WD_QUERY_ENDPOINT+query
        r = requests.get(url=data).text
        return r


