import * as React from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import FormControl from 'react-bootstrap/FormControl';
import InputGroup from 'react-bootstrap/InputGroup';
import { Region } from '../../data/types';
import SearchCountriesModal from '../SearchCountries/SearchCountries-modal';

// FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons'

interface SearchBoxProps {
    onSearchSubmit(keywords: string, region: Region[])
}

interface SearchBoxState {
    inputValue: string;
    region: Region;
    multiValue: [{ label: string, value: string }],
    showModal: boolean,
}
export default class SearchBox extends React.Component<SearchBoxProps, SearchBoxState>{
    constructor(props: SearchBoxProps) {
        super(props)
        const defaultRegion = new Region('Q30', 'United States of America');
        this.state = {
            inputValue: '',
            region: defaultRegion,
            multiValue: [{ label: 'United States of America', value: 'Q30' }],
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
            let newRegion = { countryCode: value.value, countryName: value.label } as Region
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
        if (evt.key === 'Enter') {
            this.handleSubmit();
        }

    }

    handleCountriesModal = () => {
        this.setState({ showModal: true });
    }

    handleCloseModal = () => {
        this.setState({ showModal: false });
    }

    handleSave = (regionArray: [{ label: string, value: string }]) => {
        this.setState({ multiValue: regionArray });
        this.handleCloseModal();
    }

    render() {
        const customStyles = {
            option: (provided: any, state: any) => ({
                ...provided,
            }),
            control: (provided: any) => ({
                ...provided,
                borderRadius: '0px',
            }),
            singleValue: (provided: any, state: any) => {
                const opacity = state.isDisabled ? 0.5 : 1;
                const transition = 'opacity 300ms';
                return { ...provided, opacity, transition };
            }
        }
        return (
            <Form >
                <InputGroup onKeyDown={this.handleClick}>
                    <FormControl
                        className="responsive-search-bar"
                        style={{ minWidth: '50px', width: '20vw', maxWidth: '300px', borderRight: 'none' }}
                        placeholder="Enter query..."
                        onChange={(evt: any) => this.handleChange(evt)}
                        autoFocus
                        required
                    />
                    <Button onClick={this.handleCountriesModal} variant="primary" title="Choose Countries" style={{ background: '#006699', border: '0' }}>
                        Choose Countries
                        </Button>
                    <SearchCountriesModal show={this.state.showModal} onHide={this.handleCloseModal} onSave={this.handleSave} onClose={this.handleCloseModal}/>
                    <InputGroup.Append>
                        <Button onClick={this.handleSubmit} variant="primary" title="Search" style={{ background: '#006699', border: '0' }}>
                            <FontAwesomeIcon icon={faSearch} />
                        </Button>
                    </InputGroup.Append>
                </InputGroup>
            </Form>
        );
    }
}