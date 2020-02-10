import { Region } from "./types";
import config from "../config";

interface RegionDTO {
    label: string;
    value: string;
}

interface ResponseDTO {
    country?: string;
    admin1?: string;
    admin2?: string;
    admin3?: string;
    regions: RegionDTO[];
}

async function getRegions(url: string): Promise<Region[]> {
    const response = await fetch(url);
    if (!response.ok) {
        console.error(`Can't retrieve countries: ${response.statusText}`);
        throw new Error(response.statusText);
    }

    const dto = await response.json() as ResponseDTO;
    const regions = dto.regions.map(dto => { 
        return { qCode: dto.value, name: dto.label } as Region
    });

    return regions;
}

export async function getCountries(): Promise<Region[]> {
    const url =`${config.backendServer}/region`;
    const countries = await getRegions(url);

    return countries;
}


