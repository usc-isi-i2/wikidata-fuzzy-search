import config from './config/config'

export function query2link(query, embed = false) {
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

export function scatterChart(country, dataset, embed = true) {
  /**
   * #defaultView:ScatterChart
   * SELECT ?time ?value WHERE {
   *   wd:Q30 p:P1082 ?o .
   *   ?o ps:P1082 ?value .
   *   ?o pq:P585 ?time.
   * }
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
    + 'SELECT ?time ?value WHERE {\n'
    + '  wd:' + country + ' p:' + name + ' ?o .\n'
    + '  ?o ps:' + name + ' ?value .\n'
    + '  ?o pq:P585 ?time.\n'
    + '}\n';
  return query2link(query, embed);
}

export function table(country, dataset, embed = true) {
  /**
   * SELECT ?point_in_time ?value ?determination_method ?female_population ?male_population WHERE {
   *   wd:Q30 p:P1082 ?o .
   *   ?o ps:P1082 ?value .
   *   optional { ?o pq:P585 ?point_in_time . }
   *   optional { ?o pq:P459 ?determination_method . }
   *   optional { ?o pq:P1539 ?female_population . }
   *   optional { ?o pq:P1540 ?male_population . }
   * }
   * ORDER BY ASC(?point_in_time)
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
    const qualifierName = qualifierNames[i];
    const qualifierLabel = '?' + qualifiers[qualifierName].replace(/ /g, '_');
    if (time !== null && qualifierName === time) {
      str1 = ' ' + qualifierLabel + str1;
      timeLabel = qualifierLabel;
    } else {
      str1 += ' ' + qualifierLabel;
    }
    str2 += '  optional { ?o pq:' + qualifierName + ' ' + qualifierLabel + ' . }\n';
  }

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