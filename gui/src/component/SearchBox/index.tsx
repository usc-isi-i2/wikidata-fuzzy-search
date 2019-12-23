import * as React from 'react';
import Button from 'react-bootstrap/Button';
import countryOptions from '../../config/countryOptions.json';
import Form from 'react-bootstrap/Form';
import FormControl from 'react-bootstrap/FormControl';
import InputGroup from 'react-bootstrap/InputGroup';
import Select from 'react-select';
import * as utils from '../../utils';


// FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons'

export default class SearchBox extends React.Component<any, any>{
  state = {
    inputValue: '',
    country: 'Q30'
  };

  constructor(props:any){
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  handleSwitchCountry(selectedOption:any) {
    console.log('<App> selected country: %c' + selectedOption.value + '%c ' + selectedOption.label, utils.log.highlight, utils.log.default);

    this.setState({ country: selectedOption.value });
    // if (this.state.keywords !== '') this.handleSearch(); // auto search
  }
 
  handleSubmit(){
    this.props.onSearchSubmit(this.state.inputValue.trim(), this.state.country);

  }

  handleChange(evt:any){
    this.setState({
      inputValue: evt.target.value
    });
  }
  render () {
    const customStyles = {
      option: (provided:any, state:any) => ({
        ...provided,
      }),
      control: (provided:any) => ({
        ...provided,
        borderRadius: '0px',
      }),
      singleValue: (provided:any, state:any) => {
        const opacity = state.isDisabled ? 0.5 : 1;
        const transition = 'opacity 300ms';
        return { ...provided, opacity, transition };
      }
    }
    return (
      <Form onSubmit={() =>this.handleSubmit()}>
      <InputGroup>
          <FormControl
            className="responsive-search-bar"
            style={{ minWidth: '50px', width: '20vw', maxWidth: '300px', borderRight: 'none' }}
            placeholder="Enter query..."
            onChange={(evt:any) => this.handleChange(evt)}
            autoFocus
            required
          />
          <div className="responsive-search-bar" style={{ minWidth: '50px', width: '20vw', maxWidth: '300px' }}>
            <Select
              styles={customStyles}
              options={countryOptions}
              defaultValue={{ 'label': 'United States of America', 'value': 'Q30' }}
              onChange={(selectedOption) => this.handleSwitchCountry(selectedOption)}
            />
          </div>
          <InputGroup.Append>
            <Button type="submit" variant="primary" title="Search" style={{ background: '#006699', border: '0' }}>
              <FontAwesomeIcon icon={faSearch} />
            </Button>
          </InputGroup.Append>
        </InputGroup>
      </Form>
    );
  }
}