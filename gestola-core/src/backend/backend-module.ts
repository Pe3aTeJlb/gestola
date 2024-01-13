import { ContainerModule } from '@theia/core/shared/inversify';
import { LocalizationContribution } from '@theia/core/src/node/i18n/localization-contribution';
import { FrontendLocalizationContribution } from './frontend-localization-contribution';
import { ProjectManager } from './project-manager/project-manager';
import { BackendApplicationContribution } from '@theia/core/lib/node/backend-application';

export default new ContainerModule(bind => {

    //Localization
    bind(FrontendLocalizationContribution).toSelf().inSingletonScope();
    bind(LocalizationContribution).toService(FrontendLocalizationContribution);

    //Project Manager
    bind(ProjectManager).toSelf().inSingletonScope();
    bind(BackendApplicationContribution).toService(ProjectManager);

});
