import { injectable } from "@theia/core/shared/inversify";
import { LocalizationContribution, LocalizationRegistry } from "@theia/core/lib/node/i18n/localization-contribution";

@injectable()
export class CustomLocalizationContribution implements LocalizationContribution {

  async registerLocalizations(registry: LocalizationRegistry): Promise<void> {
    registry.registerLocalizationFromRequire('en', require('../../i18n/nls.en.json'));
    registry.registerLocalizationFromRequire('ru', require('../../i18n/nls.ru.json'));
  }

}