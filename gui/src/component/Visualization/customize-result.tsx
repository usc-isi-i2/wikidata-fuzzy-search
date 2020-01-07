import React from 'react';
import { observer } from 'mobx-react';
import { TimeSeriesResult } from '../../data/types';
import { lineStyles, colors, markers } from '../../customizations/plots';
import wikiStore from "../../data/store";
import { OptionTypeBase, default as Select } from 'react-select';
interface CustomizeResultProps {
    result: TimeSeriesResult;
}

@observer
export default class CusotmizeResult extends React.Component<CustomizeResultProps, {}>{
    colorOptions = () => {
        return colors.map((c) => { return { value: c, label: c }; })
    }
    handleColorChange = (selectedColor: OptionTypeBase) => {
        this.props.result.visualiztionParams.color = selectedColor.value;
        this.forceUpdate();
    }    

    markerOptions = () => {
        return markers.map(m => { return { value: m.name, label: m.name }; })
    }
    handleMarkerChange = (selectedMarker: OptionTypeBase) => {
        this.props.result.visualiztionParams.marker = selectedMarker.value;
        this.forceUpdate();
    }

    lineStyleOptions = () => {
        return lineStyles.map(ls => { return { value: ls.name, label: ls.name }});
    }
    handleLineStyleChange = (selectedLineStyle: OptionTypeBase) => {
        this.props.result.visualiztionParams.lineType = selectedLineStyle.value;
        this.forceUpdate();
    }

    render = () => {
        const params = this.props.result.visualiztionParams;
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
