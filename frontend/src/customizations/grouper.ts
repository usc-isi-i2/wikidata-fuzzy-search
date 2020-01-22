import { ScatterGroupingParams, PointGroup, Assignment, ScatterVisualizationParams } from './visualizations-params';
import { colors, markerSymbols, markerSizes } from './plots';
import { ColumnInfo } from '../queries/time-series-result';
import { TimePoint } from '../data/types';
import wikiStore from '../data/store';

function groupForScatter(groupParams: ScatterGroupingParams): PointGroup[] {
    // Note: This function performs in O(N*M), N - number of points, M number of groups. This may be too lengthy.
    // A better algorithm may be needed here (probably indexing points based on the three values, then scanning the index)
    const groups = createEmptyScatterGroups(groupParams);

    for (const pt of wikiStore.timeSeries.result.points) {
        let foundGroup = false;

        for (const group of groups) {
            if (checkAssignment(group, pt)) {
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
    const colorValues = getGroupValues(groupParams.color, colors, 'color');
    const markerSymbolValues = getGroupValues(groupParams.markerSymbol, markerSymbols, 'markerSymbol');
    const markerSizeValues = getGroupValues(groupParams.markerSize, markerSizes, 'markerSize');

    const groups: PointGroup[] = [];
    for (const colorValue of colorValues) {
        for (const markerSymbolValue of markerSymbolValues) {
            for (const markerSizeValue of markerSizeValues) {
                const params: ScatterVisualizationParams = {
                    color: colorValue ? colorValue.color : colors[0],
                    markerSymbol: markerSymbolValue ? markerSymbolValue.markerSymbol : markerSymbols[0],
                    markerSize: markerSizeValue ? markerSizeValue.markerSize : markerSizes[0],
                };
                const assignment: Assignment = {
                    ...colorValue,
                    ...markerSymbolValue,
                    ...markerSizeValue
                };
                const group = new PointGroup(assignment, params);
                groups.push(group);
            }
        }
    }

    return groups;
}

function getGroupValues(column: ColumnInfo | undefined, options: any[], propName: string): Assignment[] {
    if (!column || column.numeric) {
        return [ {} ]
    };

    const assignments: Assignment[] = [];

    for(let i = 0; i < column.values.length; i++) {
        const timePointValue = column.values[i];
        const visualizationParamValue = options[i];

        const assignment: Assignment = {}
        assignment.timePointValue = visualizationParamValue;
    }
}