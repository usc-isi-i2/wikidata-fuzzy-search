# This file encapsulates the SPARQL query handling
import settings
import requests
import json
import urllib.parse
from SPARQLWrapper import SPARQLWrapper, JSON
import asyncio
import aiohttp

# Headers and extra query params were taken from the code of SPARQLQuery
def _get_request_headers():
    content_types = ["application/sparql-results+json", "application/json", "text/javascript", "application/javascript"]
    headers = {'Accept': ', '.join(content_types)}

    return headers

def _get_request_url(query):
    url = settings.WD_QUERY_ENDPOINT+query

    query_params = { 'query': query, 'format': 'json', 'output': 'json', 'result': 'json'}
    url = settings.WD_QUERY_ENDPOINT + '?' + urllib.parse.urlencode(query_params)

    return url

def query(query):
    """ Execute a SPARQL query synchronously """

    headers = _get_request_headers()
    url = _get_request_url(query)

    response = requests.get(url, headers=headers)
    text = response.text
    parsed = json.loads(text)
    return parsed


sparql_endpoint = SPARQLWrapper(settings.WD_QUERY_ENDPOINT)
def query_with_wrapper(query):
    # This is the old implementation using SPARQLWrapper.
    sparql_endpoint.setQuery(query)
    sparql_endpoint.setReturnFormat(JSON)
    run_query = sparql_endpoint.query()
    results = run_query.convert()

    return results


async def async_query(query):
    """ Asynchronously perform a SPARQL query """
    headers = _get_request_headers()
    url = _get_request_url(query)

    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as response:
            text = await response.content.read()
    
    parsed = json.loads(text)
    return parsed

