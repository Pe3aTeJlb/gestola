import { ContainerModule } from '@theia/core/shared/inversify';
import { CustomLocalizationContribution } from './backend-localization-contribution';
import { LocalizationContribution } from "@theia/core/lib/node/i18n/localization-contribution";
import { ConnectionHandler, JsonRpcConnectionHandler } from '@theia/core/lib/common/messaging';
import { PROJECT_MANAGER_BACKEND_PATH, ProjectManagerBackendService, TemplateContribution } from '../common/protocol';
import { ProjectManagerBackendServiceImpl } from './project-manager-backend-service';
import { GestolaTemplateContribution } from './templates-contribution';
import { bindContributionProvider } from '@theia/core';

export default new ContainerModule(bind => {

    //Localization
    bind(CustomLocalizationContribution).toSelf().inSingletonScope();
    bind(LocalizationContribution).toService(CustomLocalizationContribution);

    bind(GestolaTemplateContribution).toSelf().inSingletonScope();
    bind(TemplateContribution).toService(GestolaTemplateContribution);

    bindContributionProvider(bind, TemplateContribution);
    bind(ProjectManagerBackendService).to(ProjectManagerBackendServiceImpl).inSingletonScope()
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new JsonRpcConnectionHandler(PROJECT_MANAGER_BACKEND_PATH, () => {
            return ctx.container.get<ProjectManagerBackendService>(ProjectManagerBackendService);
        })
    ).inSingletonScope();

});
