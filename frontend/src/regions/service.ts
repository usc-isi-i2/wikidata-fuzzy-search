import { Region, CacheEntry } from "./types";
import config from "../config";
import { RegionResponseDTO, RegionListResponseDTO } from "../dtos";
import wikiStore from "../data/store";


//const cacheMap: Map<string, Region[]> = new Map<string, Region[]>(); // Map from URL to regions

async function fetchRegions(url: string): Promise<Region[]> {
    const response = await fetch(url);
    if (!response.ok) {
        console.error(`Can't retrieve countries: ${response.statusText}`);
        throw new Error(response.statusText);
    }
    const result = await response.json();
    wikiStore.ui.addQuery(result.query);
    const dto = result as RegionListResponseDTO;
    const regions = dto.map(r => {
        return {qCode: r.admin_id, name: r.admin} as Region  // TODO: Change this to take the fields from the new DTO 
    });
    return regions;
}

export async function getCountries(): Promise<Region[]> {
    return getRegions([]);
}

export async function getRegions(path: Region[]): Promise<Region[]> {
    let url = `${config.backendServer}/metadata/regions`;

    // path has:
    // [] if looking for countries localhost:14080/metadata/regions
    // [country] if looking for admin1s  localhost:14080/metadata/regions?country_id=<...>
    // [country, admin1] if looking for admin2s localhost:14080/metadata/regions?admin1_id=<...>
    // [country, admin1, admin2] if looking for admin 3  localhost:14080/metdata/regions?admin2_id=<...>
    // [country, admin1, admin2, admin3] - we shouldn't return anything for it  No URL, return  {}
    if (path.length == 0){
        url = url
    }
    else if(path.length == 1){
        url = url + '?country_id=' + path[0].qCode;

    }
    else if(path.length == 2){
        url = url + '?admin1_id=' + path[1].qCode;
    }
    else if(path.length == 3){
        url = url + '?admin2_id=' + path[2].qCode;
    }
    else{
        return []
    }

    // TODO: Build URL based on new API
    //path.forEach(elem => {
    //        url = url + '?' + elem.qCode;
    //})
    const now = new Date();
    //const cachedString = localStorage.getItem(`regions_${url}`);
    //if (cachedString) {
        //const cachedData = JSON.parse(cachedString) as CacheEntry;
        //if (now.getTime() - new Date(cachedData.date).getTime() <= 86400000) { // Number of milliseconds in a day
            //return cachedData.response;
        //}
    //}
    const response = await fetchRegions(url);
    const cacheEntry = { response: response, date: now.toString() } as CacheEntry
    localStorage.setItem(`regions_${url}`, JSON.stringify(cacheEntry));

    return response;
}

