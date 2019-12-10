import os
import sys
import glob
import json
import pickle
import random
import time
import nltk
nltk.data.path = ['data/nltk_data']
from SPARQLWrapper import SPARQLWrapper, JSON

from flask import Flask, request, jsonify
from flask_restful import Api, Resource, reqparse
from flask_cors import CORS

sys.path.append('data-label-augmentation')
sys.path.append('data-label-augmentation/src/label_augmenter/')
WORD2VEC_MODEL_PATH = 'data-label-augmentation/data/GoogleNews-vectors-negative300-SLIM.bin'
WD_QUERY_ENDPOINT = 'http://dsbox02.isi.edu:8888/bigdata/namespace/wdq/sparql'
CONFIG_PATH = 'cfg/wikidata.yml'
DATA_PATH = 'data/wikidata.json'

from linking_script import *

app = Flask(__name__)
api = Api(app)
CORS(app)
config = {}
resources = {}
random.seed(time.time())

sparql_endpoint = SPARQLWrapper(WD_QUERY_ENDPOINT)
ADMIN_SUB_LEVELS = [None, 'Q10864048', 'Q13220204', 'Q13221722']

with open(DATA_PATH) as f:
    all_pnodes = json.loads(f.read())


class WikidataLinkingScript(LinkingScript):
    def load_from_cache(self, cache_file, func, *args):
        if os.path.exists(cache_file):
            with open(cache_file, 'rb') as f:
                r = pickle.load(f)
        else:
            r = func(*args)
            if cache_file:
                with open(cache_file, 'wb') as f:
                    pickle.dump(r, f)
        return r

    def prepare_datasets(self, 
            target_data=None, target_data_filtered=None, 
            target_data_aug=None, target_data_aug_filtered=None):
        self.target_data = self.load_from_cache(target_data, self.load_target_data)
        self.target_data_filtered = self.load_from_cache(target_data_filtered, self.filter_target_data, self.target_data)
        self.target_data_aug = self.load_from_cache(target_data_aug, self.augment_target_data, self.target_data_filtered)
        self.target_data_aug_filtered  = self.load_from_cache(target_data_aug_filtered, self.filter_augmented_target_data, self.target_data_aug)

    def process(self, keywords, country, admin_level):
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
            # alignmap['subdivisions'] = get_subdivisions(country, admin_level)
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
                        alignedmap['qualifiers'] = get_qualifiers(country, pnode)
                        if alignedmap['time']:
                            alignedmap['statistics'] = get_statistics(country, pnode, alignedmap['time'])
                        # alignedmap['subdivisions'] = {'count': 0}
                        # for sub in random.sample(alignmap['subdivisions'].keys(), 5):
                        #     get_statistics(sub, pnode, alignedmap['time'])
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

def get_qualifiers(country, pnode):
    query = '''
SELECT DISTINCT ?qualifier_no_prefix ?qualifier_entityLabel WHERE {
  wd:'''+country+''' p:'''+pnode+''' ?o .
  ?o ?qualifier ?qualifier_value .
  FILTER (STRSTARTS(STR(?qualifier), STR(pq:))) .
  FILTER (!STRSTARTS(STR(?qualifier), STR(pqv:))) .
  BIND (IRI(REPLACE(STR(?qualifier), STR(pq:), STR(wd:))) AS ?qualifier_entity) .
  BIND (STR(REPLACE(STR(?qualifier), STR(pq:), "")) AS ?qualifier_no_prefix) .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en" }
}'''
    sparql_endpoint.setQuery(query)
    sparql_endpoint.setReturnFormat(JSON)
    results = sparql_endpoint.query().convert()

    qualifiers = {}
    for result in results["results"]["bindings"]:
        qualifiers[result['qualifier_no_prefix']['value']] = result['qualifier_entityLabel']['value']
    return qualifiers

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

def get_statistics_subdivisions(subs, pnode, time_property):
    query = '''
SELECT (max(?time) as ?max_time) (min(?time) as ?min_time) (count(?time) as ?count) (max(?precision) as ?max_precision) WHERE {
  VALUES ?sub {''' + ' '.join(['wd:{}'.format(sub) for sub in subs]) + '''}
  ?sub p:'''+pnode+''' ?o .
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
        sub = result['sub']['value']
        statistics[sub] = {}
        statistics[sub]['max_time'] = result['max_time']['value']
        statistics[sub]['min_time'] = result['min_time']['value']
        statistics[sub]['count'] = int(result['count']['value'])
        max_precision = result[sub]['max_precision']['value']
        statistics[sub]['max_precision'] = int(max_precision) if max_precision else None
    return statistics

def get_subdivisions(country, admin_level, parent_qnode=None):
    if admin_level == 0:
        return {}

    if admin_level == 1:
        query = '''
SELECT DISTINCT ?sub_no_prefix ?subLabel WHERE {
  VALUES ?country { wd:''' + country + ''' }
  VALUES ?admin_level { wd:''' + ADMIN_SUB_LEVELS[admin_level] + ''' }
  ?sub p:P31/ps:P31 ?level .
  ?level p:P279/ps:P279 ?admin_level .
  ?level p:P17/ps:P17 ?country .
  BIND (STR(REPLACE(STR(?sub), STR(wd:), "")) AS ?sub_no_prefix) .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en" }
}'''
    else:
        query = '''
SELECT DISTINCT ?sub_no_prefix ?subLabel WHERE {
  VALUES ?country { wd:''' + country + ''' }
  VALUES ?admin_level { wd:''' + ADMIN_SUB_LEVELS[admin_level] + ''' }
  VALUES ?parent_qnode { wd:''' + parent_qnode + ''' }
  
  ?sub p:P31/ps:P31 ?level . 
  {
    ?level p:P279/ps:P279 ?admin_level .
    ?level p:P17/ps:P17 ?country .
  } UNION {
    {?level p:P279/ps:P279 ?level_ . }
    UNION {?level p:P279/ps:P279/p:P279/ps:P279 ?level_ . }
    UNION {?level p:P279/ps:P279/p:P279/ps:P279/p:P279/ps:P279 ?level_ . }
    ?level_ p:P279/ps:P279 ?admin_level .
    ?level_ p:P17/ps:P17 ?country .
  }
  
  {?sub p:P361/ps:P361 ?parent_qnode . }
  UNION {?sub p:P131/ps:P131 ?parent_qnode . }

  BIND (STR(REPLACE(STR(?sub), STR(wd:), "")) AS ?sub_no_prefix) .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en" }
}'''

    sparql_endpoint.setQuery(query)
    sparql_endpoint.setReturnFormat(JSON)
    results = sparql_endpoint.query().convert()

    subs = {}
    for result in results["results"]["bindings"]:
        subs[result['sub_no_prefix']['value']] = result['subLabel']['value']

    return subs


def load_resources():
    global config, resources

    # preload resources
    print('loading resources...')
    resources['GNews_SLIM_model'] = load_word2vec_model(WORD2VEC_MODEL_PATH, binary=True)

    # config
    config = {
        'config': make_YML_config(CONFIG_PATH),
        'script': {
            'alignment': None,
            'linking': None
        }
    }
    config['config'].set_augmenter_preload_resources(resources)

    # load datasets
    print('loading datasets...')
    script = WikidataLinkingScript(config['config'])
    script.prepare_datasets(
        target_data='data/wikidata_target_data.pkl', 
        target_data_filtered='data/wikidata_target_data_filtered.pkl', 
        target_data_aug='data/wikidata_target_data_aug.pkl', 
        target_data_aug_filtered='data/wikidata_target_data_aug_filtered.pkl')
    config['script']['linking'] = script


class ApiRoot(Resource):
    def get(self):
        return 'Wikidata Fuzzy Search'

class ApiAdmin(Resource):
    def get(self):
        country = request.args.get('country', None)
        if not country:
            return {'error': 'Invalid country'}, 400

        admin_levels = [country]
        for i in range(1, len(ADMIN_SUB_LEVELS)-1):
            admin_level = request.args.get('admin_{}'.format(i), 'all')
            if admin_level == 'all':
                break
            admin_levels.append(admin_level)

        # print(admin_levels)
        return get_subdivisions(admin_levels[0], len(admin_levels),
            parent_qnode=admin_levels[-1] if len(admin_levels) > 1 else None)

class ApiSearch(Resource):
    def get(self):
        global config

        keywords = request.args.get('keywords', None)
        if not keywords:
            return {'error': 'Invalid keywords'}, 400
        keywords = list(map(lambda x: x.strip(), keywords.split(',')))

        country = request.args.get('country', None)
        if not country:
            return {'error': 'Invalid country'}, 400

        admin_level = request.args.get('admin_level', 0)
        try:
            admin_level = int(admin_level)
            if not (0 <= admin_level < len(ADMIN_SUB_LEVELS)):
                raise Exception
        except:
            return {'error': 'Invalid admin_level'}, 400

        script = config['script']['linking']
        align_list = script.process(keywords, country, admin_level)
        return align_list


api.add_resource(ApiRoot, '/')
api.add_resource(ApiSearch, '/search')
api.add_resource(ApiAdmin, '/admin')

if __name__ == '__main__':
    # load_resources()
    app.run(debug=False, host="0.0.0.0", port=14000)
