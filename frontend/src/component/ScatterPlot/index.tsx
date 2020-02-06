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


interface ScatterPlotProperties {
    groupingParams: ScatterGroupingParams,
}

@observer
export default class ScatterPlot extends React.Component<ScatterPlotProperties, {}>{
    autoUpdateDisposer;

    resize = () => this.setState({})
    hexToRgb = (hex) => {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : null;
      }

      minRgb = (color) => {
        const minRgbObj = {}
        Object.keys(color).forEach(function(key) {
            minRgbObj[key] = Math.floor(255 -((255-color[key])/8));
        });
        return minRgbObj;
      }

      getRelativeColor = (value, minRgb, maxRgb) =>{
        const colorObj ={}
        Object.keys(minRgb).forEach(function(key) {
            colorObj[key] = Math.floor((value * (maxRgb[key] - minRgb[key])) + minRgb[key]);
        });
        const hexColor = this.rgbToHex(colorObj);
        return hexColor; 
      }      

      calcAvgColor = (minRgb, maxRgb) =>{
        const colorObj ={}
        Object.keys(minRgb).forEach(function(key) {
            colorObj[key] = Math.floor((maxRgb[key] - minRgb[key]) /2);
        });
        const hexColor = this.rgbToHex(colorObj);
        return hexColor; 
      }      

      componentToHex = (c) => {
        var hex = c.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      }
      
      rgbToHex = (colorObj) =>{
        return "#" + this.componentToHex(colorObj["r"]) + this.componentToHex(colorObj["g"]) + this.componentToHex(colorObj["b"]);
      }

      getColor = (color:string, numberArray: Array<number>, points: Array<{}>) => {
          
          console.debug(wikiStore.ui.scatterGroupingParams.colorLevel);
          const columnInfo: ColumnInfo | undefined = wikiStore.ui.scatterGroupingParams.colorLevel;
          if(columnInfo){
              const maxRgbColor = this.hexToRgb(color);
              const minRgbColor = this.minRgb(maxRgbColor);
              let colorsArray = []
              numberArray.forEach(value => {
                const relativeValue = (value - columnInfo.min)/columnInfo.max;
                const keyInSeries = points.some(e => e.hasOwnProperty(columnInfo.name));
                const relativeColor = keyInSeries? this.getRelativeColor(relativeValue, minRgbColor, maxRgbColor) : this.calcAvgColor(maxRgbColor, minRgbColor)
                colorsArray.push(relativeColor);
              });
              return colorsArray;
          }
          return color
      }
    getTraceFromGroup = (grp: PointGroup) => {
        const x = grp.points.map(x => x.point_in_time);
        const y:Array<number> = grp.points.map(y => y.value);
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

    formatCash = n => {
        if (n < 1e3) return n;
        if (n >= 1e3 && n < 1e6) return +(n / 1e3).toFixed(1) + "K";
        if (n >= 1e6 && n < 1e9) return +(n / 1e6).toFixed(1) + "M";
        if (n >= 1e9 && n < 1e12) return +(n / 1e9).toFixed(1) + "B";
        if (n >= 1e12) return +(n / 1e12).toFixed(1) + "T";
      };

    getTooltipInfo(points){
        const uniqueKeys = Object.keys(points.reduce(function(result, obj) {
            return Object.assign(result, obj);
          }, {}))
        let textArray = []
        points.forEach(element => {
            let pointText = '';
            uniqueKeys.sort().forEach(key => {
                const keyWithoutLabel = key.split('Label');
                const finalKey = keyWithoutLabel[0] == 'point_in_time'? 'time': keyWithoutLabel[0];
                if(key =='value'){
                    element[key] = this.formatCash(element[key])
                }
                pointText += '<b>' +finalKey +'</b>: ' +element[key] +'<br>'; 
            })
            textArray.push(pointText)
        });
        return textArray;
    }
    componentDidMount() {
        window.addEventListener('resize', this.resize)
        let firstTime = true;
        this.autoUpdateDisposer = autorun(() => {
            console.debug(`previewFullScreen changed: ${wikiStore.ui.previewFullScreen}`);
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
        console.debug('Scatter plot render color grouping: ', this.props.groupingParams.color?.name ?? 'undefined');

        const result = wikiStore.timeSeries.result;
        const groups = groupForScatter(result, this.props.groupingParams);
        console.debug(groups);
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