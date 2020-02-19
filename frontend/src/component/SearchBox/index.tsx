import * as React from 'react';
import Button from 'react-bootstrap/Button';
import FormControl from 'react-bootstrap/FormControl';
import InputGroup from 'react-bootstrap/InputGroup';
//import SearchCountriesModal from '../SearchCountries/SearchCountries-modal';
import RegionsModal from '../../regions/components/regions-modal';

// FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons'

import './SearchBox.css';
import { Region, RegionNode } from '../../regions/types';
import wikiStore from '../../data/store';
interface SearchBoxProps {
    onSearchSubmit(keywords: string, region: Region[])
}

interface SearchBoxState {
    inputValue: string;
    multiValue: Region[],
    showModal: boolean
}
export default class SearchBox extends React.Component<SearchBoxProps, SearchBoxState>{
    constructor(props: SearchBoxProps) {
        super(props)
        this.state = {
            inputValue: '',
            multiValue: [],
            showModal: false,
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
            let newRegion = { qCode: value.qCode, name: value.name } as Region
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
        if (evt.key === 'Enter' && !this.state.showModal && this.state.inputValue) {
            console.debug("enter")
            this.handleSubmit();
        }

    }

    handleCountriesModal = () => {
        this.setState({ showModal: true });
    }


    // handleCloseModal = () => {
    //     this.setState({ showModal: false });
    // }

    handleSave = () => {
        const selectedRegions = wikiStore.ui.region.getRegionsFromForest();
        this.setState({
            multiValue: selectedRegions,
            showModal: false
        });
    }

    getSearchValue() {
        return this.state.multiValue[0].name;
    }
    render() {
        let dots = false;
        const text = this.state.multiValue.map(value => {
            return value.name
        })
        let stringText = text.join(", ");
        while (stringText.length > 50) {
            stringText = stringText.substr(0, stringText.lastIndexOf(","));
            dots = true;
        }
        if (dots) {
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
                    <RegionsModal show={this.state.showModal} onClose={this.handleSave} onSave={this.handleSave} />
                    <InputGroup.Append>
                        <Button onClick={this.handleSubmit} variant="primary" title="Search" className="ButtonSearchBox" disabled={!(this.state.inputValue && this.state.multiValue.length > 0)}>
                            <FontAwesomeIcon icon={faSearch} />
                        </Button>
                    </InputGroup.Append>
                </InputGroup>
                <label className="countries">
                    {stringText}
                </label>
            
            </div>
        );
    }
}