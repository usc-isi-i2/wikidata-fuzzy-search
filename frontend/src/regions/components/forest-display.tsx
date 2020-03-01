import React from "react";
import { RegionNode } from "../types";
import wikiStore from "../../data/store";
import { ListGroup } from "react-bootstrap";
import { observer } from "mobx-react";
import './forest-display.css';

interface ForestLevelProperties {
    regions: RegionNode[];
}
class ForestLevel extends React.Component<ForestLevelProperties> {

    handleChangeCheck = (node: RegionNode) => {
        const path = [...wikiStore.ui.region.path, node];
        wikiStore.ui.region.removePathFromForest(path);
    }

    render = () => {
        if (this.props.regions.length === 0) {
            return '';
        }
        const tmp = this.props.regions;

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