/*
 * Time definition of objects passed to and from the backend.
 */

export interface SPARQLQueryLoggerDTO {
    queries?: string[]
}

export interface ColumnInfoDTO {
    name: string;
    numeric: boolean;
}

export interface TimePointDTO {
    point_in_time: string;
    value: number;
    countryLabel: string;
}

export interface TimeSeriesResultDTO  extends SPARQLQueryLoggerDTO {
    columns: ColumnInfoDTO[];
    points: TimePointDTO[];
}