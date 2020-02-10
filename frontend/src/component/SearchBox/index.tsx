import * as React from 'react';
import Button from 'react-bootstrap/Button';
import FormControl from 'react-bootstrap/FormControl';
import InputGroup from 'react-bootstrap/InputGroup';
import SearchCountriesModal from '../SearchCountries/SearchCountries-modal';

// FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons'

import './SearchBox.css';
import { Region } from '../../regions/types';
interface SearchBoxProps {
    onSearchSubmit(keywords: string, region: Region[])
}

interface SearchBoxState {
    inputValue: string;
    region: Region;
    multiValue: [{ label: string, value: string, check: boolean }],
    showModal: boolean,
}
export default class SearchBox extends React.Component<SearchBoxProps, SearchBoxState>{
    constructor(props: SearchBoxProps) {
        super(props)
        const defaultRegion: Region = { qCode: 'Q30', name: 'United States of America' };
        this.state = {
            inputValue: '',
            region: defaultRegion,
            multiValue: [{ label: 'United States of America', value: 'Q30', check: true }],
            showModal: false
        };

    }

    // handleSwitchCountry = (selectedOption: any) => {
    //     this.setState(state => {
    //         return {
    //           multiValue: selectedOption
    //         };
    //       });
    //     // if (this.state.keywords !== '') this.handleSearch(); // auto search
    // }

    buildRegionArray(): Array<Region> {
        let regionArray = new Array<Region>();
        this.state.multiValue.forEach(function (value) {
            let newRegion = { qCode: value.value, name: value.label } as Region
            regionArray.push(newRegion);
        });
        return regionArray;

    }
    handleSubmit = () => {
        let regionArray = this.buildRegionArray();
        this.props.onSearchSubmit(this.state.inputValue.trim(), regionArray);

    }

    componentDidMount() {
        // do search if params are given
        if (document.location.search !== '') {
            const params = new URLSearchParams(document.location.search.substring(1));
            const keywords = params.get('q');
            if (keywords !== null) {
                let regionArray = this.buildRegionArray()
                this.props.onSearchSubmit(keywords, regionArray);
            }
        }
    }

    handleChange = (evt: any) => {
        this.setState({
            inputValue: evt.target.value
        });

    }
    handleClick = (evt: any) => {
        if (evt.key === 'Enter' && !this.state.showModal) {
            console.debug("enter")
            this.handleSubmit();
        }

    }

    handleCountriesModal = () => {
        this.setState({ showModal: true });
    }

    handleCloseModal = () => {
        this.setState({ showModal: false });
    }

    handleSave = (regionArray: [{ label: string, value: string, check:boolean }]) => {
        this.setState({ multiValue: regionArray });
        this.handleCloseModal();
    }

    getSearchValue(){
        return this.state.multiValue[0].label;
    }
    render() {
       let dots = false;
       const text = this.state.multiValue.map(value =>{
        return value.label
       })
       let stringText = text.join(", ");
       while(stringText.length > 30){
        stringText = stringText.substr(0, stringText.lastIndexOf(","));
        dots = true;
    }
    if(dots){
        stringText = stringText + "...";
    }
        return (
            <div>
                <InputGroup onKeyPress={this.handleClick}>
                    <FormControl
                        className="responsive-search-bar"
                        placeholder="Enter query..."
                        onChange={(evt: any) => this.handleChange(evt)}
                        autoFocus
                        required
                    />
                    <Button onClick={this.handleCountriesModal} variant="primary" title="Choose Countries" className="ButtonSearchBox">
                        Choose Countries
                        </Button>
                    <SearchCountriesModal show={this.state.showModal} onClose={this.handleCloseModal} onSave={this.handleSave}/>
                    <InputGroup.Append>
                        <Button onClick={this.handleSubmit} variant="primary" title="Search" className="ButtonSearchBox" >
                            <FontAwesomeIcon icon={faSearch} />
                        </Button>
                    </InputGroup.Append>
                </InputGroup>
                <label className = "countries">
                    {stringText}
                    </label>
            </div>
        );
    }
}