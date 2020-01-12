import { WikidataTimeSeriesInfo, TimePoint, TimeSeriesResult, Region, ColumnInfo  } from "../data/types";
import config from '../config/config'

async function queryTimeSeries(query: string, dataset: WikidataTimeSeriesInfo, region:Region): Promise<TimeSeriesResult[]> {
    //const url = "https://query.wikidata.org/sparql?query="
    const url = config.sparqlQuery;
    const response = await fetch(url + query, {
        method: "get",
        mode: "cors",
        headers: new Headers({
            'Accept': 'application/json'
        }),
    });
    if (!response.ok) {
        throw Error(response.statusText);
    }
    const json = (await response.json());
    const results = getTimePointArray(json);
    
    const timeSeriesResultArray = new Array<TimeSeriesResult>();
    const timeSeriesResult = {time_points: results, region:region, info:dataset, index: 0} as TimeSeriesResult;
    fillColumnInfo(timeSeriesResult);
    timeSeriesResultArray.push(timeSeriesResult);
    return timeSeriesResultArray;
}

export function gatherHeaders(points: TimePoint[]): string[] {
    const headerSet = new Set<string>();
    const headers = [] as string[];

    function addHeader(header: string) {
        if (!headerSet.has(header)) {
            headerSet.add(header);
            headers.push(header);
        }
    }

    // First two mandatory headers
    addHeader('point_in_time');
    addHeader('value');

    for(const point of points) {
        for(const key in point) {
            addHeader(key);
        }
    }

    return headers;
}

function fillColumnInfo(tsr: TimeSeriesResult) {
    const headers = gatherHeaders(tsr.time_points);
    const columns = headers.map(header => new ColumnInfo(header, tsr.time_points));
    tsr.columns = columns;
}

export async function buildQuery(region: Region[], dataset: WikidataTimeSeriesInfo, embed = false) {
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

    let str1 = ' ?value ?countryLabel', str2 = '';
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
    str2 += '  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }\n'
    let countries = ''
    region.forEach(function(value){
        countries += '(wd:' +value.countryCode +') ' 
    });
    let query =
        'SELECT' + str1 + ' WHERE {\n'
        + 'VALUES (?variable ?p ?ps) {\n' 
        + '(wd:' +name +' p:' +name +' ps:'+name+')}\n'
        + 'VALUES (?country){ \n'
        + countries +' } \n'
        + '?country ?p ?o . \n'
        + '?o ?ps ?value . \n' 
        + '?o pq:P585 ?time . \n' 
        + '?variable skos:prefLabel ?variable_name. \n'
        + 'FILTER((LANG(?variable_name)) = "en") \n'
        + ''
        + str2
        + '}\n';
    if (time !== null) {
        query += 'ORDER BY ?country ' + timeLabel +'\n';
    }
    console.log(`sparql query ${query}`);
    let result = await queryTimeSeries(query, dataset, region[0]);
    return result;
}

function getTimePointArray(response: any): TimePoint[] {
    let headers: string[] = Object.values(response.head.vars);
    const timePoint = new Array<TimePoint>();
    const dataArray = response.results.bindings;
    for (let i = 0; i < dataArray.length; i++) {
        //let time = dataArray[i].point_in_time.value;
        //let value = Number(dataArray[i].value.value);
        //let timePointElem:TimePoint = {time: time, value:value};
        let timePointElem = {};
        for (let j = 0; j < headers.length; j++) {
            timePointElem[headers[j]] = dataArray[i][headers[j]]?.value;
        }
        timePoint.push(timePointElem as TimePoint);

    }
    return timePoint.sort();
}