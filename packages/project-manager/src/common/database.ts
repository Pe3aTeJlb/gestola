export interface Database {
    tables: Table[];
}

export interface Table {
    name: string;
    type: string;
    columns: Column[];
}

export interface Column {
    table: string;
    name: string;
    type: string;
    notnull: boolean;
    pk: number;
    defVal: null | number | string;
    generatedAlways: boolean;
    virtual: boolean;
    stored: boolean;
}

export interface ColumnDescriptionRow {
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: null | number | string;
    pk: number;
    hidden: number;
}