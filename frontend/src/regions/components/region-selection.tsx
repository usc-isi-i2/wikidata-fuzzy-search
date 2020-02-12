import React from "react";
import wikiStore from '../../data/store';
import { Button } from "react-bootstrap";
import { observer } from "mobx-react";
import './regions.css';

interface RegionsSelectionProps {
    onPathChanged()
    onSave(regionArray: {name: string, qCode:string, check: boolean}[])
}
interface RegionsSelectionState{
    countriesDesplayed: {name: string, check:boolean, qCode:string}[];
    filter: string;
}
@observer
export default class RegionsSelection extends React.Component<RegionsSelectionProps, RegionsSelectionState> {
    constructor(props){
        super(props);
        const allList = wikiStore.ui.allCountries.map(node => {
            return {name: node.name, qCode: node.qCode, check:false}
        })
        this.state = {
            countriesDesplayed: allList,
            filter: ''
        };
        this.onChangeHandler = this.onChangeHandler.bind(this);
        this.handleSelectAll = this.handleSelectAll.bind(this);

    }

    handleSave = () =>{
        let arr =  this.state.countriesDesplayed;
        for( var i = 0; i < arr.length; i++){ 
            if (!arr[i].check) {
              arr.splice(i, 1); 
            }
         }
        this.setState(state => {
            return {
                countriesDesplayed: arr
            };
          });
        this.props.onSave(this.state.countriesDesplayed);
    }

    handleChangeCheck = (e) => {
        const tmpList = this.state.countriesDesplayed;
        const index: number = tmpList.findIndex(x => x.qCode === e.target.id);
        const check: boolean = !tmpList[index].check;
        const regionNode = wikiStore.ui.region.nodes[e.target.id];
        if(check){
            wikiStore.ui.region.addPathToForest([regionNode]);
        }
        else {
            wikiStore.ui.region.removePathFromForest([regionNode]);
        }
        tmpList[index].check = check;
        this.setState({
                countriesDesplayed: tmpList
          });

    }

    handleSelectAll = value => e => {
        debugger
        const tmpList = this.state.countriesDesplayed;
        tmpList.forEach((node) => {
            node.check = value;
        });
        this.setState({
                countriesDesplayed: tmpList
          });
          console.log(this.state.countriesDesplayed)
    }
    onChangeHandler(e) {
        this.setState({
            filter: e.target.value,
        });
    }
    render() {
        const checkboxData = this.state.countriesDesplayed.filter(option => option.name.toLowerCase().includes(this.state.filter)).map((node, index) => {
            return (
                <div className="col-4" key={`${node.qCode}_{objectLabel}`} style={{ display: 'inline-flex'}}>
                    <input className='checkbox' type="checkbox" onClick={this.handleChangeCheck}
                        id={node.qCode} defaultChecked={node.check}/>
                    <label>{node.name}</label>
                </div>
            );
        });
        const optionsRow: JSX.Element =
            <div>
                <Button variant="primary" className="button" onClick={this.handleSelectAll(true)}>Select all</Button>
                <Button  variant="primary" className="button" onClick={this.handleSelectAll(false)}>unSelect all</Button>
                <label>Filter</label>
                <input type="text" onChange={this.onChangeHandler}></input>
                
            </div>
        return (
            <div>
                <div className="row">
                    {optionsRow}
                </div>
                <div className='displayResult'>
                    {checkboxData}
                </div>
            </div>)
    }
}