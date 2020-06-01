# pylint: disable=import-error, undefined-variable
# This code imports from linking_script, which is unaccessible to pylint, so we disable the above warnings

import os
import sys
import glob
import json
import tempfile
import settings
import sparql
import asyncio

from flask import Flask, request, jsonify
from flask_restful import Api, Resource, reqparse
from flask_cors import CORS
from wikidata import ApiWikidata

settings.set_python_path()
from linking_script import unweighted_to_weighted, load_word2vec_model, make_YML_config
from cache import CacheAwareLinkingScript

from datamart import VariableMetadata

config = {}
resources = {}

CONFIG_DIR_PATH = os.path.abspath(os.path.join(settings.LINKING_SCRIPT_CONFIG_PATH, '*.yml'))

with open(settings.get_wikidata_json_path()) as f:
    all_pnodes = json.loads(f.read())

class WikidataLinkingScript(CacheAwareLinkingScript):
    def process(self, keywords, country):
        return asyncio.run(self._async_process(keywords, country))

    async def _async_process(self, keywords, country):
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

            awaitables = []
            for aligned in alignments[alignment]:
                awaitables.append(self._process_one_aligned(aligned, country))
            results = await asyncio.gather(*awaitables)

            alignmap['alignments'] = results
            alignlist.append(alignmap)
        return alignlist

    async def _process_one_aligned(self, aligned, country):
        alignedmap = dict()
        if aligned["wl"] is not None:
            if aligned["wl"].get_key() is not None:
                pnode = aligned["wl"].get_key()
                alignedmap['name'] = pnode
                # alignedmap["desc"] = aligned["wl"].get_original_string()
                for k, v in all_pnodes[pnode].items():
                    alignedmap[k] = v
                alignedmap['time'] = await get_time_property(country, pnode)
                if alignedmap['time']:
                    alignedmap['statistics'] = await get_statistics(country, pnode, alignedmap['time'])
            else:
                alignedmap["name"] = aligned["wl"].get_original_string()
        alignedmap["score"] = aligned["score"]

        return alignedmap

    def process_keywords(self, keywords):
        return asyncio.run(self._async_process_keywords(keywords))

    async def _async_process_keywords(self, keywords):
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

            awaitables = []
            for aligned in alignments[alignment]:
                awaitables.append(self._process_one_aligned_use_metadata(aligned))
            results = await asyncio.gather(*awaitables)

            alignmap['alignments'] = results
            alignlist.append(alignmap)
        return alignlist


    async def _process_one_aligned_use_metadata(self, aligned):
        alignedmap = dict()
        if aligned["wl"] is not None:
            if aligned["wl"].get_key() is not None:
                pnode = aligned["wl"].get_key()
                alignedmap['name'] = pnode
                # alignedmap["desc"] = aligned["wl"].get_original_string()
                for k, v in all_pnodes[pnode].items():
                    alignedmap[k] = v
                metadata = await get_variable_metadata('Wikidata', f'V{pnode}')
                alignedmap.update(metadata)
            else:
                alignedmap["name"] = aligned["wl"].get_original_string()
        alignedmap["score"] = aligned["score"]

        return alignedmap

async def get_variable_metadata(datasetID: str, variableID: str) -> dict:
    '''Lookup variable metadata from Blazegraph'''
    #  ?dataset pd:P1687 "{pnode}".

    # OPTIONAL { ?variable pd:P921 ?mainSubject . }
    # OPTIONAL { ?variable pd:P17 ?country . }
    # OPTIONAL { ?variable pd:P276 ?Location . }

    query = f'''
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX schema: <http://schema.org/>
PREFIX pd: <http://www.wikidata.org/prop/direct/>
PREFIX p: <http://www.wikidata.org/prop/>
PREFIX pq: <http://www.wikidata.org/prop/qualifier/>
PREFIX psv: <http://www.wikidata.org/prop/statement/value/>
PREFIX wikibase: <http://wikiba.se/ontology#>

SELECT ?dataset ?variable ?name ?shortName ?description ?correspondsToProperty ?unitOfMeasure ?startTime ?startTime_precision ?endTime ?endTime_precision ?dataInterval ?count
WHERE {{
  ?dataset p:P31/pq:P1932 "{datasetID}" .
  ?dataset pd:PvariableMeasured ?variable .
  ?variable p:P31/pq:P1932 "{variableID}" .
  ?variable pd:PcorrespondsToProperty ?correspondsToProperty .
  ?variable pd:P31 wd:Q50701 .
  ?variable pd:P1476 ?name .
  OPTIONAL {{ ?variable pd:P1813 ?shortName . }}
  OPTIONAL {{ ?variable schema:description ?description . }}
  OPTIONAL {{
    ?variable pd:P1880 ?unitOfMeasure .
  }}
  OPTIONAL {{
    ?variable p:P580/psv:P580 ?st.
    ?st wikibase:timePrecision ?startTime_precision.
    ?st wikibase:timeValue ?startTime. }}
  OPTIONAL {{
    ?variable p:P582/psv:P582 ?se .
    ?se wikibase:timePrecision ?endTime_precision.
    ?se wikibase:timeValue ?endTime. }}
  # OPTIONAL {{ ?variable pd:P580 ?startTime . }}
  # OPTIONAL {{ ?variable pd:P582 ?endTime . }}
  OPTIONAL {{
    ?variable pd:P6339 ?dataInterval .
  }}
  OPTIONAL {{ ?variable pd:P1114 ?count . }}
}}
'''
    metadata = {}
    results = await sparql.async_query(query, endpoint=settings.BLAZEGRAPH_QUERY_ENDPOINT)
    if not results["results"]["bindings"]:
        return metadata
    result = results["results"]["bindings"][0]
    variable = result['variable']['value']
    metadata['name'] = result['name']['value']
    metadata['datasetID'] = datasetID
    metadata['variableID'] = variableID
    if 'shortName' in result:
        metadata['shortName'] = result['shortName']['value']
    if 'description' in result:
        metadata['description'] = result['description']['value']
    if 'correspondsToProperty' in result:
        metadata['correspondsToProperty'] = result['correspondsToProperty']['value']
    if 'unitOfMeasure' in result:
        metadata['unitOfMeasure'] = result['unitOfMeasure']['value']
    if 'startTime' in result:
        metadata['startTime'] = result['startTime']['value']
    if 'startTime_precision' in result:
        metadata['startTime_precision'] = result['startTime_precision']['value']
    if 'endTime' in result:
        metadata['endTime'] = result['endTime']['value']
    if 'endTime_precision' in result:
        metadata['endTime_precision'] = result['endTime_precision']['value']
    if 'dataInterval' in result:
        metadata['dataInterval'] = result['dataInterval']['value']
    if 'count' in result:
        metadata['count'] = result['count']['value']

    qualifier_query = f'''
PREFIX pd: <http://www.wikidata.org/prop/direct/>
PREFIX schema: <http://schema.org/>
SELECT ?qualifier ?name
WHERE {{
  <{variable}> pd:hasQualifier ?qualifier .
  <{variable}> schema:name ?name .
}}
'''
    results = await sparql.async_query(qualifier_query, endpoint=settings.BLAZEGRAPH_QUERY_ENDPOINT)
    qualifiers = []
    for result in results["results"]["bindings"]:
        if 'qualifier' in result:
            qualifiers.append({
                'name': result['name']['value'],
                'identifier': result['qualifier']['value']
            })
    if qualifiers:
        metadata['qualifiers'] = qualifiers

    main_subject_query = f'''
PREFIX pd: <http://www.wikidata.org/prop/direct/>
PREFIX schema: <http://schema.org/>
SELECT ?main_subject
WHERE {{
  <{variable}> pd:P921 ?main_subject .
}}
'''
    results = await sparql.async_query(main_subject_query, endpoint=settings.BLAZEGRAPH_QUERY_ENDPOINT)
    main_subjects = []
    for result in results["results"]["bindings"]:
        if 'main_subject' in result:
            main_subjects.append(result['main_subject']['value'])
    if main_subjects:
        metadata['mainSubject'] = main_subjects

    location_query = f'''
PREFIX pd: <http://www.wikidata.org/prop/direct/>
PREFIX schema: <http://schema.org/>
SELECT ?location
WHERE {{
  <{variable}> pd:P276 ?location .
}}
'''
    results = await sparql.async_query(location_query, endpoint=settings.BLAZEGRAPH_QUERY_ENDPOINT)
    locations = []
    for result in results["results"]["bindings"]:
        if 'location' in result:
            locations.append(result['location']['value'])
    if locations:
        metadata['location'] = locations


    country_query = f'''
PREFIX pd: <http://www.wikidata.org/prop/direct/>
PREFIX schema: <http://schema.org/>
SELECT ?country
WHERE {{
  <{variable}> pd:P17 ?country .
}}
'''
    results = await sparql.async_query(country_query, endpoint=settings.BLAZEGRAPH_QUERY_ENDPOINT)
    country = []
    for result in results["results"]["bindings"]:
        if 'country' in result:
            country.append(result['country']['value'])
    if country:
        metadata['country'] = country

    variable_metadata = VariableMetadata()
    variable_metadata.from_sparql_dict(metadata)
    return variable_metadata.to_dict()

async def get_time_property(country, pnode):
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
    results = await sparql.async_query(query)

    ret = None
    for result in results["results"]["bindings"]:
        ret = result['qualifier_no_prefix']['value']
    return ret

async def get_statistics(country, pnode, time_property):
    query = '''
SELECT (max(?time) as ?max_time) (min(?time) as ?min_time) (count(?time) as ?count) (max(?precision) as ?max_precision) WHERE {
  wd:'''+country+''' p:'''+pnode+''' ?o .
  ?o pq:'''+time_property+''' ?time .
  optional {
    ?o pqv:'''+time_property+''' ?time_value .
    ?time_value wikibase:timePrecision ?precision.
  }
}'''
    results = await sparql.async_query(query)

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
