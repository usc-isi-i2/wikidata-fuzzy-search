from flask_restful import Resource
from flask import request
import json
from SPARQLWrapper import SPARQLWrapper, JSON
import settings
sparql_endpoint = SPARQLWrapper(settings.WD_QUERY_ENDPOINT)

class WikidataQueryProcessor:
    def __init__(self, time_series_info, regions):
        self.time_series_info = time_series_info
        self.pnode = self.time_series_info['name']
        self.time = self.time_series_info['time']
        self.regions = regions
        self.qualifiers = {}
        self.queries = []

    def fetch_qualifiers(self):
        # TODO: Add some sort of caching mechanism for this
        query = '''
    SELECT DISTINCT ?qualifier_no_prefix ?qualifier_entityLabel WHERE {
    wd:'''+ self.regions[0]['countryCode'] +''' p:''' + self.pnode + ''' ?o .
    ?o ?qualifier ?qualifier_value .
    FILTER (STRSTARTS(STR(?qualifier), STR(pq:))) .
    FILTER (!STRSTARTS(STR(?qualifier), STR(pqv:))) .
    BIND (IRI(REPLACE(STR(?qualifier), STR(pq:), STR(wd:))) AS ?qualifier_entity) .
    BIND (STR(REPLACE(STR(?qualifier), STR(pq:), "")) AS ?qualifier_no_prefix) .
    SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en" }
    }'''
        self.queries.append(query)
        sparql_endpoint.setQuery(query)
        sparql_endpoint.setReturnFormat(JSON)
        results = sparql_endpoint.query().convert()

        qualifiers = {}
        for result in results["results"]["bindings"]:
            qualifiers[result['qualifier_no_prefix']['value']] = result['qualifier_entityLabel']['value']
        self.qualifiers = qualifiers

    def build_query(self):
        fields = ' ?value ?countryLabel'
        qualifiers = ''

        for qualifierName in self.qualifiers.keys():
            qualifierLabel = '?' + self.qualifiers[qualifierName].replace(' ', '_')
            if self.time and qualifierName == self.time:
                fields = ' ' + qualifierLabel + fields
                timeLabel = qualifierLabel
            else:
                fields += ' ' + qualifierLabel + 'Label' # showing label instead of hyperlink
            qualifiers += '  OPTIONAL { ?o pq:' + qualifierName + ' ' + qualifierLabel + ' . }'
        
        qualifiers += '  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }'
        countries = ''
        for region in self.regions:
            countries += '(wd:' + region['countryCode'] + ') '
        
        query = f"""
                SELECT {fields} WHERE {{
                    VALUES (?variable ?p ?ps) {{
                        (wd:{self.pnode} p:{self.pnode} ps:{self.pnode})
                    }}
                    VALUES (?country) {{
                        {countries} 
                    }}
                    ?country ?p ?o . 
                    ?o ?ps ?value . 
                    ?o pq:P585 ?time . 
                    ?variable skos:prefLabel ?variable_name. 
                    FILTER((LANG(?variable_name)) = "en") 
                    {qualifiers}
                }}
                ORDER BY ?countery { timeLabel if self.time else "" }
        """

        return query

    def execute_query(self):
        query = self.build_query()
        self.queries.append(query)
        sparql_endpoint.setQuery(query)
        sparql_endpoint.setReturnFormat(JSON)
        results = sparql_endpoint.query().convert()

        return results

    def format_result(self, query_results):
        # Returns the result in the format the backend expects
        # The format is documented in the frontend/dtos.ts file as TimeSeriesResultDTO

        column_dict = {}
        columns = []
        for colname in query_results['head']['vars']:
            column = dict(name = colname, numeric =True) 
            columns.append(column)
            column_dict[colname] = column

        points = []
        for server_point in query_results['results']['bindings']:
            point = {}
            for key in server_point.keys():
                val = server_point[key]['value']
                try:
                    float(val)
                except ValueError:
                    column_dict[key]['numeric'] = False

                point[key] = val
            points.append(point)

        return dict(columns=columns, points=points, queries=self.queries)


class ApiWikidata(Resource):
    def post(self):
        query_data = request.get_json()
        time_series_info = query_data['timeSeries']
        regions = query_data['regions']
        processor = WikidataQueryProcessor(time_series_info, regions)
        
        processor.fetch_qualifiers()
        query_result = processor.execute_query()
        formatted_result = processor.format_result(query_result)

        return formatted_result
        
