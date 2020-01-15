import React from 'react';
import { Modal, ModalProps } from 'react-bootstrap';
import { observer } from 'mobx-react';
import wikiStore from "../../data/store";
import CustomizeResult from './customize-result';
import { VisualizationParams } from '../../data/visualizations-params';
import { TimeSeriesResult } from '../../queries/time-series-result';

interface CustomizationProps extends ModalProps {
    onParamsChanged(result: TimeSeriesResult, params: VisualizationParams);
}

@observer
export default class CusotmizationModal extends React.Component<CustomizationProps, {}>{

    handleParamsChanged = (result: TimeSeriesResult, params: VisualizationParams) => {
        this.props.onParamsChanged(result, params);
    }

    render = () => {
        const result = wikiStore.timeSeries.result;
        return (
        <Modal {...this.props} size='lg'>
            <Modal.Header closeButton>
                <Modal.Title>Customize Plots</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <CustomizeResult result={result} onParamsChanged={this.handleParamsChanged}/>
            </Modal.Body>
        </Modal>
        )
    }
}
