# pip install sparqlwrapper
# https://rdflib.github.io/sparqlwrapper/

from SPARQLWrapper import SPARQLWrapper, JSON
import os
import json

endpoint_url = "https://query.wikidata.org/sparql"

query = """
SELECT DISTINCT ?country_no_prefix ?countryLabel 
WHERE 
{
  ?country p:P31 ?country_reif.
  ?country_reif ps:P31 wd:Q6256.
  MINUS {
  ?country_reif pq:P582 ?end_time.
  FILTER (year(?end_time) < 2019) .}
  BIND(STR(REPLACE(STR(?country), STR(wd:), "")) AS ?country_no_prefix)
  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
}
ORDER BY ASC(?countryLabel)
"""


def get_results(endpoint_url, query):
    sparql = SPARQLWrapper(endpoint_url)
    sparql.setQuery(query)
    sparql.setReturnFormat(JSON)
    return sparql.query().convert()


results = get_results(endpoint_url, query)

country_options = []
for result in results["results"]["bindings"]:
    country_no_prefix = result["country_no_prefix"]["value"]
    country_label = result["countryLabel"]["value"]
    country_option = {"value": country_no_prefix, "label": country_label}
    country_options.append(country_option)

output_dir = os.path.split(os.path.realpath(__file__))[0]
output_path = os.path.join(output_dir, "countryOptions.json")
with open(output_path, "w") as output_file:
    print(json.dumps(country_options, indent=4), file=output_file)
