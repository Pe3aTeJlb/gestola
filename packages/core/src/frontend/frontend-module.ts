import { ContainerModule } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution, WebSocketConnectionProvider } from '@theia/core/lib/browser';
import { ProjectManager } from './project-manager/project-manager';
import { PROJECT_MANAGER_BACKEND_PATH, ProjectManagerBackendService } from '../backend/project-manager-backend-service-protocol';

export default new ContainerModule((bind, _unbind) => {

    //Project Manager
    bind(FrontendApplicationContribution).toService(ProjectManager);
    bind(ProjectManager).toSelf().inSingletonScope();

    bind(ProjectManagerBackendService).toDynamicValue(ctx => {
        const connection = ctx.container.get(WebSocketConnectionProvider);
        return connection.createProxy<ProjectManagerBackendService>(PROJECT_MANAGER_BACKEND_PATH);
    }).inSingletonScope();

});