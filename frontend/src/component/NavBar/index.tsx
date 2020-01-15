import React from 'react';
import Navbar from '../../../node_modules/react-bootstrap/Navbar';
import SearchBox from '../SearchBox/index';
import {Region} from '../../data/types';

interface NavBarProps {
    onSearch(keywords: string, region: Region[]);
}
export default class NavBar extends React.Component<NavBarProps>{
    handleSearchSubmit = (keywords: string, region: Region[]) => {
        this.props.onSearch(keywords, region);
    }

    render() {
        return (
            <div>

                {/* navbar */}
                <Navbar bg="light" style={{ height: '70px', borderBottom: '1px solid #006699', zIndex: 1000 }} className="shadow">

                    {/* logo */}
                    {/* <Navbar.Brand title="" href="" target="_blank" rel="noopener noreferrer">
            <img src="favicon.ico" width="40" height="40" className="d-inline-block" alt="" />
          </Navbar.Brand> */}
                    <Navbar.Brand className="responsive-hide" style={{ fontSize: 'x-large', fontWeight: 'bold', fontFamily: '"Roboto Slab", serif', cursor: 'default' }}>
                        {'Time Series Fuzzy Search'}
                    </Navbar.Brand>

                    {/* search box */}
                    <SearchBox onSearchSubmit={ this.handleSearchSubmit }></SearchBox>

                </Navbar>
            </div>
        );
    }
}