import sys
import requests
import csv
import json
from SPARQLWrapper import SPARQLWrapper, JSON
import settings
import os

def update_from_wikidata(csv_writer, json_writer):
    sparql = SPARQLWrapper(settings.WD_QUERY_ENDPOINT)
    query = '''
select ?p_no_prefix ?pLabel ?pDescription ?pAltLabel where {
  ?p wikibase:propertyType wikibase:Quantity.
  BIND (STR(REPLACE(STR(?p), STR(wd:), "")) AS ?p_no_prefix) .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en" }
}'''
    sparql.setQuery(query)
    sparql.setReturnFormat(JSON)
    results = sparql.query().convert()
    json_obj = {}

    for result in results["results"]["bindings"]:
        p = result['p_no_prefix']['value']
        p_label = result['pLabel']['value'] if 'pLabel' in result else ''
        p_desc = result['pDescription']['value'] if 'pDescription' in result else ''
        p_alias = result['pAltLabel']['value'] if 'pAltLabel' in result else ''
        csv_writer.writerow([p, ' '.join([p_label, p_desc, p_alias])])
        json_obj[p] = {
            'label': p_label,
            'description': p_desc,
            'aliases': list(filter(lambda x: len(x) != 0, map(lambda x: x.strip(), p_alias.split(','))))
        }

    json_writer.write(json.dumps(json_obj))

def update_index():
    csv_file = open(settings.get_wikidata_csv_path(), 'w', newline='', encoding='utf-8')
    csv_writer = csv.writer(csv_file, delimiter=',')
    json_writer = open(settings.get_wikidata_json_path(), 'w')
    update_from_wikidata(csv_writer, json_writer)
    csv_file.close()
    json_writer.close()

if __name__ == '__main__':
    update_index()
