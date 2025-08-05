import { URI } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { DatabaseBackendService } from '../common/protocol';
import * as db from "better-sqlite3";
import { Database as Connection } from 'better-sqlite3';
import { Column, ColumnDescriptionRow, Database, Table } from '../common/database';

@injectable()
export class DatabaseBackendServiceImpl implements DatabaseBackendService {

    private conn: Connection;

    async changeDBConnection(uri: URI): Promise<void> {
        console.log('create conn for ', uri);
        if(this.conn)this.conn.close();
        this.conn = db(uri.path.fsPath());
        return Promise.resolve();
    }

    async getDatabaseDescription(uri: URI): Promise<Database> {

        const cn = db(uri.path.fsPath());

        let description: Database = {
            tables: []
        } as Database;

        let tables = cn.prepare(
            `SELECT name, type FROM sqlite_master
                            WHERE (type='table' OR type='view')
                            AND name <> 'sqlite_sequence'
                            AND name <> 'sqlite_stat1'
                            ORDER BY type ASC, name ASC;`
        ).all();

        description.tables = tables.map((row: any) => {
            return {name: row.name, type: row.type, columns: [] } as Table;
        });

        for(let table of description.tables){

            let rows = cn.pragma(`table_xinfo('${table.name}')`) as [];
            
            if(rows.length > 0){
                rows
                    .filter((row: ColumnDescriptionRow) => {
                        return row.hidden !== 1;
                    })
                    .forEach((row: ColumnDescriptionRow) => {
                        const type = row.type
                            .toUpperCase()
                            .replace(/ ?GENERATED ALWAYS$/, '');
                        const virtual = row.hidden === 2;
                        const stored = row.hidden === 3;
                        const generatedAlways
                            = virtual
                            || stored
                            || / ?GENERATED ALWAYS$/.test(row.type.toUpperCase());
                        table.columns.push
                        ( {
                            table: table.name,
                            name: row.name,
                            type: type,
                            notnull: row.notnull === 1 ? true : false,
                            pk: row.pk,
                            defVal: row.dflt_value,
                            generatedAlways,
                            virtual,
                            stored,
                            } as Column
                        );
                    });
            }
        }

        cn.close();

        return Promise.resolve(description);

    }

    async getReportSampleDataFor(table: string): Promise<Object[]> {
        return  this.conn.prepare(
            `SELECT * FROM "${table}" LIMIT 1000;`
        ).all() as Object[];
    }

}