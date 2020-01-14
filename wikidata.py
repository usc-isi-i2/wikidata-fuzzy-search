from flask_restful import Resource
from flask import request
import json

class WikidataTimeSeriesInfo():
    def __init__(self, name, time, qualifiers, regions):
        self.name = name
        self.time = time
        self.qualifiers = qualifiers
        self.regions = regions

class ApiWikidata(Resource):
    def post(self):
        time_series_query_data = json.loads(request.form['time_series_query'])
        time_series = time_series_query_data['timeSeriesInfo']
        regions = time_series_query_data['regions']
        query_data = WikidataTimeSeriesInfo(time_series['name'], time_series['time'], time_series['qualifiers'], regions)
        print(query_data.regions, query_data.name, query_data.qualifiers)
        query = self.build_query(query_data)
        print(query)

        col_list = script.process(query)
        #need to build the response as ColumnInfo!
        return col_list

    def build_query(self, query_data):
        str1 = ' ?value ?countryLabel'
        str2 = ''
        qualifierNames = []
        for qualifier in query_data.qualifiers:
            qualifierNames.append(qualifier.keys())
        
        for qualifierName in qualifierNames:
            qualifierLabel = '?' + qualifiers[qualifierName].replace('/ /g', '_')
            if time != null and qualifierName == time:
                str1 = ' ' + qualifierLabel + str1
                timeLabel = qualifierLabel
            else:
                str1 += ' ' + qualifierLabel + 'Label'; # showing label instead of hyperlink
            str2 += '  OPTIONAL { ?o pq:' + qualifierName + ' ' + qualifierLabel + ' . }\n'
        
        str2 += '  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }\n'
        countries = ''
        for region in query_data.regions:
            countries += '(wd:' + region.countryCode + ') '
        
        query = """'SELECT {str1} WHERE {\n'
                VALUES (?variable ?p ?ps) {\n
                (wd: {name} p: {name} ps: {name})}\n
                VALUES (?country){ \n
                {countries}} \n
                ?country ?p ?o . \n
                ?o ?ps ?value . \n
                ?o pq:P585 ?time . \n
                ?variable skos:prefLabel ?variable_name. \n
                FILTER((LANG(?variable_name)) = "en") \n
            + ''
            + {str2}
            + '}\n'""".format(str1=str1, name=name, countries= countries, str2=str2)

        if time != null: 
            query += 'ORDER BY ?country ' + timeLabel + '\n'
        return query

      
        
