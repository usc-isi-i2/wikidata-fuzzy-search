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

export interface RegionDTO {
    label: string;
    value: string;
}

export interface RegionResponseDTO {
    country?: string;
    admin1?: string;
    admin2?: string;
    admin3?: string;
    regions: RegionDTO[];
}
