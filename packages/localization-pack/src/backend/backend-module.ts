import { ContainerModule } from '@theia/core/shared/inversify';
import { CustomLocalizationContribution } from './backend-localization-contribution';
import { LocalizationContribution } from "@theia/core/lib/node/i18n/localization-contribution";

export default new ContainerModule(bind => {

    //Localization
    bind(CustomLocalizationContribution).toSelf().inSingletonScope();
    bind(LocalizationContribution).toService(CustomLocalizationContribution);

});
