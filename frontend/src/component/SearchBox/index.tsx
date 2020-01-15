import * as React from 'react';
import Button from 'react-bootstrap/Button';
import countryOptions from '../../config/countryOptions.json';
import Form from 'react-bootstrap/Form';
import FormControl from 'react-bootstrap/FormControl';
import InputGroup from 'react-bootstrap/InputGroup';
import Select from 'react-select';
import {Region} from '../../data/types';


// FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons'

interface SearchBoxProps {
    onSearchSubmit(keywords: string, region: Region[])
}

interface SearchBoxState {
    inputValue: string;
    region: Region;
    multiValue: [{label: string, value:string}]
}
export default class SearchBox extends React.Component<SearchBoxProps, SearchBoxState>{
    constructor(props: SearchBoxProps){
        super(props)
        const defaultRegion = new Region('Q30', 'United States of America');
        this.state = {
            inputValue: '',
            region: defaultRegion,
            multiValue: [{ label: 'United States of America', value: 'Q30' }]
        };

    }
    

    handleSwitchCountry = (selectedOption: any) => {
        this.setState(state => {
            return {
              multiValue: selectedOption
            };
          });
        // if (this.state.keywords !== '') this.handleSearch(); // auto search
    }

    buildRegionArray(): Array<Region>{
        let regionArray = new Array<Region>();
        this.state.multiValue.forEach(function(value){
            let newRegion = {countryCode: value.value, countryName: value.label} as Region
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
                    <div className="responsive-search-bar" style={{ minWidth: '50px', width: '20vw', maxWidth: '300px' }}>
                        <Select
                            isMulti
                            styles={customStyles}
                            options={countryOptions}
                            defaultValue={{ 'label': 'United States of America', 'value': 'Q30' }}
                            onChange={(selectedOption) => this.handleSwitchCountry(selectedOption)}
                            value={this.state.multiValue}
                            
                        />
                    </div>
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