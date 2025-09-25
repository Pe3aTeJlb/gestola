import { ContainerModule } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution, PreferenceContribution, WebSocketConnectionProvider } from '@theia/core/lib/browser';
import { ProjectManager } from './project-manager';
import { DATABASE_BACKEND_PATH, DatabaseBackendService, PROJECT_MANAGER_BACKEND_PATH, ProjectManagerBackendService } from '../common/protocol';
import { projectPreferenceSchema } from './preferences';

export default new ContainerModule((bind, _unbind) => {

    //Project Manager
    bind(FrontendApplicationContribution).toService(ProjectManager);
    bind(ProjectManager).toSelf().inSingletonScope();

    bind(ProjectManagerBackendService).toDynamicValue(ctx => {
        const connection = ctx.container.get(WebSocketConnectionProvider);
        return connection.createProxy<ProjectManagerBackendService>(PROJECT_MANAGER_BACKEND_PATH);
    }).inSingletonScope();

    bind(DatabaseBackendService).toDynamicValue(ctx => {
        const connection = ctx.container.get(WebSocketConnectionProvider);
        return connection.createProxy<DatabaseBackendService>(DATABASE_BACKEND_PATH);
    }).inSingletonScope();

    
    bind(PreferenceContribution).toConstantValue(
        {
            schema: projectPreferenceSchema
        }
    );

});