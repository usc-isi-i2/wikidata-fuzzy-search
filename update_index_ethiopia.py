import sys
import requests
import csv
import json
from SPARQLWrapper import SPARQLWrapper, JSON

WD_QUERY_ENDPOINT = 'http://dsbox02.isi.edu:8899/bigdata/namespace/wdq/sparql'

def update_from_wikidata(csv_writer, json_writer):
    sparql = SPARQLWrapper(WD_QUERY_ENDPOINT)

    # wikidata
    query = '''
select ?p_no_prefix ?pLabel ?pDescription ?pAltLabel where {
  ?class wdt:P279* wd:Q18616576 .
  ?p p:P31/ps:P31 ?class;
     wikibase:propertyType wikibase:Quantity.
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

    # ethiopia
    query = '''
select distinct ?p_no_prefix ?pLabel ?pDescription ?pAltLabel where {
  ?p p:P31 ?o;
     wikibase:propertyType wikibase:Quantity.
  ?o <http://www.isi.edu/etk/createdBy> <http://www.isi.edu/t2wml>.
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


if __name__ == '__main__':
    csv_file = open('data/wikidata.csv', 'w', newline='', encoding='utf-8')
    csv_writer = csv.writer(csv_file, delimiter=',')
    json_writer = open('data/wikidata.json', 'w')
    update_from_wikidata(csv_writer, json_writer)
    csv_file.close()
    json_writer.close()
