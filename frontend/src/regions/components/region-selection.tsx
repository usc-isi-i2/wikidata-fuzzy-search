import React, { ChangeEvent } from "react";
import wikiStore from '../../data/store';
import { Button } from "react-bootstrap";
import { observer } from "mobx-react";
import './regions.css';
import { RegionNode } from "../types";
import PathLink from "./path-link";

interface RegionsSelectionProps {
    onPathChanged(newPath: RegionNode[]): void;
    onSave(regionArray: RegionNode[]): void;
}

@observer
export default class RegionsSelection extends React.Component<RegionsSelectionProps, {}> {
    constructor(props: RegionsSelectionProps) {
        super(props);
        // this.state = {

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

    onChangeHandler = (e: ChangeEvent<HTMLInputElement>) => {
        wikiStore.ui.region.filter = e.target.value;
        wikiStore.ui.region.addToFilterMap(e.target.value);
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
        const regions = wikiStore.ui.region.regionsForSelection;
        const regionMessage = regions.length > 0 ? '' : 'No regions';
        const filterValue = wikiStore.ui.region.filter ? wikiStore.ui.region.filter : '';
        const checkboxesList = regions.filter(option => option.name.toLowerCase().includes(wikiStore.ui.region.filter.toLowerCase()));
        const checkboxes = checkboxesList.map((node, index) => {
            return (
                <div className="col-3 region-all" key={`${node.qCode}`}>
                    <div className="region-checkbox">
                        <input type="checkbox" onChange={() => this.handleChangeCheck(node.qCode)}
                            id={node.qCode} checked={node.isChecked} />
                    </div>
                    <div className="region-list">
                        <PathLink region={node} onClick={this.handleRegionCick} noIcon={true} />
                    </div>
                </div>
            );
        });
        return (
            <div>
                <div>
                    <form className="form-inline">
                        <Button variant="primary" onClick={() => this.handleSelectAll(true)}>Select All</Button>
                        <Button variant="primary" onClick={() => this.handleSelectAll(false)}>Unselect All</Button>

                        <div className="form-group mb-2 region-filter">
                            <label>Filter: </label>
                            <input type="search" className="form-control" value={filterValue} onChange={this.onChangeHandler}></input>

                        </div>
                    </form>
                </div>
                <div>
                    {regionMessage}
                </div>
                <div className="selection-body">
                    <div className='row displayResult'>
                        {checkboxes}
                    </div>
                </div>
            </div>)
    }
}