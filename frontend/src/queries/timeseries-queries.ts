import { WikidataTimeSeriesInfo, Region, TimePoint } from "../data/types";
import { TimeSeriesResult } from "./time-series-result";
import config from '../config/config'
import { TimeSeriesResultDTO } from "../dtos";


export async function queryTimeSeries(timeSeriesInfo: WikidataTimeSeriesInfo, regions: Region[]) {
    const url =
        config.backendServer +
        `/wikidata`;
    
    const data = {
        timeSeries: timeSeriesInfo,
        regions: regions,
    };

    const response = await fetch(url, {
        method: "post",
        mode: "cors",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw Error(response.statusText);
    }

    const json = await response.json() as TimeSeriesResultDTO;
    const tsr = new TimeSeriesResult(timeSeriesInfo, regions, json);

    // Report the queries run on the server
    if (json.queries) {
        console.log('SPARQL queries executed by the server:');
        for(const query of json.queries) {
            console.log(query);
            console.log("=======================================================");
        }
        console.log();
    }

    return tsr;
}