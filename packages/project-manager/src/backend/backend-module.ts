import { ContainerModule } from '@theia/core/shared/inversify';
import { CustomLocalizationContribution } from './backend-localization-contribution';
import { LocalizationContribution } from "@theia/core/lib/node/i18n/localization-contribution";
import { ConnectionHandler, JsonRpcConnectionHandler } from '@theia/core/lib/common/messaging';
import { DATABASE_BACKEND_PATH, DatabaseBackendService, PROJECT_MANAGER_BACKEND_PATH, ProjectManagerBackendService, TemplateContribution } from '../common/protocol';
import { PROJECT_SERVICE_PATH, ProjectService } from '../common/protocol';
import { ProjectManagerBackendServiceImpl } from './project-manager-backend-service';
import { GestolaTemplateContribution } from './templates-contribution';
import { bindContributionProvider } from '@theia/core';
import { DatabaseBackendServiceImpl } from './databse-backend-service';

export default new ContainerModule(bind => {

    //Localization
    bind(CustomLocalizationContribution).toSelf().inSingletonScope();
    bind(LocalizationContribution).toService(CustomLocalizationContribution);

    bind(GestolaTemplateContribution).toSelf().inSingletonScope();
    bind(TemplateContribution).toService(GestolaTemplateContribution);

    bind(ProjectManagerBackendServiceImpl).toSelf().inSingletonScope();

    bindContributionProvider(bind, TemplateContribution);
    bind(ProjectManagerBackendService).toService(ProjectManagerBackendServiceImpl);
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new JsonRpcConnectionHandler(PROJECT_MANAGER_BACKEND_PATH, () => {
            return ctx.container.get<ProjectManagerBackendService>(ProjectManagerBackendService);
        })
    ).inSingletonScope();

    bind(ProjectService).toService(ProjectManagerBackendServiceImpl);
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new JsonRpcConnectionHandler(PROJECT_SERVICE_PATH, () => {
            return ctx.container.get<ProjectService>(ProjectService);
        })
    ).inSingletonScope();

    bind(DatabaseBackendService).to(DatabaseBackendServiceImpl).inSingletonScope();
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new JsonRpcConnectionHandler(DATABASE_BACKEND_PATH, () => {
            return ctx.container.get<DatabaseBackendService>(DatabaseBackendService);
        })
    ).inSingletonScope();

});
