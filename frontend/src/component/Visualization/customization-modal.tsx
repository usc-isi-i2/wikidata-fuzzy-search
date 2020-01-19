import React from 'react';
import { Modal, ModalProps, Button } from 'react-bootstrap';
import { observer } from 'mobx-react';
import wikiStore from "../../data/store";
import { GroupingParams } from '../../data/visualizations-params';
import { ColumnInfo } from '../../queries/time-series-result';
import Select from 'react-select';
import { SelectOption } from '../../data/types';
interface CustomizationProps extends ModalProps {
    onParamsChanged(params: GroupingParams): void;
}


interface FieldAssignments {
    colorFields: ColumnInfo[],
    markerSymbolFields: ColumnInfo[],
    lineStyleFields: ColumnInfo[],
}
interface CustomizationState {
    initialFields: FieldAssignments,
    currentFields: FieldAssignments,
    color?: ColumnInfo,
    markerSymbol?: ColumnInfo,
    lineStyle?: ColumnInfo,
}

@observer
export default class CusotmizationModal extends React.Component<CustomizationProps, CustomizationState>{

    constructor(props: CustomizationProps) {
        super(props);

        const allAllowedFields = wikiStore.timeSeries.result.columns.filter(c => c.name !== 'point_in_time');
        const nonNumericFields = allAllowedFields.filter(c => !c.numeric);

        this.state = {
            initialFields: {
                colorFields: [...allAllowedFields],
                markerSymbolFields: [...nonNumericFields],
                lineStyleFields: [...nonNumericFields],
            },
            currentFields: {
                colorFields: [...allAllowedFields],
                markerSymbolFields: [...nonNumericFields],
                lineStyleFields: [...nonNumericFields],
            },
            color: wikiStore.ui.groupingParams.color,
            markerSymbol: wikiStore.ui.groupingParams.markerSymbol,
            lineStyle: wikiStore.ui.groupingParams.lineStyle,
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
            prevState.lineStyle !== this.state.lineStyle) {

            const newAssignment: FieldAssignments = {
                colorFields: this.state.initialFields.colorFields.filter(c => c !== this.state.markerSymbol && c !== this.state.lineStyle),
                markerSymbolFields: this.state.initialFields.markerSymbolFields.filter(c => c !== this.state.color && c !== this.state.lineStyle),
                lineStyleFields: this.state.initialFields.lineStyleFields.filter(c => c !== this.state.color && c !== this.state.markerSymbol)
            }

            this.setState({
                currentFields: newAssignment
            });

            this.props.onParamsChanged(wikiStore.ui.groupingParams);
        }
    }

    handleColorChange = (selected: SelectOption) => {
        let column: ColumnInfo | undefined;
        if (selected) {
            column = this.findColumn(selected.value, this.state.currentFields.colorFields);
        }

        wikiStore.ui.groupingParams.color = column;
        this.setState({
            color: column,
        });
    }

    handleMarkerSymbolChange = (selected: SelectOption) => {
        let column: ColumnInfo | undefined;
        if (selected) {
            column = this.findColumn(selected.value, this.state.currentFields.markerSymbolFields);
        }

        wikiStore.ui.groupingParams.markerSymbol = column;
        this.setState({
            markerSymbol: column,
        });
    }

    handleLineStyleChange = (selected: SelectOption) => {
        let column: ColumnInfo | undefined;
        if (selected) {
            column = this.findColumn(selected.value, this.state.currentFields.lineStyleFields);
        }

        wikiStore.ui.groupingParams.lineStyle = column;
        this.setState({
            lineStyle: column,
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
                                vakye={this.prepareValueForSelect(this.state.markerSymbol)}
                                onChange={this.handleMarkerSymbolChange} />
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-4">
                            Line Style
                    </div>
                        <div className="col-8">
                            <Select options={this.prepareOptionsForSelect(this.state.currentFields.lineStyleFields)}
                                vakye={this.prepareValueForSelect(this.state.lineStyle)}
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
