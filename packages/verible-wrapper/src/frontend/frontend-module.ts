import { ContainerModule } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { VeriblePrefsManager } from './prefsManager';

export default new ContainerModule((bind, _unbind) => {

    bind(VeriblePrefsManager).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(VeriblePrefsManager);

});