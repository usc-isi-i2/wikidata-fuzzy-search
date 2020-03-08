import React from "react";
import { RegionNode } from "../types";
import wikiStore from "../../data/store";
import { observer } from "mobx-react";
import './forest-display.css';
import { trace } from 'mobx';

interface ForestLevelProperties {
    regions: RegionNode[];
}

class ForestLevel extends React.Component<ForestLevelProperties> {

    handleChangeCheck = (node: RegionNode) => {
        node.isChecked = !node.isChecked;
        wikiStore.ui.region.refreshForest(); // Just cause the forest display to refresh
    }

    render = () => {
        if (this.props.regions.length === 0) {
            return '';
        }
        return(
            <ul className="tree">
                { this.props.regions.map(r => { return (
                    <li key={r.qCode}>
                         <input type="checkbox" className="region-check-tree" checked={r.isChecked} 
                         onChange={() => this.handleChangeCheck(r)}/>
                        { r.name }
                        <ForestLevel regions={r.displayedChildren}/>
                    </li>
                )}) } 
            </ul>
        )
    }
}

@observer
export default class ForestDisplay extends React.Component {
    render() {
        return (
            <ForestLevel regions={wikiStore.ui.region.selectedForest}/>
        );
    }
}