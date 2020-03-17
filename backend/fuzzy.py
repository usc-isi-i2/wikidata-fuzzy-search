# pylint: disable=import-error, undefined-variable
# This code imports from linking_script, which is unaccessible to pylint, so we disable the above warnings

import os
import sys
import glob
import json
import tempfile
import settings
import sparql

from flask import Flask, request, jsonify
from flask_restful import Api, Resource, reqparse
from flask_cors import CORS
from wikidata import ApiWikidata

settings.set_python_path()
from linking_script import unweighted_to_weighted, load_word2vec_model, make_YML_config
from cache import CacheAwareLinkingScript

config = {}
resources = {}

CONFIG_DIR_PATH = os.path.abspath(os.path.join(settings.LINKING_SCRIPT_CONFIG_PATH, '*.yml'))

with open(settings.get_wikidata_json_path()) as f:
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
    results = sparql.query(query)

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
    results = sparql.query(query)

    statistics = {}
    for result in results["results"]["bindings"]:
        statistics['max_time'] = result['max_time']['value']
        statistics['min_time'] = result['min_time']['value']
        statistics['count'] = int(result['count']['value'])
        max_precision = result['max_precision']['value']
        statistics['max_precision'] = int(max_precision) if max_precision else None
    return statistics


def load_resources(cls=WikidataLinkingScript):
    global config

    # preload resources
    print('loading resources...')
    resources['GNews_SLIM_model'] = load_word2vec_model(settings.WORD2VEC_MODEL_PATH, binary=True)

    # load the single wikidata configuration
    config_path = expand_wikidata_template()
    config['abspath'] = config_path
    config['config'] = make_YML_config(config_path)
    config['script'] = {
                'alignment': None,
                'linking': None
            }
    config['config'].set_augmenter_preload_resources(resources)

    # load datasets
    print('loading datasets...')
    script = cls(config['config'])
    script.prepare_datasets()
    config['script']['linking'] = script
    return config

def expand_wikidata_template():
    # We have the file wikidata.yml.template in our source code, we need
    # to change the $WIKIDATA_CSV_PATH value to the actual path, which is stored in settings.
    # We save the expanded yml file in a temporary file and use that.
    
    with open(os.path.join(settings.BACKEND_DIR, 'wikidata.yml.template'), 'r') as tf:
        template = tf.read()
    
    expanded = template.replace('$WIKIDATA_CSV_PATH', settings.get_wikidata_csv_path())
    temp_handle, temp_name = tempfile.mkstemp('.yml')
    temp = os.fdopen(temp_handle, 'w', encoding='utf-8')
    temp.write(expanded)
    temp.close()

    return temp_name
