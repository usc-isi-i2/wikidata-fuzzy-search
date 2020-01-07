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
    visualiztionParams: VisualizationParams;
}

class VisualizationParams {
    public color: string = 'purple';
    public marker: string = 'markers';
    public type: string = 'markers';
}

export class VisualizationManager {
    public visualiztionData: VisualizationParams[] = [];
    constructor() {
        this.loadFromLocalStorage();
    }

    private loadFromLocalStorage() {
        let localStorgateData = JSON.parse(localStorage.getItem('visualiztionData'));
        if (localStorgateData) {
            for (const item of localStorgateData) {
                let tmpVisualizationParams= new VisualizationParams();
                tmpVisualizationParams.color = item['color']
                tmpVisualizationParams.marker = item['marker']
                tmpVisualizationParams.type = item['type']
                this.visualiztionData.push(tmpVisualizationParams);
            }
        } else {
            for (let i = 0; i < 10; i++) {
                let tmpVisualizationParams = new VisualizationParams();
                this.visualiztionData.push(tmpVisualizationParams);
            }
        }
    }

    getVisualiztion(index:number){
        return this.visualiztionData[index];
    }

    setLocalStorage() {
        localStorage.setItem('visualiztionData', JSON.stringify(this.visualiztionData));
    }
}