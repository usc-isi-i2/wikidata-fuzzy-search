import React from 'react';
import wikiStore from "../../data/store";

import { observer } from 'mobx-react';
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";
import './scatterPlot.css';
import { ScatterGroupingParams, PointGroup } from '../../customizations/visualizations-params';
import { groupForScatter } from '../../customizations/grouper';
import { autorun } from 'mobx';
import { ColumnInfo } from '../../queries/time-series-result';
import { TimePoint } from '../../data/types';
import { cleanFieldName, formatTime } from '../../utils';


interface ScatterPlotProperties {
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
export default class ScatterPlot extends React.Component<ScatterPlotProperties, {}>{
    autoUpdateDisposer: () => void;

    resize = () => this.setState({})
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
    getTraceFromGroup = (grp: PointGroup) => {
        const x = grp.points.map(x => x.point_in_time);
        const y: Array<number> = grp.points.map(y => y.value);
        const text = this.getTooltipInfo(grp.points);
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
            type: 'scatter',
            mode: 'markers',
            marker
        };
    }

    formatCash = (n: number) => {
        if (n < 1e3) return n;
        if (n >= 1e3 && n < 1e6) return +(n / 1e3).toFixed(1) + "K";
        if (n >= 1e6 && n < 1e9) return +(n / 1e6).toFixed(1) + "M";
        if (n >= 1e9 && n < 1e12) return +(n / 1e9).toFixed(1) + "B";
        if (n >= 1e12) return +(n / 1e12).toFixed(1) + "T";
    };

    getTooltipInfo(points: TimePoint[]) {
        const uniqueKeys = Object.keys(points.reduce(function (result, obj) {
            return Object.assign(result, obj);
        }, {}))
        let textArray = []
        points.forEach(element => {
            let pointText = '';
            uniqueKeys.sort().forEach(key => {
                const finalKey = cleanFieldName(key)
                let value = element[key]
                if (key === 'value') {
                    value = this.formatCash(element[key])
                } else if (key === 'point_in_time') {
                    value = formatTime(value, wikiStore.timeSeries.result.timeSeriesInfo.statistics?.max_precision ?? 9)
                }
                pointText += `<b>${finalKey}</b>: ${value}<br>`;
            });
            textArray.push(pointText)
        });
        return textArray;
    }
    componentDidMount() {
        window.addEventListener('resize', this.resize)
        let firstTime = true;
        this.autoUpdateDisposer = autorun(() => {
            if (!firstTime) {
                this.resize();
            }
            firstTime = false;
        });
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.resize)
        this.autoUpdateDisposer(); //https://stackoverflow.com/a/43607070/10916298
    }
    render() {
        const result = wikiStore.timeSeries.result;
        const groups = groupForScatter(result, this.props.groupingParams);
        const Plot = createPlotlyComponent(Plotly);
        const traces = groups.map(grp => this.getTraceFromGroup(grp));
        //let update = wikiStore.ui.previewFullScreen;

        return (
            <div className='scatter'>
                <Plot
                    data={traces}
                    layout={{
                        title: wikiStore.timeSeries.name, showlegend: true,
                        legend: { "orientation": "h" },
                        hovermode: 'closest'
                    }}
                    config={{
                        'modeBarButtonsToRemove': ['lasso2d', 'select2d', 'hoverCompareCartesian']
                    }}
                />
            </div>
        );
    }
}