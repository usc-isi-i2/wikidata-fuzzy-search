import { action, observable } from "mobx";
import { TimeSeriesResult, ColumnInfo } from "../queries/time-series-result";
import { TimePoint } from "../data/types";

export class VisualizationParams {
    public color: string;
    public marker: string;
    public markerSize: number;
    public lineType: string;

    public constructor(obj: any) {
        this.color = obj.color;
        this.marker = obj.marker;
        this.markerSize = obj.markerSize ?? 4;
        this.lineType = obj.lineType;
    }
    public clone() {
        return new VisualizationParams({ color: this.color, marker: this.marker, lineType: this.lineType });
    }
}


export interface ScatterVisualizationParams {
    color: string;
    markerSymbol: string;
    markerSize: number;
}

export type ScatterGroupingParamKeys = 'color' | 'markerSymbol' | 'markerSize';

export class ScatterGroupingParams {
    @observable public color?: ColumnInfo;
    @observable public markerSymbol?: ColumnInfo;
    @observable public markerSize?: ColumnInfo;
    @observable public colorLevel? : ColumnInfo;

    constructor(color?: ColumnInfo, markerSymbol?: ColumnInfo, markerSize?: ColumnInfo, colorLevel?: ColumnInfo) {
        this.color = color;
        this.markerSymbol = markerSymbol;
        this.markerSize = markerSize;
        this.colorLevel = colorLevel;
    }
}

export class ScatterGroupingCache {
    private cacheDict: { [key: string]: ScatterVisualizationParamAssignment };
    constructor(){
        this.cacheDict = {}
    }
    public getCountryData(countryName:string){
        return this.cacheDict[countryName];
    }

    public setCountryData(countryName:string, data){
        this.cacheDict[countryName] = data;
    }

    public clearCache(){
        this.cacheDict = {};
    }
}
export type ScatterVisualizationParamAssignment = { [key:string]: string | number };
export type Assignment = { [key:string]: string };

export class PointGroup {
    public readonly assignment: Assignment;
    public readonly visualParams: ScatterVisualizationParams;
    public readonly points: TimePoint[];

    public constructor(assignment: Assignment, visualParams: ScatterVisualizationParams) {
        this.assignment = assignment;
        this.visualParams = visualParams;
        this.points = [];
    }

    public get desc() {
        return Object.entries(this.assignment)
            .map(([key, value]) => value ? value : `No ${key}`)
            .join(', ');
    }
}