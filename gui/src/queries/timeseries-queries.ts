import { WikidataTimeSeriesInfo, Region, TimePoint } from "../data/types";
import { TimeSeriesResult } from "./time-series-result";
import config from '../config/config.json'

class TimeSeriesQuery {
    public readonly timeSeriesInfo: WikidataTimeSeriesInfo;
    public readonly regions: Region[];

    constructor(timeSeriesInfo: WikidataTimeSeriesInfo, regions: Region[]) {
        this.timeSeriesInfo = timeSeriesInfo;
        this.regions = regions;
    }

    public async query() {
        const queryString = this.buildQuery();
        const result = await this.executeQuery(queryString);
        const timePoints = this.convertToPointArray(result);

        return new TimeSeriesResult(this.timeSeriesInfo, this.regions, timePoints);
    }

    private buildQuery() {
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
        const { name, time, qualifiers } = this.timeSeriesInfo;
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
        this.regions.forEach(function (value) {
            countries += '(wd:' + value.countryCode + ') '
        });
        let query =
            'SELECT' + str1 + ' WHERE {\n'
            + 'VALUES (?variable ?p ?ps) {\n'
            + '(wd:' + name + ' p:' + name + ' ps:' + name + ')}\n'
            + 'VALUES (?country){ \n'
            + countries + ' } \n'
            + '?country ?p ?o . \n'
            + '?o ?ps ?value . \n'
            + '?o pq:P585 ?time . \n'
            + '?variable skos:prefLabel ?variable_name. \n'
            + 'FILTER((LANG(?variable_name)) = "en") \n'
            + ''
            + str2
            + '}\n';
        if (time !== null) {
            query += 'ORDER BY ?country ' + timeLabel + '\n';
        }
        return query;
    }

    private async executeQuery(query: string): Promise<any> {
        console.log(query);
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

        return json;
    }

    private convertToPointArray(response: any): TimePoint[] {
        let headers: string[] = Object.values(response.head.vars);
        const timePoints = new Array<TimePoint>();
        const dataArray = response.results.bindings;
        for (let i = 0; i < dataArray.length; i++) {
            //let time = dataArray[i].point_in_time.value;
            //let value = Number(dataArray[i].value.value);
            //let timePointElem:TimePoint = {time: time, value:value};
            let timePoint = {};
            for (let j = 0; j < headers.length; j++) {
                timePoint[headers[j]] = dataArray[i][headers[j]]?.value;
            }
            timePoints.push(timePoint as TimePoint);
    
        }
        return timePoints.sort();
    }
}

export async function queryTimeSeries(timeSeriesInfo: WikidataTimeSeriesInfo, regions: Region[]) {
    const query = new TimeSeriesQuery(timeSeriesInfo, regions);
    return await query.query();
}