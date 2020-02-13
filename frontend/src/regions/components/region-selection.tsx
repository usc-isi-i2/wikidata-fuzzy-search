import React, { ChangeEvent } from "react";
import wikiStore from '../../data/store';
import { Button } from "react-bootstrap";
import { observer } from "mobx-react";
import './regions.css';
import { RegionNode } from "../types";
import {trace} from 'mobx';
import PathLink from "./path-link";

interface RegionsSelectionProps {
    onPathChanged(newPath: RegionNode[]): void;
    onSave(regionArray: RegionNode[]): void;
}
interface RegionsSelectionState {
    filter: string;
}
@observer
export default class RegionsSelection extends React.Component<RegionsSelectionProps, RegionsSelectionState> {
    constructor(props:RegionsSelectionProps) {
        super(props);
        this.state = {
            filter: '',
        };
        this.onChangeHandler = this.onChangeHandler.bind(this);
        this.handleSelectAll = this.handleSelectAll.bind(this);
    }

    handleChangeCheck = (qCode: string) => {
        const list = [...wikiStore.ui.region.regionsForSelection];
        const index: number = list.findIndex(x => x.qCode === qCode);
        list[index].isChecked = !list[index].isChecked;
        wikiStore.ui.region.regionsForSelection = list;
        this.updateForest(list[index]);
    }

    handleSelectAll = (value: boolean) => {
        const list = [...wikiStore.ui.region.regionsForSelection];
        list.forEach((node) => {
            node.isChecked = value;
            this.updateForest(node);
        });
        wikiStore.ui.region.regionsForSelection = list;
    }

    updateForest = (node: RegionNode) => {
        // Update the forest once node's check box has changed
        const path = [...wikiStore.ui.region.path, node];
        if (node.isChecked) {
            wikiStore.ui.region.addPathToForest(path);
        } else {
            wikiStore.ui.region.removePathFromForest(path);
        }
    }

    onChangeHandler= (e: ChangeEvent<HTMLInputElement>) => {
        this.setState({
            filter: e.target.value,
        });
    }

    handleRegionCick = (region?: RegionNode) => {
        if (!region) {
            console.warn('Got an undefined region in handleRegionClick');
            return;
        }

        const newPath = [...wikiStore.ui.region.path, region];
        this.props.onPathChanged(newPath);
    }

    render() {
        trace();
        // TODO:
        // Break into two - first filter countries, then build checkboxes
        // key is node.qCode, no inline-style (use CSS)
        const regions = wikiStore.ui.region.regionsForSelection;
        const checkboxesList = regions.filter(option => option.name.toLowerCase().includes(this.state.filter.toLowerCase()));
        const checkboxes = checkboxesList.map((node, index) => {
            return (
                <div className="col-4 checkboxes" key={`${node.qCode}`}>
                    <input className='checkbox' type="checkbox" onChange={() => this.handleChangeCheck(node.qCode)}
                        id={node.qCode} checked={node.isChecked} />
                    <PathLink region={node} onClick={this.handleRegionCick} noIcon={true} />
                </div>
            );
        });
        return (
            <div className="selection-body">
            <div className="row">
                <Button variant="primary" className="button" onClick={() => this.handleSelectAll(true)}>Select All</Button>
                <Button variant="primary" className="button" onClick={() => this.handleSelectAll(false)}>Unselect All</Button>
                <label>Filter: </label>
                <input type="text" onChange={this.onChangeHandler}></input>

            </div>
                <div className='row displayResult'>
                    {checkboxes}
                </div>
            </div>)
    }
}