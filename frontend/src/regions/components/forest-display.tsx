import React from "react";
import { RegionNode } from "../types";
import wikiStore from "../../data/store";
import { observer } from "mobx-react";
import './forest-display.css';
import { trace } from 'mobx';

interface ForestLevelProperties {
    regions: RegionNode[];
}
@observer
class ForestLevel extends React.Component<ForestLevelProperties> {

    handleChangeCheck = (node: RegionNode) => {
        node.isChecked = !node.isChecked;

        // Do not touch the actual tree display, as we want to keep unchecked nodes in the tree
        // and not delete them (deleting them will make it very hard for users to undo their action)
    }

    render = () => {
        trace();
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