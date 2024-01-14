import { ContainerModule } from '@theia/core/shared/inversify';
import { FrontendLocalizationContribution } from './backend-localization-contribution';
import { LocalizationContribution } from "@theia/core/lib/node/i18n/localization-contribution";

export default new ContainerModule(bind => {

    //Localization
    bind(FrontendLocalizationContribution).toSelf().inSingletonScope();
    bind(LocalizationContribution).toService(FrontendLocalizationContribution);

});
