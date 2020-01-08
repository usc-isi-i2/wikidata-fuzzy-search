import React from 'react';
import { observer } from 'mobx-react';
import { TimeSeriesResult } from '../../data/types';
import { lineStyles, colors, markers } from '../../customizations/plots';
import wikiStore from "../../data/store";
import { OptionTypeBase, default as Select } from 'react-select';
import { VisualizationParams } from '../../data/visualizations-params';

interface CustomizeResultProps {
    result: TimeSeriesResult;
    onParamsChanged(result: TimeSeriesResult, params: VisualizationParams)
}

interface CustomizeResultState {
    params: VisualizationParams;
}

@observer
export default class CusotmizeResult extends React.Component<CustomizeResultProps, CustomizeResultState>{
    constructor(props: CustomizeResultProps) {
        super(props)
        this.state = { params: undefined }
    }

    static getDerivedStateFromProps(props: CustomizeResultProps, state: CustomizeResultState) {
        const params = wikiStore.ui.visualizationParams.getParams(props.result);
        return { params };
    }

    componentDidUpdate(prevProps) {
        if (prevProps.result !== this.props.result) {
            this.setState({ params: wikiStore.ui.visualizationParams.getParams(this.props.result) });
        }
    }
    
    colorOptions = () => {
        return colors.map((c) => { return { value: c, label: c }; })
    }
    handleColorChange = (selectedColor: OptionTypeBase) => {
        const np = this.state.params.clone();
        np.color = selectedColor.value;
        this.updateParams(np);
    }    

    markerOptions = () => {
        return markers.map(m => { return { value: m.name, label: m.name }; })
    }
    handleMarkerChange = (selectedMarker: OptionTypeBase) => {
        const np = this.state.params.clone();
        np.marker = selectedMarker.value;
        this.updateParams(np);
    }

    lineStyleOptions = () => {
        return lineStyles.map(ls => { return { value: ls.name, label: ls.name }});
    }
    handleLineStyleChange = (selectedLineStyle: OptionTypeBase) => {
        const np = this.state.params.clone();
        np.lineType = selectedLineStyle.value;
        this.updateParams(np);
    }

    updateParams = (params: VisualizationParams) => {
        this.setState( {params} )
        wikiStore.ui.visualizationParams.updateParams(this.props.result, params);
        this.props.onParamsChanged(this.props.result, params);
    }

    render = () => {
        const params = this.state.params;
        const colorValue = { value: params.color, label: params.color };
        const markerValue = { value: params.marker, label: params.marker };
        const lineStyleValue = { value: params.lineType, label: params.lineType };

        return (
            <div className="row">
                <div className="col-5">{this.props.result.region.name}</div>
                <div className="col-1"></div>
                <div className="col-2"><Select value={colorValue} onChange={this.handleColorChange} options={this.colorOptions()}/></div>
                <div className="col-2"><Select value={markerValue} onChange={this.handleMarkerChange} options={this.markerOptions()}/></div>
                <div className="col-2"><Select value={lineStyleValue} onChange={this.handleLineStyleChange} options={this.lineStyleOptions()}/></div>
            </div>
        )
    }
}
