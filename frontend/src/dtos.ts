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
    admin: string;
    admin_id: string;
    country: string;
    country_id: string;
    admin1?: string
    admin1_id?: string;
    admin2?: string;
    admin2_id?: string;
    admin3?: string;
    admin3_id?: string;
    coordinate?: string;
}

export type RegionListResponseDTO = RegionResponseDTO[];
