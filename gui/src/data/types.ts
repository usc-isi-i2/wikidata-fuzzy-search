
export interface Statistics {
    min_time:string;
    max_time:string;
    count:number; 
    max_precision:number;
}

export interface WikidataTimeSeriesInfo {
    name: string;
    label: string;
    description: string;
    aliases: string[];
    time: string | null;
    qualifiers: { [key: string]: string};
    statistics: Statistics | undefined;
    score: number;
}

export interface TimePoint {
    point_in_time:string;
    value: number;
}

