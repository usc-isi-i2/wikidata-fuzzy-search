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
from cache import CacheAwareLinkingScript

configs = {}
resources = {}

CONFIG_DIR_PATH = os.path.abspath(os.path.join('cfg/', '*.yml'))
sparql_endpoint = SPARQLWrapper(settings.WD_QUERY_ENDPOINT)

with open('data/wikidata.json') as f:
    all_pnodes = json.loads(f.read())


class WikidataLinkingScript(CacheAwareLinkingScript):
    def process(self, keywords, country):
        self.source_data = self.load_source_data(keywords)
        self.source_data_filtered = self.filter_source_data(self.source_data)
        self.source_data_aug = self.augment_source_data(self.source_data_filtered)
        self.source_data_aug_filtered = unweighted_to_weighted(self.filter_augmented_source_data(self.source_data_aug))

        alignments = self.align_datasets(self.source_data_aug_filtered, 
                                         self.target_data_aug_filtered)

        augmentations = {k: s.word_map for k, s in zip(keywords, self.source_data_aug_filtered)}
        alignlist = []
        for alignment in alignments.keys():
            alignmap = dict()
            alignmap['keyword'] = alignment
            alignmap['augmentation'] = augmentations[alignment]
            alignmap['alignments'] = []
            for aligned in alignments[alignment]:
                alignedmap = dict()
                if aligned["wl"] is not None:
                    if aligned["wl"].get_key() is not None:
                        pnode = aligned["wl"].get_key()
                        alignedmap['name'] = pnode
                        # alignedmap["desc"] = aligned["wl"].get_original_string()
                        for k, v in all_pnodes[pnode].items():
                            alignedmap[k] = v
                        alignedmap['time'] = get_time_property(country, pnode)
                        if alignedmap['time']:
                            alignedmap['statistics'] = get_statistics(country, pnode, alignedmap['time'])
                    else:
                        alignedmap["name"] = aligned["wl"].get_original_string()
                alignedmap["score"] = aligned["score"]
                alignmap['alignments'].append(alignedmap)
            alignlist.append(alignmap)
        return alignlist

def get_time_property(country, pnode):
    query = '''
SELECT DISTINCT ?qualifier_no_prefix WHERE {
  wd:'''+country+''' p:'''+pnode+''' ?o .
  ?o ?qualifier ?qualifier_value .
  FILTER (STRSTARTS(STR(?qualifier), STR(pq:))) .
  FILTER (!STRSTARTS(STR(?qualifier), STR(pqv:))) .
  BIND (IRI(REPLACE(STR(?qualifier), STR(pq:), STR(wd:))) AS ?qualifier_entity) .
  ?qualifier_entity wikibase:propertyType wikibase:Time .
  BIND (STR(REPLACE(STR(?qualifier), STR(pq:), "")) AS ?qualifier_no_prefix) .
 }'''
    sparql_endpoint.setQuery(query)
    sparql_endpoint.setReturnFormat(JSON)
    results = sparql_endpoint.query().convert()

    ret = None
    for result in results["results"]["bindings"]:
        ret = result['qualifier_no_prefix']['value']
    return ret

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


def load_resources(cls=WikidataLinkingScript):
    # preload resources
    print('loading resources...')
    resources['GNews_SLIM_model'] = load_word2vec_model(settings.WORD2VEC_MODEL_PATH, binary=True)

    # configs
    for config_path in glob.glob(CONFIG_DIR_PATH):
        print('loading config:', config_path)
        k = os.path.splitext(os.path.basename(config_path))[0]
        configs[k] = {
            'abspath': config_path,
            'config': make_YML_config(config_path),
            'script': {
                'alignment': None,
                'linking': None
            }
        }
        configs[k]['config'].set_augmenter_preload_resources(resources)

    # load datasets
    for k in configs.keys():
        print('loading datasets...', k)
        script = cls(configs[k]['config'])
        script.prepare_datasets()
        configs[k]['script']['linking'] = script
