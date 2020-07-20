import { WikidataTimeSeriesInfo } from "../data/types";
import { TimeSeriesResult } from "./time-series-result";
import config from '../config'
import { TimeSeriesResultDTO } from "../dtos";
import { Region } from "../regions/types";
import wikiStore from "../data/store";

export async function queryTimeSeries(timeSeriesInfo: WikidataTimeSeriesInfo, regions: Region[]) {
    
    let url =
        config.backendServer +
        `/datasets/${timeSeriesInfo.datasetId}/variables/${timeSeriesInfo.variableId}?` +
        `include=country_id&include=admin1&include=admin1_id&include=admin2_id&include=admin3_id&include=admin2&include=admin3`;
    
    regions.forEach(function(region){
        url += `&${region.level}_id=${region.qCode}`;
    })
    // for each region
    // url += `${region.regionLevel}_id=${region.qCode}
    //if(regions.length > 0){
    //for(let i = 0; i < regions.length; i++){
        //url += `&${regions[i].level}_id=${regions[i].qCode}`;
        //}
    //}
    
    //const regionDTOs = regions.map(region => {
        //return {countryCode: region.qCode};
    //});

    //const data = {
        //timeSeries: timeSeriesInfo,
        //regions: regionDTOs,
    //};

    const response = await fetch(url);
    if (!response.ok) {
        throw Error(response.statusText);
    }

    const csvStr = await response.text(); //as TimeSeriesResultDTO;

    const csv = require('csvtojson')

    csv({
        noheader:true,
        output: "csv"
    })
    .fromString(csvStr)
    .then((csvRow)=>{ 
        console.log(csvRow) // => [["1","2","3"], ["4","5","6"], ["7","8","9"]]
    })

    //console.log(json);
    //const tsr = new TimeSeriesResult(timeSeriesInfo, regions, json);

    // Report the queries run on the server
    //if (json.queries) {
        //console.log('SPARQL queries executed by the server:');
        //for(const query of json.queries) {
            //wikiStore.ui.addQuery(query);
            //console.log(query);
            //console.log("=======================================================");
        //}
        //console.log();
    //}
    
    //const tsr = new TimeSeriesResult(timeSeriesInfo, regions, json); 
    //return tsr;
}