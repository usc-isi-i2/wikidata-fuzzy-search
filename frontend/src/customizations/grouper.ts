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
    debugger
    const colorSubs = getGroupSubassignments(groupParams.color, colors);
    const markerSymbolSubs = getGroupSubassignments(groupParams.markerSymbol, markerSymbols);
    const markerSizeSubs = getGroupSubassignments(groupParams.markerSize, markerSizes);

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

function getGroupSubassignments(column: ColumnInfo | undefined, options: string[] | number[]): Subassignment[] {
    if (!column || column.numeric) {
        return [ { 
            visualParamValue: options[0], 
            assignment: {} 
        }]
    };

    const subassignments: Subassignment[] = [];

    for(let i = 0; i < column.values.length; i++) {
        debugger
        const timePointValue = column.values[i];
        let visualParamValue;
        if(timePointValue in wikiStore.ui.countryColorMap){
            visualParamValue = wikiStore.ui.countryColorMap[timePointValue];
        }
        else 
        {
            visualParamValue= options[i];
            wikiStore.ui.countryColorMap[timePointValue] = visualParamValue;
        }

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