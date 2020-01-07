import { Interface } from "readline";

export interface Statistics {
    min_time: string;
    max_time: string;
    count: number;
    max_precision: number;
}

export interface WikidataTimeSeriesInfo {
    name: string;
    label: string;
    description: string;
    aliases: string[];
    time: string | null;
    qualifiers: { [key: string]: string };
    statistics: Statistics | undefined;
    score: number;
}

export interface TimePoint {
    point_in_time: string;
    value: number;
}

export interface Region {
    countryCode: string;
    countryName: string;
}

//need to add visualiztion params
export interface TimeSeriesResult {
    region: Region | undefined;
    time_points: TimePoint[];
    wdtdi: WikidataTimeSeriesInfo | undefined;
    visualiztionParamsScatter: VisualizationParamsScatter[];
}

class VisualizationParamsScatter {
    public color: string = 'purple';
    public mode: string = 'markers';
    public type: string = 'scatter';
}