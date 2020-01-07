import React from 'react';
import { Modal, ModalProps } from 'react-bootstrap';
import { observer } from 'mobx-react';
import wikiStore from "../../data/store";
import CustomizeResult from './customize-result';

@observer
export default class CusotmizationModal extends React.Component<ModalProps, {}>{

    render = () => {
        const results = wikiStore.timeSeries.timeSeriesResult;
        return (
        <Modal {...this.props} size='lg'>
            <Modal.Header closeButton>
                <Modal.Title>Customize Plots</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                { results.map(result => <CustomizeResult result={result} />) }
            </Modal.Body>
        </Modal>
        )
    }
}
