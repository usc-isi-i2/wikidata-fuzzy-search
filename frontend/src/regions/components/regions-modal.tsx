import React from "react";
import TreeDisplay from './tree-display';
import RegionSelection from './region-selection';
import RegionsPath from './region-path';
import { Modal, ModalProps, Button } from 'react-bootstrap';

interface ResionsProps extends ModalProps {
onClose()
onSave()
}
interface RegionsModalState {
    
}
export default class RegionsModal extends React.Component<ResionsProps, RegionsModalState> {
    handlePathChanged = () => {
        console.debug('handle path changed')
    }
    handleSave =() => {
        this.props.onSave();
    }
    render() {
        return <div>
        <Modal show={this.props.show} onHide={this.props.onClose} size='xl' className="modal">
                <Modal.Header closeButton>
                    <Modal.Title>Choose countries</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <RegionSelection onPathChanged={this.handlePathChanged} onSave={this.handleSave}></RegionSelection>
                    <RegionsPath onPathChanged={this.handlePathChanged}></RegionsPath>
                    <TreeDisplay></TreeDisplay>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={this.handleSave}>Close</Button>
                </Modal.Footer>
            </Modal>

        </div>;
    }
}