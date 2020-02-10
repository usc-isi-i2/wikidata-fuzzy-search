import { TimePointDTO } from "../dtos";

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
    statistics: Statistics | undefined;
    score: number;
}

export interface TimePoint extends TimePointDTO {
}

export interface SelectOption {  /* This is for React-Select */
    label: string,
    value: string,
}

