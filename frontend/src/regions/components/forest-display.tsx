import React from "react";
import { RegionNode } from "../types";
import wikiStore from "../../data/store";
import { ListGroup } from "react-bootstrap";
import { observer } from "mobx-react";

interface ForestLevelProperties {
    regions: RegionNode[];
}

class ForestLevel extends React.Component<ForestLevelProperties> {
    render = () => {
        if (this.props.regions.length === 0) {
            return '';
        }

        return(
            <ListGroup>
                { this.props.regions.map(r => { return (
                    <ListGroup.Item key={r.qCode}>
                        { r.name }
                        <ForestLevel regions={r.displayedChildren}/>
                    </ListGroup.Item>
                )}) } 
            </ListGroup>
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