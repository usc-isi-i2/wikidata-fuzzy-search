import React from 'react';
import wikiStore from "../../data/store";

import { observer } from 'mobx-react';
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";
import './scatterPlot.css';
import { ScatterGroupingParams, PointGroup } from '../../customizations/visualizations-params';
import { groupForScatter } from '../../customizations/grouper';
import { autorun } from 'mobx';


interface ScatterPlotProperties {
    groupingParams: ScatterGroupingParams,
}

@observer
export default class ScatterPlot extends React.Component<ScatterPlotProperties, {}>{
    autoUpdateDisposer;

    resize = () => this.setState({})
    getTraceFromGroup = (grp: PointGroup) => {
        const x = grp.points.map(x => x.point_in_time);
        const y = grp.points.map(y => y.value);
        const text = this.getTooltipInfo(grp.points);
        const name = grp.desc;
        const marker = {
            color: grp.visualParams.color,
            symbol: grp.visualParams.markerSymbol,
            size: grp.visualParams.markerSize,
        }

        return {
            x,
            y,
            text,
            name,
            type: 'scatter',
            mode: 'markers',
            marker
        };
    }
    getTooltipInfo(points){
        const uniqueKeys = Object.keys(points.reduce(function(result, obj) {
            return Object.assign(result, obj);
          }, {}))
        let textArray = []
        points.forEach(element => {
            let pointText = '';
            uniqueKeys.forEach(key => {
                if(key!=='value'){
                pointText += '<b>' +key +'</b>: ' +element[key] +'<br>'; 
                }
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
                        legend: { "orientation": "h" }
                    }}
                />
            </div>
        );
    }
}