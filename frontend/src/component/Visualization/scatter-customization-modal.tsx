import React from 'react';
import { Modal, ModalProps, Button } from 'react-bootstrap';
import { observer } from 'mobx-react';
import wikiStore from "../../data/store";
import { ScatterGroupingParams } from '../../customizations/visualizations-params';
import { ColumnInfo } from '../../queries/time-series-result';
import Select from 'react-select';
import { SelectOption } from '../../data/types';
import { cleanFieldName } from '../../utils';

interface CustomizationProps extends ModalProps {
    onParamsChanged(params: ScatterGroupingParams): void;
}

interface CustomizationState {
    colorFields: ColumnInfo[],
    markerSymbolFields: ColumnInfo[],
    markerSizeFields: ColumnInfo[],
    colorLevelFields: ColumnInfo[],
    color?: ColumnInfo,
    markerSymbol?: ColumnInfo,
    markerSize?: ColumnInfo,
    scatterParams?: ScatterGroupingParams,
    colorLevel?: ColumnInfo
}

@observer
export default class ScatterCusotmizationModal extends React.Component<CustomizationProps, CustomizationState>{
    constructor(props: CustomizationProps) {
        super(props);
        //Add here calculation based on results length 
        const allAllowedFields = wikiStore.timeSeries.result.columns.filter(c => c.name !== 'point_in_time');
        const nonNumericFields = allAllowedFields.filter(c => !c.numeric);
        const numericFields = allAllowedFields.filter(c => c.numeric);
        this.state = {
            colorFields: [...allAllowedFields],
            markerSymbolFields: [...nonNumericFields],
            markerSizeFields: [...nonNumericFields],
            colorLevelFields: [...numericFields],
            color: wikiStore.ui.scatterGroupingParams.color,
            markerSymbol: wikiStore.ui.scatterGroupingParams.markerSymbol,
            markerSize: wikiStore.ui.scatterGroupingParams.markerSize,
            colorLevel: wikiStore.ui.scatterGroupingParams.colorLevel
        }
    }

    prepareOptionsForSelect = (fields: ColumnInfo[]): SelectOption[] => {
        const empty: SelectOption = {
            label: 'None', value: undefined
        };
        const options = fields.map(f => {
            return {
                label: cleanFieldName(f.name), value: f.name
            };
        });

        return [empty, ...options];
    }

    prepareValueForSelect = (field: ColumnInfo | undefined): SelectOption | undefined => {
        if (field) {
            return {
                label: cleanFieldName(field.name), value: field.name
            }
        }

        return { label: 'None', value: undefined };
    }

    findColumn = (name: string, fields: ColumnInfo[]) => {
        return fields.find(f => f.name === name);
    }
    // updateFields = () => {
    //     const allAllowedFields = wikiStore.timeSeries.result.columns.filter(c => c.name !== 'point_in_time');
    //     const nonNumericFields = allAllowedFields.filter(c => !c.numeric);
    //     if(this.state.colorFields != allAllowedFields || this.state.markerSizeFields != nonNumericFields
    //          || this.state.markerSymbolFields != nonNumericFields){
    //             this.setState({
    //                 colorFields: [...allAllowedFields],
    //                 markerSymbolFields: [...nonNumericFields],
    //                 markerSizeFields: [...nonNumericFields],
                   
    //             });
    //     }
    // }

    componentDidUpdate = (prevProps: CustomizationProps, prevState: CustomizationState) => {
        //this.updateFields()
        if (prevState.scatterParams !== wikiStore.ui.scatterGroupingParams) {
            // We need to initialize the selected fields if the grouping params change externally
            this.setState({
                color: wikiStore.ui.scatterGroupingParams.color,
                markerSymbol: wikiStore.ui.scatterGroupingParams.markerSymbol,
                markerSize: wikiStore.ui.scatterGroupingParams.markerSize,
                scatterParams: wikiStore.ui.scatterGroupingParams,
                colorLevel: wikiStore.ui.scatterGroupingParams.colorLevel
            });
            // Will call this function again after state is set
            return;
        }

        if (prevState.color !== this.state.color ||
            prevState.markerSymbol !== this.state.markerSymbol ||
            prevState.markerSize !== this.state.markerSize) {
            this.props.onParamsChanged(wikiStore.ui.scatterGroupingParams);
            return;
        }
    }

    handleColorChange = (selected: SelectOption) => {
        let column: ColumnInfo | undefined;
        wikiStore.ui.customiztionsCache.clearCustomiztionsCache();
        if (selected) {
            column = this.findColumn(selected.value, this.state.colorFields);
        }

        wikiStore.ui.scatterGroupingParams.color = column;
        this.setState({
            color: column,
        });
    }

    handleMarkerSymbolChange = (selected: SelectOption) => {
        let column: ColumnInfo | undefined;
        wikiStore.ui.customiztionsCache.clearCustomiztionsCache();
        if (selected) {
            column = this.findColumn(selected.value, this.state.markerSymbolFields);
        }

        wikiStore.ui.scatterGroupingParams.markerSymbol = column;
        this.setState({
            markerSymbol: column,
        });
    }

    handleLineStyleChange = (selected: SelectOption) => {
        let column: ColumnInfo | undefined;
        wikiStore.ui.customiztionsCache.clearCustomiztionsCache();
        if (selected) {
            column = this.findColumn(selected.value, this.state.markerSizeFields);
        }

        wikiStore.ui.scatterGroupingParams.markerSize = column;
        this.setState({
            markerSize: column,
        });
    }

    handleColorLevelChange = (selected: SelectOption) => {
        let column: ColumnInfo | undefined;
        wikiStore.ui.customiztionsCache.clearCustomiztionsCache();
        if (selected) {
            column = this.findColumn(selected.value, this.state.colorLevelFields);
        }

        wikiStore.ui.scatterGroupingParams.colorLevel = column;
        this.setState({
            colorLevel: column,
        });
    }

    render = () => {
        return (
            <Modal show={this.props.show} onHide={this.props.onHide}>
                <Modal.Header closeButton>
                    <Modal.Title>Plot Grouping</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="row">
                        <div className="col-4">
                            Color
                    </div>
                        <div className="col-8">
                            <Select options={this.prepareOptionsForSelect(this.state.colorFields)}
                                value={this.prepareValueForSelect(this.state.color)}
                                onChange={this.handleColorChange} />
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-4">
                            Marker Glyph
                    </div>
                        <div className="col-8">
                            <Select options={this.prepareOptionsForSelect(this.state.markerSymbolFields)}
                                value={this.prepareValueForSelect(this.state.markerSymbol)}
                                onChange={this.handleMarkerSymbolChange} />
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-4">
                            Marker Size
                    </div>
                        <div className="col-8">
                            <Select options={this.prepareOptionsForSelect(this.state.markerSizeFields)}
                                value={this.prepareValueForSelect(this.state.markerSize)}
                                onChange={this.handleLineStyleChange} />
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-4">
                            Color Level
                    </div>
                        <div className="col-8">
                            <Select options={this.prepareOptionsForSelect(this.state.colorLevelFields)}
                                value={this.prepareValueForSelect(this.state.colorLevel)}
                                onChange={this.handleColorLevelChange} />
                        </div>
                    </div>


                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={this.props.onHide}>Close</Button>
                </Modal.Footer>
            </Modal>
        )
    }
}
