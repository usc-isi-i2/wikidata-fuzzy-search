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


interface FieldAssignments {
    colorFields: ColumnInfo[],
    markerSymbolFields: ColumnInfo[],
    markerSizeFields: ColumnInfo[],
}
interface CustomizationState {
    initialFields: FieldAssignments,
    currentFields: FieldAssignments,
    color?: ColumnInfo,
    markerSymbol?: ColumnInfo,
    markerSize?: ColumnInfo,
}

@observer
export default class ScatterCusotmizationModal extends React.Component<CustomizationProps, CustomizationState>{

    constructor(props: CustomizationProps) {
        super(props);

        const allAllowedFields = wikiStore.timeSeries.result.columns.filter(c => c.name !== 'point_in_time');
        const nonNumericFields = allAllowedFields.filter(c => !c.numeric);

        this.state = {
            initialFields: {
                colorFields: [...allAllowedFields],
                markerSymbolFields: [...nonNumericFields],
                markerSizeFields: [...nonNumericFields],
            },
            currentFields: {
                colorFields: [...allAllowedFields],
                markerSymbolFields: [...nonNumericFields],
                markerSizeFields: [...nonNumericFields],
            },
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
        if (prevState.color !== this.state.color ||
            prevState.markerSymbol !== this.state.markerSymbol ||
            prevState.markerSize !== this.state.markerSize) {

            const newAssignment: FieldAssignments = {
                colorFields: this.state.initialFields.colorFields.filter(c => c !== this.state.markerSymbol && c !== this.state.markerSize),
                markerSymbolFields: this.state.initialFields.markerSymbolFields.filter(c => c !== this.state.color && c !== this.state.markerSize),
                markerSizeFields: this.state.initialFields.markerSizeFields.filter(c => c !== this.state.color && c !== this.state.markerSymbol)
            }

            this.setState({
                currentFields: newAssignment
            });

            this.props.onParamsChanged(wikiStore.ui.scatterGroupingParams);
        }
    }

    handleColorChange = (selected: SelectOption) => {
        let column: ColumnInfo | undefined;
        if (selected) {
            column = this.findColumn(selected.value, this.state.currentFields.colorFields);
        }

        wikiStore.ui.scatterGroupingParams.color = column;
        this.setState({
            color: column,
        });
    }

    handleMarkerSymbolChange = (selected: SelectOption) => {
        let column: ColumnInfo | undefined;
        if (selected) {
            column = this.findColumn(selected.value, this.state.currentFields.markerSymbolFields);
        }

        wikiStore.ui.scatterGroupingParams.markerSymbol = column;
        this.setState({
            markerSymbol: column,
        });
    }

    handleLineStyleChange = (selected: SelectOption) => {
        let column: ColumnInfo | undefined;
        if (selected) {
            column = this.findColumn(selected.value, this.state.currentFields.markerSizeFields);
        }

        wikiStore.ui.scatterGroupingParams.markerSize = column;
        this.setState({
            markerSize: column,
        });
    }


    render = () => {
        return (
            <Modal {...this.props}>
                <Modal.Header closeButton>
                    <Modal.Title>Plot Grouping</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="row">
                        <div className="col-4">
                            Color
                    </div>
                        <div className="col-8">
                            <Select options={this.prepareOptionsForSelect(this.state.currentFields.colorFields)}
                                value={this.prepareValueForSelect(this.state.color)}
                                onChange={this.handleColorChange} />
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-4">
                            Marker Glyph
                    </div>
                        <div className="col-8">
                            <Select options={this.prepareOptionsForSelect(this.state.currentFields.markerSymbolFields)}
                                value={this.prepareValueForSelect(this.state.markerSymbol)}
                                onChange={this.handleMarkerSymbolChange} />
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-4">
                            Line Style
                    </div>
                        <div className="col-8">
                            <Select options={this.prepareOptionsForSelect(this.state.currentFields.markerSizeFields)}
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
