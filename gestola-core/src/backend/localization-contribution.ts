import { LocalizationContribution, LocalizationRegistry } from '@theia/core/src/node/i18n/localization-contribution';

export class FrontendLocalizationContribution implements LocalizationContribution {
    async registerLocalizations(registry: LocalizationRegistry): Promise<void> {
        registry.registerLocalizationFromRequire('ru', require('./i18n/nls.ru.json'));
        registry.registerLocalizationFromRequire('en', require('./i18n/nls.en.json'));
    }
}