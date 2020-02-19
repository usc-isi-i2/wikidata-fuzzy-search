import React from 'react';
import Popup from "./queries-modal";
import './debug.css'
import Button from 'react-bootstrap/Button';
import { ModalProps } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons'

interface DebugState extends ModalProps {
    showPopup: boolean;
}
export default class DebugMenu extends React.Component<{}, DebugState>{
    constructor(props) {
        super(props);
        this.state = { showPopup: false };
        this.togglePopup = this.togglePopup.bind(this);
    }

    togglePopup() {
        this.setState({
            showPopup: !this.state.showPopup
        });
    }
    render() {
        return (
                <div className="queriesModal ml-auto">
                    <Button onClick={this.togglePopup} variant="primary" title="Debug queries">
                            <FontAwesomeIcon icon={faBars}/> Debug queries
                        </Button>
                    <Popup show={this.state.showPopup}
                        closePopup={this.togglePopup}
                    />
            </div>
        );
    }
}