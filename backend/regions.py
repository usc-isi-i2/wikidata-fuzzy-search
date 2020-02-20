from flask_restful import Resource
import settings
from SPARQLWrapper import SPARQLWrapper, JSON

sparql = SPARQLWrapper(settings.WD_QUERY_ENDPOINT)

class ApiRegion(Resource):
    def get(self, country=None, admin1=None, admin2=None):
        if country is None:
            return self.get_countries()
        elif admin1 is None:
            return self.get_admin1(country)
        elif admin2 is None:
            return self.get_admin2(country, admin1)
        else:
            return self.get_admin3(country, admin1, admin2)

    def get_countries(self):
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
        return self.collect_results(query, 'country_no_prefix', 'countryLabel')

    def get_admin_query(self, admin_level, outer_region):
        level_code = {
            1: 'Q10864048',
            2: 'Q13220204',
            3: 'Q13221722'
        }[admin_level]
        query = f"""
SELECT DISTINCT ?admin ?admin_no_prefix ?adminLabel WHERE {{
  ?admin wdt:P131 wd:{outer_region}.
  ?admin wdt:P31/wdt:P279* wd:{level_code} . # first-level administrative country subdivision
  BIND(STR(REPLACE(STR(?admin), STR(wd:), "")) AS ?admin_no_prefix)
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }}
}}
ORDER BY ?admin_no_prefix"""
        return query

    def get_admin1(self, country):
        query = self.get_admin_query(1, country)
        results = self.collect_results(query, 'admin_no_prefix', 'adminLabel')
        results['country'] = country
        return results


    def get_admin2(self, country, admin1):
        query = self.get_admin_query(2, admin1)
        results = self.collect_results(query, 'admin_no_prefix', 'adminLabel')
        results['country'] = country
        results['admin1'] = admin1
        return results

    def get_admin3(self, country, admin1, admin2):
        query = self.get_admin_query(3, admin2)
        results = self.collect_results(query, 'admin_no_prefix', 'adminLabel')
        results['country'] = country
        results['admin1'] = admin1
        results['admin2'] = admin2
        return results

    def collect_results(self, query, value_field, label_field):
        sparql.setQuery(query)
        sparql.setReturnFormat(JSON)
        response = sparql.query().convert()
        regions = []
        for region_json in response['results']['bindings']:
            region = dict(label=region_json[label_field]['value'],
                          value=region_json[value_field]['value'])
            regions.append(region)
        regions.sort(key= lambda x: x['label'])
        return dict(regions=regions, query=query)
