import { WikidataTimeSeriesInfo, Region, TimePoint } from "../data/types";
import { TimeSeriesResult } from "./time-series-result";
import config from '../config/config'


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

    const json = await response.json();
    return json as TimeSeriesResult;
}