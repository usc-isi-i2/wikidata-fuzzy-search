import React from 'react';
import { Modal, ModalProps, Button } from 'react-bootstrap';
import { observer } from 'mobx-react';
import Select from 'react-select';
import './SearchCountries.css';
import { Region } from '../../regions/types.js';
import wikiStore from '../../data/store';

interface SearchCountriesProps extends ModalProps {
    onSave(regionArray: [{label: string, value:string, check: boolean}]);
    onClose();
}
interface SearchCountriesModalState {
    region: Region;
    multiValue: [{label: string, value:string, check:boolean}],
}
@observer
export default class SearchCountriesModal extends React.Component<SearchCountriesProps, SearchCountriesModalState> {
    constructor(props){
        super(props);
        const defaultRegion: Region = { qCode: 'Q30', name: 'United States of America', level: 'country'};
        this.state = {
            region: defaultRegion,
            multiValue: [{ label: 'United States of America', value: 'Q30', check:true }],
        };
    }

    handleSwitchCountry = (selectedOption: any) => {
        let tmpValue = this.state.multiValue;
        if (!(this.state.multiValue.find(x => x.label === selectedOption.label))) {
            tmpValue.push({label:selectedOption.label, value: selectedOption.value, check: true})
            this.setState(state => {
                return {
                  multiValue: tmpValue
                };
              });
        }
       
    }

    handleSave = () =>{
        let arr =  this.state.multiValue;
        for( var i = 0; i < arr.length; i++){ 
            if (!arr[i].check) {
              arr.splice(i, 1); 
            }
         }
        this.setState(state => {
            return {
              multiValue: arr
            };
          });
        this.props.onSave(this.state.multiValue);
    }
    handleChangeCheck = (e) => {
        // let updateMultiVal = this.state.multiValue.map(x => x.label == e.target.id ? {
        //     ...x, check:!x.check
        // }:x);
        let tmpMultiList = this.state.multiValue;
        let index: number = this.state.multiValue.findIndex(x => x.label === e.target.id);
        tmpMultiList[index].check = !tmpMultiList[index].check;

        this.setState(state => {
            return {
              multiValue: tmpMultiList
            };
          });
        
    }

    countryOptions = () => {
        return wikiStore.ui.allCountries.map(c => {
            return { label: c.name, value: c.qCode };
        });
    }

    render = () => {
        const checkboxData = this.state.multiValue.map((object, index) => {
            return(
            <div className ="col-4" key={`${object.label}_{objectLabel}`} style={{display:'inline-flex'}}>
            <input className ='checkbox' type="checkbox" defaultChecked={object.check} onChange={this.handleChangeCheck} id={object.label}/>
            <label>{object.label}</label>
        </div>
            );
        });
        const countryOptions = this.countryOptions();
        
        // const handleSave = this.props.onSave;
        return (
            <Modal show={this.props.show} onHide = {this.props.onClose} size='lg'>
                <Modal.Header closeButton>
                    <Modal.Title>Choose regions</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                <div className="responsive-search-bar">
                        <Select
                            options={countryOptions}
                            onChange={(selectedOption) => this.handleSwitchCountry(selectedOption)}                            
                        />
                    </div>
                    <div className ='displayResult'>
                        {checkboxData}
                    </div>

                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={this.handleSave}>Close</Button>
                </Modal.Footer>
            </Modal>
        )
    }
}
