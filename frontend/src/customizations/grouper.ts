import { ScatterGroupingParams, PointGroup, Assignment, ScatterVisualizationParams } from './visualizations-params';
import { colors, markerSymbols, markerSizes } from './plots';
import { ColumnInfo, TimeSeriesResult } from '../queries/time-series-result';
import { TimePoint } from '../data/types';
import wikiStore from "../data/store";



export function groupForScatter(timeseries: TimeSeriesResult, groupParams: ScatterGroupingParams): PointGroup[] {
    // Note: This function performs in O(N*M), N - number of points, M number of groups. This may be too lengthy.
    // A better algorithm may be needed here (probably indexing points based on the three values, then scanning the index)
    const groups = createEmptyScatterGroups(groupParams);
    for (const pt of timeseries.points) {
        let foundGroup = false;
        for (const group of groups) {
            if (checkAssignment(group.assignment, pt)) {
                foundGroup = true;
                group.points.push(pt);
                break;
            }
        }

        if (!foundGroup) {
            console.warn(`Can't find group for pt ${JSON.stringify(pt)}`);
        }
    }

    return groups;
}

function checkAssignment(assignment: Assignment, pt: TimePoint) {
    for (const [key, assignmentValue] of Object.entries(assignment)) {
        if (pt[key] !== assignmentValue) {
            return false;
        }
    }

    return true;
}

function createEmptyScatterGroups(groupParams: ScatterGroupingParams): PointGroup[] {
    const colorSubs = getGroupSubassignments(groupParams.color, colors, wikiStore.ui.countryColorMap);
    const markerSymbolSubs = getGroupSubassignments(groupParams.markerSymbol, markerSymbols, wikiStore.ui.markerSymbolsMap);
    const markerSizeSubs = getGroupSubassignments(groupParams.markerSize, markerSizes,wikiStore.ui.markerSizeMap);

    const groups: PointGroup[] = [];
    for (const colorSub of colorSubs) {
        for (const markerSymbolSub of markerSymbolSubs) {
            for (const markerSizeSub of markerSizeSubs) {
                const params: ScatterVisualizationParams = {
                    color: colorSub.visualParamValue as string,
                    markerSymbol: markerSymbolSub.visualParamValue as string,
                    markerSize: markerSizeSub.visualParamValue as number,
                };
                const assignment: Assignment = {
                    ...colorSub.assignment,
                    ...markerSymbolSub.assignment,
                    ...markerSizeSub.assignment,
                };
                const group = new PointGroup(assignment, params);
                groups.push(group);
            }
        }
    }

    return groups;
}

interface Subassignment {
    visualParamValue: string | number,
    assignment: Assignment,
}
function fillSet(valuesMap: Map<string, string>){
    const valuesSet = new Set();
    Array.from(valuesMap.keys()).forEach(key => {
        let value = valuesMap.get(key);
        valuesSet.add(value);
     });
    return valuesSet;
}

function chooseOption(valuesSet, options){
    let counter = 0;
    while(counter<options.length){
        let random = options[Math.floor(Math.random()*options.length)];
        if(!valuesSet.has(random)){
            valuesSet.add(random);
            return [random, valuesSet];
        }
        counter +=1;
    }
    return [options[0], valuesSet] //need to check what is the default value if all options selected
}

function getGroupSubassignments(column: ColumnInfo | undefined, options: string[] | number[], valuesMap: Map<string, string>): Subassignment[] {
    if (!column || column.numeric) {
        return [ { 
            visualParamValue: options[0], 
            assignment: {} 
        }]
    };
    const subassignments: Subassignment[] = [];
    let selectedSet = fillSet(valuesMap);
    for(let i = 0; i < column.values.length; i++) {
        const timePointValue = column.values[i];
        let option: string | number;
        const mapKeys = Array.from(valuesMap.keys());
        if(!(mapKeys.includes(timePointValue)))
        { 
           [option, selectedSet] = chooseOption(selectedSet, options)
           valuesMap.set(timePointValue, option.toString());
           //valuesMap[timePointValue]=option.toString();
        }
        const visualParamValue = valuesMap.get(timePointValue);
        const assignment: Assignment = {}
        assignment[column.name] = timePointValue;
        const sub = {
            visualParamValue,
            assignment,
        }

        subassignments.push(sub);
    }

    return subassignments;
}