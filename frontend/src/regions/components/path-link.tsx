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
        if(this.props.region && this.props.region.final){
            return;
        }
        e.preventDefault();
        this.props.onClick(this.props.region);
    }
    render = () => {
        return (
           
            <span className='path-link'>
                { this.props.noIcon ? '' : <FontAwesomeIcon icon={ faCaretRight }/> }
                <label className={"pathLabel-" + (this.props.region?.final? "final" : "non-final")} onClick={this.handleClick}>{this.props.region?.name || 'World'}</label>
            </span>
        
        );
    }
}
