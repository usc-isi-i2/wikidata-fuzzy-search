import React from 'react';
import { Modal, ModalProps } from 'react-bootstrap';
import { observer } from 'mobx-react';
import wikiStore from "../../data/store";
import CustomizeResult from './customize-result';
import { VisualizationParams } from '../../data/visualizations-params';
import { TimeSeriesResult } from '../../data/types';

interface CustomizationProps extends ModalProps {
    onParamsChanged(result: TimeSeriesResult, params: VisualizationParams);
}

@observer
export default class CusotmizationModal extends React.Component<CustomizationProps, {}>{

    handleParamsChanged = (result: TimeSeriesResult, params: VisualizationParams) => {
        this.props.onParamsChanged(result, params);
    }

    render = () => {
        const results = wikiStore.timeSeries.results;
        return (
        <Modal {...this.props} size='lg'>
            <Modal.Header closeButton>
                <Modal.Title>Customize Plots</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                { results.map(result => <CustomizeResult result={result} key={result.index} onParamsChanged={this.handleParamsChanged}/>) }
            </Modal.Body>
        </Modal>
        )
    }
}
