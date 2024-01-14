import { injectable } from "@theia/core/shared/inversify";
import { LocalizationContribution, LocalizationRegistry } from "@theia/core/lib/node/i18n/localization-contribution";
import { LanguageInfo } from "@theia/core/lib/common/i18n/localization";

@injectable()
export class FrontendLocalizationContribution implements LocalizationContribution {

    protected async getLanguageInformation(languageId: string, languageName: string, localizedLanguageName: string): Promise<LanguageInfo> {
        return {
            languageId: languageId,
            languageName: languageName,
            languagePack: true,
            localizedLanguageName: localizedLanguageName
        }
    }

    async registerLocalizations(registry: LocalizationRegistry): Promise<void> {
        registry.registerLocalizationFromRequire(await this.getLanguageInformation('en', 'English', 'English'), require('./i18n/en.json'));
        registry.registerLocalizationFromRequire(await this.getLanguageInformation('ru', 'Russian', 'Russian'), require('./i18n/ru.json'));
    }

}