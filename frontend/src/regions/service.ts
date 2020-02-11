import { Region } from "./types";
import config from "../config";
import { RegionResponseDTO } from "../dtos";

const cacheMap: Map<string, Region[]> = new Map<string, Region[]>(); // Map from URL to regions

async function fetchRegions(url: string): Promise<Region[]> {
    const response = await fetch(url);
    if (!response.ok) {
        console.error(`Can't retrieve countries: ${response.statusText}`);
        throw new Error(response.statusText);
    }

    const dto = await response.json() as RegionResponseDTO;
    const regions = dto.regions.map(dto => { 
        return { qCode: dto.value, name: dto.label } as Region
    });

    return regions;
}

export async function getCountries(): Promise<Region[]> {
    return await getRegions([]);
}

export async function getRegions(path: Region[]): Promise<Region[]> {
    debugger
    let url =`${config.backendServer}/region`;
    if(path.length == 0 && !(url in cacheMap)){ //first time
        cacheMap[url] = fetchRegions(url)
    }
    // const countries = await fetchRegions(url);

    // return countries;
    // TODO: Build URL
    // TODO: check if URL is in map - if not, call fetch and put in map
    // TODO: Convert URL to list of regions
    path.forEach(regoin =>{
        url = url+'/'+regoin.qCode;
        if(!(url in cacheMap)){
        cacheMap[url] = fetchRegions(url);
        }
    })
    return cacheMap[url];

}

