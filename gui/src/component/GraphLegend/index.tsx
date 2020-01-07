import React from 'react';
import wikiStore from "../../data/store";
import { observer } from 'mobx-react';

@observer
export default class GraphLegend extends React.Component<{}, {}>{

    render() {
        // let result = wikiStore.ui.visualizationManager.visualiztionData;
        // console.log(result)
        return (
            <div>
            {/* {result.map(function(object, i){
               return <div className={"row"} key={i}> 
                          {[ object.type ,
                             // remove the key
                             <b className="fosfo" key={i}> {object.color} </b> , 
                             object.mode
                          ]}
                      </div>; 
             })} */}
            </div>
        );
    }
}