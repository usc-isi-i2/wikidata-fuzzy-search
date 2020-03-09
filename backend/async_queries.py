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
from cache import CacheAwareLinkingScript

import json
import requests 
import xmltodict
import asyncio

with open('data/wikidata.json') as f:
    all_pnodes = json.loads(f.read())

configs2 = {}
CONFIG_DIR_PATH = os.path.abspath(os.path.join('cfg/', '*.yml'))

loop = asyncio.new_event_loop()
asyncio.set_event_loop(loop)
class ApiAsyncQuery(CacheAwareLinkingScript):

    async def get_statistics_property(country, pnode, time_property):
        query = query = '''SELECT (max(?time) as ?max_time) (min(?time) as ?min_time) (count(?time) as ?count) (max(?precision) as ?max_precision) WHERE {wd:'''+country+''' p:'''+pnode+''' ?o . ?o pq:'''+time_property+''' ?time . optional { ?o pqv:'''+time_property+''' ?time_value . ?time_value wikibase:timePrecision ?precision. } }'''
        url = settings.WD_QUERY_ENDPOINT+query
        response = loop.run_in_executor(None, requests.get ,url)
        return response
    
    # async def handle_async(aligned,alignedmap):
    #     time = []
    #     if aligned["wl"].get_key() is not None:
    #         pnode = aligned["wl"].get_key()
    #         alignedmap['name'] = pnode
    #         for k, v in all_pnodes[pnode].items():
    #             alignedmap[k] = v
    #         #alignedmap['time'] = 
    #         time.append(get_time_property(country, pnode))
    #     #     if alignedmap['time']:
    #     #         alignedmap['statistics'] = get_statistics(country, pnode, alignedmap['time'])
    #     # else:
    #     #     alignedmap["name"] = aligned["wl"].get_original_string()
    #     response = await asyncio.gather(*time)


    def get(keywords,country):
        loop = asyncio.get_event_loop()
        nodes = {
        'P110032': {'label': 'Primary income payments (BoP, current US$)', 'description': 'Primary income payments refer to employee compensation paid to nonresident workers and investment income (payments on direct investment, portfolio investment, other investments). Data are in current U.S. dollars.', 'aliases': []},
        'P110033': {'label': 'Imports of goods and services (BoP, current US$)', 'description': 'Imports of goods and services comprise all transactions between residents of a country and the rest of the world involving a change of ownership from nonresidents to residents of general merchandise, nonmonetary gold, and services. Data are in current U.S. dollars.', 'aliases': []},
        'P110034': {'label': 'Insurance and financial services (of service imports, BoP)', 'description': 'Insurance and financial services cover various types of insurance  provided to nonresidents by resident insurance enterprises and vice versa, and financial intermediary and auxiliary services (except those of insurance enterprises and pension funds) exchanged between residents and nonresidents.', 'aliases': []},
        'P110035': {'label': 'Goods imports (BoP, current US$)', 'description': 'Goods imports refer to all movable goods (including nonmonetary gold) involved in a change of ownership from nonresidents to residents. Data are in current U.S. dollars.', 'aliases': []},
        'P110036': {'label': 'Service imports (BoP, current US$)', 'description': 'Services refer to economic output of intangible commodities that may be produced, transferred, and consumed at the same time. Data are in current U.S. dollars.', 'aliases': []},
        'P110037': {'label': 'Charges for the use of intellectual property, payments (BoP, current US$)', 'description': 'Charges for the use of intellectual property are payments and receipts between residents and nonresidents for the authorized use of proprietary rights (such as patents, trademarks, copyrights, industrial processes and designs including trade secrets, and franchises) and for the use, through licensing agreements, of produced originals or prototypes (such as copyrights on books and manuscripts, computer software, cinematographic works, and sound recordings) and related rights (such as for live performances and television, cable, or satellite broadcast). Data are in current U.S. dollars.', 'aliases': []},
        'P110038': {'label': 'Imports of goods, services and primary income (BoP, current US$)', 'description': 'Imports of goods, services and primary income is the sum of goods imports, service imports and primary income payments. Data are in current U.S. dollars.', 'aliases': []},
        'P110039': {'label': 'Transport services (of service imports, BoP)', 'description': 'Transport covers all transport services (sea, air, land, internal waterway, pipeline, space and electricity transmission) performed by residents of one economy for those of another and involving the carriage of passengers, the movement of goods (freight), rental of carriers with crew, and related support and auxiliary services. Also included are postal and courier services. Excluded are freight insurance (included in insurance services); goods procured in ports by nonresident carriers (included in goods); maintenance and repairs on transport equipment (included in maintenance and repair services n.i.e.); and repairs of railway facilities, harbors, and airfield facilities (included in construction).', 'aliases': []}}
        responses = []
        for node in nodes.keys():
            responses.append(get_time_property(country, node))
            
        results = loop.run_until_complete(asyncio.gather(*responses))
        print(results)


async def get_time_property(country, pnode):
    loop = asyncio.get_event_loop()
    query = '''?query=SELECT DISTINCT ?qualifier_no_prefix WHERE {wd:'''+country+''' p:'''+pnode+''' ?o . ?o ?qualifier ?qualifier_value . FILTER (STRSTARTS(STR(?qualifier), STR(pq:))) . FILTER (!STRSTARTS(STR(?qualifier), STR(pqv:))) . BIND (IRI(REPLACE(STR(?qualifier), STR(pq:), STR(wd:))) AS ?qualifier_entity) . ?qualifier_entity wikibase:propertyType wikibase:Time . BIND (STR(REPLACE(STR(?qualifier), STR(pq:), "")) AS ?qualifier_no_prefix) . }'''
    url = settings.WD_QUERY_ENDPOINT+query
    response = loop.run_in_executor(None, requests.get ,url)
    return response

def get_statistics(country, pnode, time_property):
    query = '''
SELECT (max(?time) as ?max_time) (min(?time) as ?min_time) (count(?time) as ?count) (max(?precision) as ?max_precision) WHERE {
  wd:'''+country+''' p:'''+pnode+''' ?o .
  ?o pq:'''+time_property+''' ?time .
  optional {
    ?o pqv:'''+time_property+''' ?time_value .
    ?time_value wikibase:timePrecision ?precision.
  }
}'''
    sparql_endpoint.setQuery(query)
    sparql_endpoint.setReturnFormat(JSON)
    results = sparql_endpoint.query().convert()

    statistics = {}
    for result in results["results"]["bindings"]:
        statistics['max_time'] = result['max_time']['value']
        statistics['min_time'] = result['min_time']['value']
        statistics['count'] = int(result['count']['value'])
        max_precision = result['max_precision']['value']
        statistics['max_precision'] = int(max_precision) if max_precision else None
    return statistics


# def load_resources(cls=ApiAsyncQuery):
#     # preload resources
#     print('loading resources...')
#     resources['GNews_SLIM_model'] = load_word2vec_model(settings.WORD2VEC_MODEL_PATH, binary=True)

#     # configs
#     for config_path in glob.glob(CONFIG_DIR_PATH):
#         print('loading config:', config_path)
#         k = os.path.splitext(os.path.basename(config_path))[0]
#         configs[k] = {
#             'abspath': config_path,
#             'config': make_YML_config(config_path),
#             'script': {
#                 'alignment': None,
#                 'linking': None
#             }
#         }
#         configs[k]['config'].set_augmenter_preload_resources(resources)

#     # load datasets
#     for k in configs.keys():
#         print('loading datasets...', k)
#         script = cls(configs[k]['config'])
#         script.prepare_datasets()
#         configs[k]['script']['linking'] = script
        


