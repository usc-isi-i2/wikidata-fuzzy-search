import { ColumnInfo } from "../queries/time-series-result";

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
    countryLabel: string;
}
export class Region {
    constructor(public countryCode: string, public countryName: string) { }

    public get name(): string {
        return this.countryName;
    }
}
