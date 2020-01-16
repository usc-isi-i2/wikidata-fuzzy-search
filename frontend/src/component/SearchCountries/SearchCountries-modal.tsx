import React from 'react';
import { Modal, ModalProps, Button } from 'react-bootstrap';
import { observer } from 'mobx-react';
import countryOptions from '../../config/countryOptions.json';
import Select from 'react-select';
import {Region} from '../../data/types';


interface SearchCountriesProps extends ModalProps {
    onSave(regionArray: [{label: string, value:string}]);
    onClose();
}
interface SearchCountriesModalState {
    region: Region;
    multiValue: [{label: string, value:string}],
}
@observer
export default class SearchCountriesModal extends React.Component<SearchCountriesProps, SearchCountriesModalState> {
    constructor(props){
        super(props);
        const defaultRegion = new Region('Q30', 'United States of America');
        this.state = {
            region: defaultRegion,
            multiValue: [{ label: 'United States of America', value: 'Q30' }],
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

    handleSave = () =>{
        this.props.onSave(this.state.multiValue);
    }

    handleClose = () => {
        this.props.onClose();
    }
    render = () => {
        return (
            <Modal {...this.props} size='lg'>
                <Modal.Header closeButton>
                    <Modal.Title>Choose countries</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                <div className="responsive-search-bar" style={{ minWidth: '50px', width: '30vw', maxWidth: 'auto' }}>
                        <Select
                            isMulti
                            options={countryOptions}
                            defaultValue={{ 'label': 'United States of America', 'value': 'Q30' }}
                            onChange={(selectedOption) => this.handleSwitchCountry(selectedOption)}                            
                        />
                    </div>

                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={this.handleClose}>Close</Button>
                    <Button variant="primary" onClick={this.handleSave}>Save changes</Button>
                </Modal.Footer>
            </Modal>
        )
    }
}
