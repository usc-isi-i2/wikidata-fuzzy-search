import { ScatterGroupingParams, PointGroup, Assignment } from './visualizations-params';
import { colors, markerSymbols, markerSizes } from './plots';
import { ColumnInfo } from '../queries/time-series-result';

export function createScatterGroups(groupParams: ScatterGroupingParams): PointGroup[] {
    const colorValues = getGroupValues(groupParams.color, colors, 'color');
    const markerSymbolValues = getGroupValues(groupParams.markerSymbol, markerSymbols, 'markerSymbol');
    const markerSizeValues = getGroupValues(groupParams.markerSize, markerSizes, 'markerSize');

    return [];
}

function getGroupValues(column: ColumnInfo | undefined, options: string[], propName: string): Assignment[] {
    if (!column) {
        return []
    };

    const assignments: Assignment[] = [];

    for(let i = 0; i < column.values.length; i++) {
        const timePointValue = column.values[i];
        const visualizationParamValue = options[i];

        const assignment: Assignment = {}
        assignment.timePointValue = visualiationParamValue;
    }
}