import { RegionNode } from "../types";
import React from "react";
import { faCaretRight } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import './path-link.css';

interface PathLinkProperties {
    region?: RegionNode;
    onClick(region?: RegionNode): void;
    noIcon?: boolean;
}

export default class PathLink extends React.Component<PathLinkProperties> {
    handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        this.props.onClick(this.props.region);
    }

    render = () => {
        return (
            <span className='path-link'>
                { this.props.noIcon ? '' : <FontAwesomeIcon icon={ faCaretRight }/> }
                <a href="#" onClick={this.handleClick}>{this.props.region?.name || 'Top'}</a>
            </span>
        );
    }
}
