import { ContainerModule } from '@theia/core/shared/inversify';
import { CustomLocalizationContribution } from './backend-localization-contribution';
import { LocalizationContribution } from "@theia/core/lib/node/i18n/localization-contribution";
import { ConnectionHandler, JsonRpcConnectionHandler } from '@theia/core/lib/common/messaging';
import { DATABASE_BACKEND_PATH, DatabaseBackendService, PROJECT_MANAGER_BACKEND_PATH, ProjectManagerBackendService, ProjectTemplateContribution, SolutionTemplateContribution } from '../common/protocol';
import { PROJECT_SERVICE_PATH, ProjectService } from '../common/protocol';
import { ProjectManagerBackendServiceImpl } from './project-manager-backend-service';
import { GestolaProjectTemplateContribution } from './project-templates-contribution';
import { bindContributionProvider } from '@theia/core';
import { DatabaseBackendServiceImpl } from './databse-backend-service';
import { GestolaSolutionTemplateContribution } from './solution-templates-contribution';

export default new ContainerModule(bind => {

    console.log("Launch dir", __dirname);

    //Localization
    bind(CustomLocalizationContribution).toSelf().inSingletonScope();
    bind(LocalizationContribution).toService(CustomLocalizationContribution);

    bind(GestolaProjectTemplateContribution).toSelf().inSingletonScope();
    bind(ProjectTemplateContribution).toService(GestolaProjectTemplateContribution);

    bind(GestolaSolutionTemplateContribution).toSelf().inSingletonScope();
    bind(SolutionTemplateContribution).toService(GestolaSolutionTemplateContribution);

    bind(ProjectManagerBackendServiceImpl).toSelf().inSingletonScope();

    bindContributionProvider(bind, ProjectTemplateContribution);
    bindContributionProvider(bind, SolutionTemplateContribution);
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
