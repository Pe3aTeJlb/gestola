import { ContainerModule } from '@theia/core/shared/inversify';
import { CustomLocalizationContribution } from './backend-localization-contribution';
import { LocalizationContribution } from "@theia/core/lib/node/i18n/localization-contribution";
import { ConnectionHandler, JsonRpcConnectionHandler } from '@theia/core/lib/common/messaging';
import { PROJECT_MANAGER_BACKEND_PATH, ProjectManagerBackendService } from './project-manager-backend-service-protocol';
import { ProjectManagerBackendServiceImpl } from './project-manager-backend-service';

export default new ContainerModule(bind => {

    //Localization
    bind(CustomLocalizationContribution).toSelf().inSingletonScope();
    bind(LocalizationContribution).toService(CustomLocalizationContribution);

    bind(ProjectManagerBackendService).to(ProjectManagerBackendServiceImpl).inSingletonScope()
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new JsonRpcConnectionHandler(PROJECT_MANAGER_BACKEND_PATH, () => {
            return ctx.container.get<ProjectManagerBackendService>(ProjectManagerBackendService);
        })
    ).inSingletonScope();

});
