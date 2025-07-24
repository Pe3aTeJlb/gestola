import { URI } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { DatabaseBackendService } from '../common/protocol';
//import Database = require('better-sqlite3');
import * as db from "better-sqlite3";

@injectable()
export class DatabaseBackendServiceImpl implements DatabaseBackendService {

    async createSQLiteConnection(uri: URI) {

        const a = db(uri.path.fsPath());
        console.log("kek lol", a.pragma('table_xinfo(test)'));

    }

}