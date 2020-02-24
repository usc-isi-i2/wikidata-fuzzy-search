import React from "react";
import RegionSelection from './region-selection';
import RegionsPath from './region-path';
import { Modal, ModalProps, Button } from 'react-bootstrap';
import { RegionNode } from "../types";
import wikiStore from "../../data/store";
import ForestDisplay from "./forest-display";
import Popup from "../../component/Debug/queries-modal";

interface ResionsProps extends ModalProps {
    onClose(): void,
    onSave(): void,
}


export default class RegionsModal extends React.Component<ResionsProps, {}> {
    constructor(props) {
        super(props);
    }

    handlePathChanged = async (newPath: RegionNode[]) => {
        // TODO: Add some sort of progress bar
        wikiStore.ui.region.changePath(newPath);
    }

    handleSave = () => {
        this.props.onSave();
    }


    render() {
        return <div>
            <Modal show={this.props.show} onHide={this.props.onClose} className="modal">
                <Modal.Header closeButton>
                    <Modal.Title>Choose countries</Modal.Title>

                </Modal.Header>
                <Modal.Body>
                    <div className="row">
                        <div className="col-9">
                            <RegionsPath onPathChanged={this.handlePathChanged}></RegionsPath>
                            <RegionSelection onPathChanged={this.handlePathChanged} onSave={this.handleSave}></RegionSelection>
                        </div>
                        <div className="col-3">
                            <ForestDisplay></ForestDisplay>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={this.handleSave}>Close</Button>
                </Modal.Footer>
            </Modal>

        </div>;
    }
}