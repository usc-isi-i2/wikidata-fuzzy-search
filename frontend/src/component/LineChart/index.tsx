import React from 'react';
import wikiStore from "../../data/store";

import { observer } from 'mobx-react';
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";
import './LineChart.css'
import { autorun } from 'mobx';
import { cleanFieldName } from '../../utils';
import { groupForScatter } from '../../customizations/grouper';
import { ScatterGroupingParams, PointGroup } from '../../customizations/visualizations-params';
import { ColumnInfo } from '../../queries/time-series-result';

interface LineChartProperties {
    groupingParams: ScatterGroupingParams,
}
interface RGB {
    r: number;
    g: number;
    b: number;
}
function applyOnRGBs(color1: RGB, color2: RGB,  func: (n1: number, n2: number) => number) : RGB {
    return {
        r: func(color1.r, color2.r),
        g: func(color1.g, color2.g),
        b: func(color1.b, color2.g),
    }
}
@observer
export default class LineChart extends React.Component<LineChartProperties, {}>{
    autoUpdateDisposer: () => void;


    resize = () => {
        this.setState({})
    } //https://stackoverflow.com/a/37952875/10916298

    // buildLineArray(pointsArray:Array<PointGroup>) {
    //     const finalArray = []
    //     pointsArray.forEach(obj => {
    //         finalArray.push(...obj.points);
    //     })
    //     const objMap = {};
    //     finalArray.forEach(function (obj) {
    //         const key = obj['point_in_time'];
    //         if (!(key in objMap)) {
    //             objMap[key] = { values: [] }
    //             Object.keys(obj).forEach(objKey => {
    //                 if (objKey !== 'value' && objKey !== 'point_in_time') {
    //                     objMap[key][objKey] = obj[objKey];
    //                 }
    //             })
    //         }
    //         objMap[key].values.push(obj['value']);
    //     });
    //     const x = Object.keys(objMap);
    //     const y = [];
    //     Object.keys(objMap).forEach(function (key) {
    //         const avg = objMap[key].values.reduce((p, c) => Number(p) + Number(c)) / objMap[key].values.length;
    //         y.push(avg);
    //     });
    //     const text = this.tooltopText(objMap);
    //     return [x, y, text]
    // }

    tooltopText(points) {
        const textArray = []
        Object.keys(points).forEach(function (key) {
            const tooltipObj = {}
            tooltipObj['time'] = key;
            Object.keys(points[key]).forEach(function (objKey) {
                // const finallKey = cleanFieldName(objKey);
                // if(finallKey == 'values'){
                //     tooltipObj[finallKey] = this.formatCash(element[key])
                // }
                debugger
                if (objKey !== 'values') {
                    const finalKey = cleanFieldName(objKey);
                    tooltipObj[finalKey] = points[key][objKey]
                }

            })
            let pointText:string ='';
            Object.keys(tooltipObj).sort().forEach(function (key) { 
                pointText += '<b>' + key + '</b>: ' + tooltipObj[key] + '<br>';
            });
            textArray.push(pointText)
        });
        return textArray;
    }
    hexToRgb = (hex: string): RGB | null => {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    minRgb = (color: RGB): RGB => {
        const minRgbObj = applyOnRGBs(color, color, (n: number, _: number) => Math.floor(255 - (255 - n) / 8));
        return minRgbObj;
    }

    getRelativeColor = (value: number, minRgb: RGB, maxRgb: RGB) => {
        const colorObj = applyOnRGBs(maxRgb, minRgb, (max: number, min: number) => Math.floor(value * (max - min) + min));
        const hexColor = this.rgbToHex(colorObj);
        return hexColor;
    }

    calcAvgColor = (minRgb: RGB, maxRgb: RGB) => {
        const colorObj = applyOnRGBs(maxRgb, minRgb, (max: number, min: number) => Math.floor(max - min));
        const hexColor = this.rgbToHex(colorObj);
        return hexColor;
    }

    componentToHex = (c: number) => {
        const hex: string = c.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }

    rgbToHex = (colorObj: RGB) => {
        return "#" + this.componentToHex(colorObj["r"]) + this.componentToHex(colorObj["g"]) + this.componentToHex(colorObj["b"]);
    }

    getColor = (color: string, numberArray: Array<number>, points: Array<{}>) => {

        console.debug(wikiStore.ui.scatterGroupingParams.colorLevel);
        const columnInfo: ColumnInfo | undefined = wikiStore.ui.scatterGroupingParams.colorLevel;
        if (columnInfo) {
            const maxRgbColor = this.hexToRgb(color);
            const minRgbColor = this.minRgb(maxRgbColor);
            let colorsArray = []
            numberArray.forEach(value => {
                const relativeValue = (value - columnInfo.min) / columnInfo.max;
                const keyInSeries = points.some(e => e.hasOwnProperty(columnInfo.name));
                const relativeColor = keyInSeries ? this.getRelativeColor(relativeValue, minRgbColor, maxRgbColor) : this.calcAvgColor(maxRgbColor, minRgbColor)
                colorsArray.push(relativeColor);
            });
            return colorsArray;
        }
        return color
    }

    formatCash = (n: number) => {
        if (n < 1e3) return n;
        if (n >= 1e3 && n < 1e6) return +(n / 1e3).toFixed(1) + "K";
        if (n >= 1e6 && n < 1e9) return +(n / 1e6).toFixed(1) + "M";
        if (n >= 1e9 && n < 1e12) return +(n / 1e9).toFixed(1) + "B";
        if (n >= 1e12) return +(n / 1e12).toFixed(1) + "T";
    };

    componentDidMount() {
        window.addEventListener('resize', this.resize)
        let firstTime = true;
        this.autoUpdateDisposer = autorun(() => { //https://stackoverflow.com/a/55103784/10916298
            console.debug(`previewFullScreen changed: ${wikiStore.ui.previewFullScreen}`);//https://stackoverflow.com/a/41087278/10916298

            if (!firstTime) {
                this.resize();
            }
            firstTime = false;
        });
    }

    getTraceFromGroup = (grp: PointGroup) => {
        const x = grp.points.map(x => x.point_in_time);
        const y: Array<number> = grp.points.map(y => y.value);
        const text = this.tooltopText(grp.points);
        const name = grp.desc;
        const color = this.getColor(grp.visualParams.color, y, grp.points)
        const marker = {
            color: color,
            symbol: grp.visualParams.markerSymbol,
            size: grp.visualParams.markerSize
        }
        return {
            x,
            y,
            hovertemplate: text,
            name,
            type: 'lines',
            mode: 'markers+lines',
            marker
        };
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.resize)
        this.autoUpdateDisposer(); //https://stackoverflow.com/a/43607070/10916298
    }
    render() {
        const result = wikiStore.timeSeries.result;
        //const params = wikiStore.ui.visualizationParams.getParams(result);
        const groups = groupForScatter(result, this.props.groupingParams);
        const traces = groups.map(grp => this.getTraceFromGroup(grp));
        const Plot = createPlotlyComponent(Plotly);
        return (
            <Plot
                data={traces}
                layout={{
                    title: wikiStore.timeSeries.name, showlegend: true,
                    legend: { "orientation": "h" }
                }}
            />
        );
    }
}