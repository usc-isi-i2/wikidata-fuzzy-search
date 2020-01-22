import React from 'react';
import wikiStore from "../../data/store";

import { observer } from 'mobx-react';
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";
import './scatterPlot.css';
import { ScatterGroupingParams, PointGroup } from '../../customizations/visualizations-params';
import { groupForScatter } from '../../customizations/grouper';

interface ScatterPlotProperties {
    groupingParams: ScatterGroupingParams,
}

@observer
export default class ScatterPlot extends React.Component<ScatterPlotProperties, {}>{

    getTraceFromGroup = (grp: PointGroup) => {
        const x = grp.points.map(x => x.point_in_time);
        const y = grp.points.map(y => y.value);
        const name = grp.desc;
        const marker = {
            color: grp.visualParams.color,
            symbol: grp.visualParams.markerSymbol,
            size: grp.visualParams.markerSize,
        }

        return { 
            x,
            y,
            name,
            type: 'scatter',
            mode: 'markers',
            marker,
            showlegend: true,
        };
    }

    render() {
        console.debug('Scatter plot render color grouping: ', this.props.groupingParams.color?.name ?? 'undefined');

        const result = wikiStore.timeSeries.result;
        const groups = groupForScatter(result, this.props.groupingParams);
        console.debug(groups);
        const Plot = createPlotlyComponent(Plotly);
        const traces = groups.map(grp => this.getTraceFromGroup(grp));
          
        return (
            <div className='scatter'>
                <Plot
                    data={ traces }
                    layout={{ width: '100%', height: '100%', title: wikiStore.timeSeries.name, showlegend: true }}
                />
            </div>
        );
    }
}