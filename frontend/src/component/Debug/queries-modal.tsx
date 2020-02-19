import React from 'react';  
import wikiStore from "../../data/store";
import { Modal, ModalProps, Button } from 'react-bootstrap';

interface PopupProps extends ModalProps {
    closePopup(): void;
}
export default class Popup extends React.Component<PopupProps, {}> {  
    constructor(props){
        super(props)
    }
    render() {
        const queries = wikiStore.ui.sparkelQueries.map((node, index) => {
            return (
                <pre className="col-12 query" key={`${index}`}>
                    {index+1}. {wikiStore.ui.sparkelQueries[index]}
                </pre>
            );
        });
        return <div>
        <Modal show={this.props.show} onHide={this.props.closePopup} size='xl' className="modal">
                <Modal.Header closeButton>
                    <Modal.Title>Queries</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div>
                    {queries}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={this.props.closePopup}>Close</Button>
                </Modal.Footer>
            </Modal>

        </div>;
    }
}


