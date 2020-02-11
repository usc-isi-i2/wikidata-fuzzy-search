import React from "react";
import TreeDisplay from './tree-display';
import RegionSelection from './region-selection';
import RegionsPath from './region-path';
import { Modal, ModalProps } from 'react-bootstrap';

interface ResionsProps extends ModalProps {
onClose()
onSave(regionArray: [{label: string, value:string, check: boolean}])
}
interface RegionsModalState {
    
}
export default class RegionsModal extends React.Component<ResionsProps, RegionsModalState> {
    handlePathChanged = () => {
        console.debug('handle path changed')
    }
    render() {
        return <div>
        <Modal show={this.props.show} onHide={this.props.onClose} size='lg'>
                <Modal.Header closeButton>
                    <Modal.Title>Choose countries</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <RegionSelection onPathChanged={this.handlePathChanged}></RegionSelection>
                    <RegionsPath onPathChanged={this.handlePathChanged}></RegionsPath>
                    <TreeDisplay></TreeDisplay>
                </Modal.Body>
                <Modal.Footer>

                </Modal.Footer>
            </Modal>

        </div>;
    }
}