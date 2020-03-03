import { ScatterGroupingParams, PointGroup, Assignment, ScatterVisualizationParams, ScatterGroupingParamKeys, ScatterVisualizationParamAssignment } from './visualizations-params';
import { colors, markerSymbols, markerSizes } from './plots';
import { ColumnInfo, TimeSeriesResult } from '../queries/time-series-result';
import { TimePoint } from '../data/types';
import { shuffleArray, cartesianProduct } from '../utils';
import wikiStore from '../data/store';



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

        if (!foundGroup && groups.length >0) {
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
    const pointFieldMap = getPointFieldToVisFieldMapping(groupParams);
    // pointFieldMap contains a mapping from point-field (countryLabel) to visuzalization fields (color, markerSymbol)
    // all based on the selection of the cusotmization dialog
    
    const pointToAssignment = getPointFieldValueToAssignments(pointFieldMap);
    // pointToAssignment contains a mapping from a point-view value ( { countryLabel: 'israel' }) - for each point view field
    // that needs grouping:
    // countryLabel:
    //      united-states: { color: blue }  <--- there can be more than one field, based on the modal
    //      israel: { color: green, markerSymbol: circle }  <-- for example
    // determinationLabel:
    //      consensus: {markerSymbol: circle}
    //      estimation: {markerSymbol: square}
    //      unknown: {markerSymbol: triangle}

    // Now we need to look at the cartesian product of all entries in pfv2as (all countryLabels and 
    // determinationLabels above), to create the point groups
    const groups = gatherPointGroups(pointToAssignment);

    // There may be no groups at all (in case no field was specified in the customizations dialog),
    // in which case we add just one default group for everything
    if (!groups) {
        return [new PointGroup({}, { color: colors[0], markerSymbol: markerSymbols[0], markerSize: markerSizes[0] })];
    }

    return groups;
}

// All the possible visualization values - all colors, all markerSymbols, all markerSizes.
// The values are ScatterVisualizationParamAssigment (for instance { color: blue } or {markerSymbol: circle} )
const allVisValues: { [key: string]: ScatterVisualizationParamAssignment[] } = {
    color: colors.map(c => { return { color: c }; }),
    markerSymbol: markerSymbols.map(ms => { return { markerSymbol: ms } }),
    markerSize: markerSizes.map(ms => { return{ markerSize: ms } }),
};

// Get all the visual param fields relevant to one point field. For instance: countryLabel: ['color', 'markerSymbol']
type PointFieldToVisFields = Map<ColumnInfo, ScatterGroupingParamKeys[]>;
function getPointFieldToVisFieldMapping(groupParams: ScatterGroupingParams): PointFieldToVisFields {
    const pointFieldToVisFields = new Map<ColumnInfo, ScatterGroupingParamKeys[]>();

    function addPair(pointField: ColumnInfo | undefined, visField: ScatterGroupingParamKeys) {
        if(pointField) {
            const existing = pointFieldToVisFields.get(pointField) || [];
            pointFieldToVisFields.set(pointField, [...existing, visField]);
        }
    }

    addPair(groupParams.color, 'color');
    addPair(groupParams.markerSize, 'markerSize');
    addPair(groupParams.markerSymbol, 'markerSymbol');

    return pointFieldToVisFields;
}

// Return all the possible visual parameter assigments - for each point field. For instance:
// countryLabel: { 'united states': { color: blue, markerSize: 8 }, 'denmark': { ... } }
// otherQualifierLabel: { 'qualifierValue': { markerSymbol: 'circle' }}
// ...
// It is guaranteed that entries from two point fields will not have the same visual parameter assigments - color
// will only appear in one field, markerSymbol in one, etc...
type PointFieldToVisFieldAssignment = Map<ColumnInfo, { [key: string]: ScatterVisualizationParamAssignment }>;
function getPointFieldValueToAssignments(pf2vfs: PointFieldToVisFields): PointFieldToVisFieldAssignment {
    const results: PointFieldToVisFieldAssignment = new Map<ColumnInfo, { [key: string]: ScatterVisualizationParamAssignment }>();

    for (const [pointField, visFields] of pf2vfs.entries()) {
        const visOptions = getVisOptions(visFields);
        const pointDict: { [key: string]: ScatterVisualizationParamAssignment } = {};
        for(let i = 0; i < pointField.values.length; i++) {
            if(!(wikiStore.ui.customiztionsCache.getCountryData(pointField.values[i]))) {
                wikiStore.ui.customiztionsCache.setCountryData(pointField.values[i], visOptions[i % visOptions.length]);
            }
            pointDict[pointField.values[i]] =  wikiStore.ui.customiztionsCache.getCountryData(pointField.values[i]);
        }
        results.set(pointField, pointDict);
    }

    return results;
}

// Returns all the possible assignments of visual fields. If visFields has one field, basically returns
// the assignments of the cartesian products of all visField values.
// visFields can be ['color'] or ['color', 'markerSize'], etc..
// Return value is an array of all possible assignments for the visual fields in visFields, at a random order.
function getVisOptions(visFields: ScatterGroupingParamKeys[]) {
    const assignments: ScatterVisualizationParamAssignment[] = [];

    // assignmentArrays is [[first-color, second-color, third-color, ...], [first-symbol, second-symbol, ...], [first-marker-size, ...]]
    const assignmentArrays = visFields.map(vf => allVisValues[vf]);

    // Instead of messing with recursive iterators, we just limit the number of available arrays to 4
    while(assignmentArrays.length < 4) {
        assignmentArrays.push([ {} ]);
    }

    for(const a1 of assignmentArrays[0]) {
        for (const a2 of assignmentArrays[1]) {
            for (const a3 of assignmentArrays[2]) {
                for (const a4 of assignmentArrays[3]) {
                    const combined = {
                        ...a1, ...a2, ...a3, ...a4
                    };
                    assignments.push(combined);
                }
            }
        }
    }

    shuffleArray(assignments);
    return assignments;
}

function gatherPointGroups(pf2assignments: PointFieldToVisFieldAssignment): PointGroup[] {
    const pointFields = [...pf2assignments.keys()];
    if (pointFields.length === 0) {
        return [];
    }
    const pointFieldValues = pointFields.map(pf => pf.values);
    if (pointFieldValues.length === 1) {
        pointFieldValues.push([]);
    }

    // Now we now pointFieldValues has at least two elements
    const product: any[] = cartesianProduct(pointFieldValues[0], pointFieldValues[1], ...pointFieldValues.slice(2));
    // Each product entry is an array with pointFieldValues. If pointFields is [country, determinationMethod] product[0]
    // can be ['israel', undefined], product[1] ['israel', 'estimation'] and so on.
    
    // product contains an array of elements [fieldVal0, fieldVal1, fieldVal2, fieldVal3, ...],
    // with fieldValX being a field value of the X's pointField. Each such array turns into one PointGroup
    const groups: PointGroup[] = [];
    for(const fieldValues of product) {
        const assignment: Assignment = {};
        const visualParams: ScatterVisualizationParams = {  // Set defaults for all fields
            color: colors[0],
            markerSymbol: markerSymbols[0],
            markerSize: markerSizes[0]
        };

        for(let i=0; i<fieldValues.length; i++) {
            assignment[pointFields[i].name] = fieldValues[i];
            // partialVisualAssignment can be { color: blue } for instance
            const partialVisualAssignment = pf2assignments.get(pointFields[i])[fieldValues[i]];
            for(const [key, value] of Object.entries(partialVisualAssignment)) {
                visualParams[key] = value;
            }
        }
        groups.push(new PointGroup(assignment, visualParams))
    }

    return groups;
}
