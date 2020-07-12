import React from "react";
import { RegionNode } from "../types";
import wikiStore from "../../data/store";
import PathLink from "./path-link";
import { observer } from "mobx-react";

interface RegionsPathProps {
    onPathChanged(newPath: RegionNode[]): void;
}

@observer
export default class RegionsPath extends React.Component<RegionsPathProps> {
    handlePathLinkClick = (lastNode?: RegionNode) => {
        if (!lastNode) {
            this.props.onPathChanged([]);
            return;
        }

        const idx = wikiStore.ui.region.path.findIndex(n => n.qCode === lastNode.qCode);
        if (idx === -1) {
            console.warn('RegionsPath got a click event for non existant path node ', lastNode.name);
            return;
        }

        const newPath = wikiStore.ui.region.path.slice(0, idx + 1);
        this.props.onPathChanged(newPath);
    }

    render() {
        const path = wikiStore.ui.region.path;
        return (
            <div>
                <PathLink onClick={this.handlePathLinkClick} key="top"/>
                {path.map(node => <PathLink onClick={this.handlePathLinkClick} region={node} key={node.qCode} />)}
            </div>
        );
    }
}
