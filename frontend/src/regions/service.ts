import { Region, RegionNode, CacheEntry } from "./types";
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

    const dto = await response.json() as RegionResponseDTO;
    const regions = dto.regions.map(dto => {
        return { qCode: dto.value, name: dto.label } as Region
    });

    return regions;
}

export async function getCountries(): Promise<Region[]> {
    const regions: Region[] = [];
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
    wikiStore.ui.allCountries = resultArray;

    return result;
}

export async function getRegions(path: Region[]): Promise<Region[]> {
    let url = `${config.backendServer}/region`;

    path.forEach(elem => {
        url = url + '/' + elem.qCode;
    })
    const cacheData = JSON.parse(localStorage.getItem('regions')) as CacheEntry || {};
    // || Math.abs(new Date() - cacheData[url].date)
    if (!(url in cacheData)) {
        const response = await fetchRegions(url).then(result => {
            return result
        });
        const cacheEntry = { response: response, date: new Date() } as CacheEntry
        cacheData[url] = cacheEntry;
        localStorage.setItem("regions", JSON.stringify(cacheData));
    }
    return cacheData[url].response;
}

