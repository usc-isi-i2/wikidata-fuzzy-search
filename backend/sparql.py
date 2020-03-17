# This file encapsulates the SPARQL query handling
import settings
import requests
import json
import urllib.parse
from SPARQLWrapper import SPARQLWrapper, JSON

def query(query):
    """ Execute a SPARQL query synchronously """
    url = settings.WD_QUERY_ENDPOINT+query

    # Headers and extra query params were taken from the code of SPARQLQuery
    content_types = ["application/sparql-results+json", "application/json", "text/javascript", "application/javascript"]
    headers = {'Accept': ', '.join(content_types)}

    query_params = { 'query': query, 'format': 'json', 'output': 'json', 'result': 'json'}
    url = settings.WD_QUERY_ENDPOINT + '?' + urllib.parse.urlencode(query_params)

    response = requests.get(url, headers=headers)
    text = response.text
    parsed = json.loads(text)
    return parsed


sparql_endpoint = SPARQLWrapper(settings.WD_QUERY_ENDPOINT)
def query_with_wrapper(query):
    sparql_endpoint.setQuery(query)
    sparql_endpoint.setReturnFormat(JSON)
    run_query = sparql_endpoint.query()
    results = run_query.convert()

    return results
