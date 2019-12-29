import React from 'react';
import Navbar from '../../../node_modules/react-bootstrap/Navbar';
import SearchBox from '../SearchBox/index';

export default class NavBar extends React.Component<any, any>{
    handleSearchSubmit(keywords: string, country: string) {
        this.props.onSearch(keywords, country);
    }
    componentDidUpdate(prevProps: any, prevState: any) {
        console.log("NavBar");
        Object.entries(this.props).forEach(([key, val]) =>
            prevProps[key] !== val && console.log(`Prop '${key}' changed`)
        );
        if (this.state) {
            Object.entries(this.state).forEach(([key, val]) =>
                prevState[key] !== val && console.log(`State '${key}' changed`)
            );
        }
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
                    <SearchBox onSearchSubmit={(keywords: string, country: string) => this.handleSearchSubmit(keywords, country)}></SearchBox>

                </Navbar>
            </div>
        );
    }
}