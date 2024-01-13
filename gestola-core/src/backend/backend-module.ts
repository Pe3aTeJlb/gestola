import { ContainerModule } from '@theia/core/shared/inversify';
import { LocalizationContribution } from '@theia/core/src/node/i18n/localization-contribution';
import { FrontendLocalizationContribution } from './localization-contribution';

export default new ContainerModule(bind => {

    //Localization
    bind(FrontendLocalizationContribution).toSelf().inSingletonScope();
    bind(LocalizationContribution).toService(FrontendLocalizationContribution);

});
