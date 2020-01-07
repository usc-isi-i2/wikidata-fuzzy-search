import React from 'react';
import { Modal, ModalProps } from 'react-bootstrap';
import { observer } from 'mobx-react';

@observer
export default class CusotmizationModal extends React.Component<ModalProps, {}>{
    render = () => {
        return (
        <Modal {...this.props}>
            <Modal.Header closeButton>
                <Modal.Title>Customize Plots</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>This is where we customize</p>
            </Modal.Body>
            <Modal.Footer></Modal.Footer>
        </Modal>
        )
    }
}
