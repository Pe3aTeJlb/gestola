import { URI } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { DatabaseBackendService } from 'src/common/protocol';
import { open, Database } from 'sqlite';

@injectable()
export class DatabaseBackendServiceImpl implements DatabaseBackendService {

    async createSQLiteConnection(uri: URI): Promise<Database>{

        return open({
            filename: uri.path.fsPath(),
            driver: Database
        })

    }

}