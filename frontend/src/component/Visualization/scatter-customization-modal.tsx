import React from 'react';
import { Modal, ModalProps, Button } from 'react-bootstrap';
import { observer } from 'mobx-react';
import wikiStore from "../../data/store";
import { ScatterGroupingParams } from '../../customizations/visualizations-params';
import { ColumnInfo } from '../../queries/time-series-result';
import Select from 'react-select';
import { SelectOption } from '../../data/types';
interface CustomizationProps extends ModalProps {
    onParamsChanged(params: ScatterGroupingParams): void;
}

interface CustomizationState {
    colorFields: ColumnInfo[],
    markerSymbolFields: ColumnInfo[],
    markerSizeFields: ColumnInfo[],
    color?: ColumnInfo,
    markerSymbol?: ColumnInfo,
    markerSize?: ColumnInfo,
    scatterParams?: ScatterGroupingParams,
}

@observer
export default class ScatterCusotmizationModal extends React.Component<CustomizationProps, CustomizationState>{

    constructor(props: CustomizationProps) {
        super(props);
        //Add here calculation based on results length 
        const allAllowedFields = wikiStore.timeSeries.result.columns.filter(c => c.name !== 'point_in_time');
        const nonNumericFields = allAllowedFields.filter(c => !c.numeric);
        
        this.state = {
            colorFields: [...allAllowedFields],
            markerSymbolFields: [...nonNumericFields],
            markerSizeFields: [...nonNumericFields],
            color: wikiStore.ui.scatterGroupingParams.color,
            markerSymbol: wikiStore.ui.scatterGroupingParams.markerSymbol,
            markerSize: wikiStore.ui.scatterGroupingParams.markerSize,
        }
    }

    prepareOptionsForSelect = (fields: ColumnInfo[]): SelectOption[] => {
        const empty: SelectOption = {
            label: '', value: undefined
        };
        const options = fields.map(f => {
            return {
                label: f.name, value: f.name
            };
        });

        return [empty, ...options];
    }

    prepareValueForSelect = (field: ColumnInfo | undefined): SelectOption | undefined => {
        if (field) {
            return {
                label: field.name, value: field.name
            }
        }

        return undefined;
    }

    findColumn = (name: string, fields: ColumnInfo[]) => {
        return fields.find(f => f.name === name);
    }

    componentDidUpdate = (prevProps: CustomizationProps, prevState: CustomizationState) => {
        if (prevState.scatterParams !== wikiStore.ui.scatterGroupingParams) {
            // We need to initialize the selected fields if the grouping params change externally
            this.setState({
                color: wikiStore.ui.scatterGroupingParams.color,
                markerSymbol: wikiStore.ui.scatterGroupingParams.markerSymbol,
                markerSize: wikiStore.ui.scatterGroupingParams.markerSize,
                scatterParams: wikiStore.ui.scatterGroupingParams,
            });

            // Will call this function again after state is set
            return;
        }

        if (prevState.color !== this.state.color ||
            prevState.markerSymbol !== this.state.markerSymbol ||
            prevState.markerSize !== this.state.markerSize) {

            // const newAssignment: FieldAssignments = {
            //     colorFields: this.state.colorFields.filter(c => c !== this.state.markerSymbol && c !== this.state.markerSize),
            //     markerSymbolFields: this.state.markerSymbolFields.filter(c => c !== this.state.color && c !== this.state.markerSize),
            //     markerSizeFields: this.state.markerSizeFields.filter(c => c !== this.state.color && c !== this.state.markerSymbol)
            // }

            // this.setState({
            //     currentFields: newAssignment
            // });

            this.props.onParamsChanged(wikiStore.ui.scatterGroupingParams);

            return;
        }
    }

    handleColorChange = (selected: SelectOption) => {
        let column: ColumnInfo | undefined;
        
        if (selected) {
            column = this.findColumn(selected.value, this.state.colorFields);
        }

        wikiStore.ui.scatterGroupingParams.color = column;
        this.setState({
            color: column,
        });
    }

    handleMarkerSymbolChange = (selected: SelectOption) => {debugger
        let column: ColumnInfo | undefined;
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
        if (selected) {
            column = this.findColumn(selected.value, this.state.markerSizeFields);
        }

        wikiStore.ui.scatterGroupingParams.markerSize = column;
        this.setState({
            markerSize: column,
        });
    }


    render = () => {
        console.debug('Scatter customization modal color grouping: ', wikiStore.ui.scatterGroupingParams.color?.name ?? 'undefined');

        return (
            <Modal show={this.props.show} onHide = {this.props.onHide}>
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
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={this.props.onHide}>Close</Button>
                </Modal.Footer>
            </Modal>
        )
    }
}
