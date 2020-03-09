import { Region, CacheEntry } from "./types";
import config from "../config";
import { RegionResponseDTO } from "../dtos";
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
    const dto = result as RegionResponseDTO;
    const regions = dto.regions.map(dto => {
        return { qCode: dto.value, name: dto.label } as Region
    });
    return regions;
}

export async function getCountries(): Promise<Region[]> {
    return getRegions([]);
}

export async function getRegions(path: Region[]): Promise<Region[]> {
    let url = `${config.backendServer}/region`;
    
    path.forEach(elem => {
        url = url + '/' + elem.qCode;
    })
    const now = new Date();
    const cachedString = localStorage.getItem(`regions_${url}`);
    if (cachedString) {
        const cachedData = JSON.parse(cachedString) as CacheEntry;
        if (now.getTime() - new Date(cachedData.date).getTime() <= 86400000) { // Number of milliseconds in a day
            return cachedData.response;
        }
    }
    const response = await fetchRegions(url);
    const cacheEntry = { response: response, date: now.toString() } as CacheEntry
    localStorage.setItem(`regions_${url}`, JSON.stringify(cacheEntry));

    return response;
}

