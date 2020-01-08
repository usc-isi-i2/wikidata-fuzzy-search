import { TimeSeriesResult } from "./types";
import { action } from "mobx";

export class VisualizationParams {
    public color: string;
    public marker: string;
    public lineType: string;

    public constructor(obj: any) {
        this.color = obj.color;
        this.marker = obj.marker;
        this.lineType = obj.lineType;
    }
    public clone() {
        return new VisualizationParams({ color: this.color, marker: this.marker, lineType: this.lineType });
    }
}

export class VisualizationManager {
    private parameters: VisualizationParams[] = [];

    constructor() {
        this.loadFromLocalStorage();
    }

    private loadFromLocalStorage() {
        let savedData: any[] = JSON.parse(localStorage.getItem('visualization-parameters'));
        if (!savedData) {  // 7 default styles
            savedData = [
                {color: 'blue', marker: 'circle', lineType: 'solid'},
                {color: 'green', marker: 'asterisk', lineType: 'solid'},
                {color: 'purple', marker: 'hexagon', lineType: 'dot'},
                {color: 'yellow', marker: 'circle', lineType: 'dash'},
                {color: 'orange', marker: 'triangle-up', lineType: 'dashdot'},
                {color: 'black', marker: 'square', lineType: 'solid'},
                {color: 'grey', marker: 'pentagon', lineType: 'dot'},
            ]
        }
        for(const param of savedData) {
            this.parameters.push(new VisualizationParams(param));
        }
    }

    public getParams(result: TimeSeriesResult) {
        const params = this.parameters[result.index];
        return params;
    }

    @action public updateParams(result: TimeSeriesResult, params: VisualizationParams) {
        this.parameters[result.index] = params;
        this.saveLocalStorage();
    }

    private saveLocalStorage() {
        localStorage.setItem('visualization-parameters', JSON.stringify(this.parameters));
    }
}