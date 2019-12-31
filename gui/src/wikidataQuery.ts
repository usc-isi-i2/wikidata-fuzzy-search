import config from './config/config.json'
import { WikidataTimeSeriesInfo } from './data/types.js';

export function query2link(query: string, embed = false) {
  /**
   * Convert query to link.
   * 
   * @param {string}  query
   * @param {bool}    embed Whether embed or not.
   * 
   * @return {string} Output link.
   */
  let link = config.queryServer + '/';
  if (embed) link += 'embed.html';
  link += '#' + encodeURI(query);
  return link;
}

export function scatterChart(country: string, dataset: WikidataTimeSeriesInfo, embed = true) {
  /**
   * #defaultView:ScatterChart
   * SELECT ?time (AVG(?value_) AS ?value) WHERE {
   *   wd:Q30 p:P1082 ?o .
   *   ?o ps:P1082 ?value_ .
   *   ?o pq:P585 ?time.
   * }
   * GROUP BY ?time
   * 
   * @param {string}  country QNode of country, e.g. Q30 for United States of America.
   * @param {dict}    dataset
   * @param {bool}    embed Whether embed or not.
   * 
   * @return {string} Output link.
   */
  const { name } = dataset;

  let query =
    '#defaultView:ScatterChart\n'
    + 'SELECT ?time (AVG(?value_) AS ?value) WHERE {\n'
    + '  wd:' + country + ' p:' + name + ' ?o .\n'
    + '  ?o ps:' + name + ' ?value_ .\n'
    + '  ?o pq:P585 ?time.\n'
    + '}\n'
    + 'GROUP BY ?time\n';
  return query2link(query, embed);
}

export function table(country: string, dataset: WikidataTimeSeriesInfo, embed = true) {
  /**
   * SELECT ?time ?value ?determination_methodLabel ?female_populationLabel ?male_populationLabel WHERE {
   *   wd:Q30 p:P1082 ?o .
   *   ?o ps:P1082 ?value .
   *   OPTIONAL { ?o pq:P585 ?point_in_time . }
   *   OPTIONAL { ?o pq:P459 ?determination_method . }
   *   OPTIONAL { ?o pq:P1539 ?female_population . }
   *   OPTIONAL { ?o pq:P1540 ?male_population . }
   *   SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
   * }
   * ORDER BY ASC(?time)
   * 
   * @param {string}  country QNode of country, e.g. Q30 for United States of America.
   * @param {dict}    dataset
   * @param {bool}    embed Whether embed or not.
   * 
   * @return {string} Output link.
   */
  const { name, time, qualifiers } = dataset;
  let timeLabel = '';

  let str1 = ' ?value', str2 = '';
  const qualifierNames = Object.keys(qualifiers);
  for (let i = 0; i < qualifierNames.length; i++) {
    const qualifierName = qualifierNames[i];                                   // 'P585'
    const qualifierLabel = '?' + qualifiers[qualifierName].replace(/ /g, '_'); // '?point_in_time'
    if (time !== null && qualifierName === time) {
      str1 = ' ' + qualifierLabel + str1;
      timeLabel = qualifierLabel;
    } else {
      str1 += ' ' + qualifierLabel + 'Label'; // showing label instead of hyperlink
    }
    str2 += '  OPTIONAL { ?o pq:' + qualifierName + ' ' + qualifierLabel + ' . }\n';
  }
  str2 += '  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }\n'

  let query =
    'SELECT' + str1 + ' WHERE {\n'
    + '  wd:' + country + ' p:' + name + ' ?o .\n'
    + '  ?o ps:' + name + ' ?value .\n'
    + str2
    + '}\n';
  if (time !== null) {
    query += 'ORDER BY ASC(' + timeLabel + ')\n';
  }
  return query2link(query, embed);
}