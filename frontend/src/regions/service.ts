import { Region, CacheEntry } from "./types";
import config from "../config";
import { RegionResponseDTO } from "../dtos";
import wikiStore from "../data/store";


//const cacheMap: Map<string, Region[]> = new Map<string, Region[]>(); // Map from URL to regions

async function fetchRegions(url: string): Promise<Region[]> {
    console.debug("fetch regions")
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
    console.debug("done fetch regions")
    return regions;
}

export async function getCountries(): Promise<Region[]> {
    /* const regions: Region[] = [];
    // regions.push({qCode: "Q30", name: "USA"} as Region)
    // regions.push({qCode: "Q1166", name: "mis"})
    const resultArray: RegionNode[] = [];
    const result: Region[] = await getRegions(regions);
    result.forEach(node => {
        if (!(node.qCode in wikiStore.ui.region.nodes)) {
            const parent = regions.length > 1 ? wikiStore.ui.region.nodes[regions.length - 1] : undefined;
            const regionNode = new RegionNode(node.qCode, node.name, parent)
            if (!(regionNode.qCode in wikiStore.ui.region.nodes)) {
                wikiStore.ui.region.nodes[node.qCode] = regionNode;
            }
            resultArray.push(regionNode);
        }
    })
    return result; */
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
    console.debug('waiting for response ', url);
    const response = await fetchRegions(url);
    console.debug('response: ', response);
    const cacheEntry = { response: response, date: now.toString() } as CacheEntry
    localStorage.setItem(`regions_${url}`, JSON.stringify(cacheEntry));
    console.debug('load from storagess: ');

    return response;
}

