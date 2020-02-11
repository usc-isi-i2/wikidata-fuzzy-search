import React from "react";
import wikiStore from '../../data/store';

interface RegionsSelectionProps {
    onPathChanged()
    }
export default class RegionsSelection extends React.Component<RegionsSelectionProps> {
  render() {
      debugger
      const tempArray = wikiStore.ui.region.displayedRegions;
    return tempArray.map(function(node){
        return <div className ="col-4" key={`${node.qCode}_{objectLabel}`} style={{display:'inline-flex'}}>
        <input className ='checkbox' type="checkbox" defaultChecked={node.isChecked} 
         id={node.name} />
        <label>{node.name}</label>
    </div>
    })
  }
}