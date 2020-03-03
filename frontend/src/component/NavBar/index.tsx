import React from 'react';
import Navbar from '../../../node_modules/react-bootstrap/Navbar';
import SearchBox from '../SearchBox/index';
import config from "../../config";


import './Navbar.css'
import { Region } from '../../regions/types';
import { ModalProps } from 'react-bootstrap';
import DebugMenu from '../Debug';
interface NavBarProps {
    onSearch(keywords: string)//, region: Region[]);
    onRegionChanged(region: Region[]);
}

interface NavBarState extends ModalProps {
    showPopup: boolean;
}
export default class NavBar extends React.Component<NavBarProps,NavBarState>{
    constructor(props){
        super(props);
        this.state = { showPopup: false };
        this.togglePopup = this.togglePopup.bind(this);
    }
    handleSearchSubmit = (keywords: string) => {
        this.props.onSearch(keywords);   
        
    }
    handleRegionChanged = (regionArray: Region[]) => {
        this.props.onRegionChanged(regionArray)
    }
    togglePopup() {
        this.setState({
            showPopup: !this.state.showPopup
        });
    }
    render() {
        return (
            <div className="NabBar">
                {/* navbar */}
                <Navbar bg="light" className="shadow">
                    {/* logo */}
                    {/* <Navbar.Brand title="" href="" target="_blank" rel="noopener noreferrer">
            <img src="favicon.ico" width="40" height="40" className="d-inline-block" alt="" />
          </Navbar.Brand> */}
                    <Navbar.Brand className="responsive-hide">
                        {'Time Series Fuzzy Search'}
                    </Navbar.Brand>

                    {/* search box */}
                    <SearchBox onSearchSubmit={ this.handleSearchSubmit } onRegionChanged = {this.handleRegionChanged}></SearchBox>

                    {config.isDebugging?
                    <DebugMenu></DebugMenu>
                    :<div></div>
    }

                </Navbar>
            </div>
        );
    }
}