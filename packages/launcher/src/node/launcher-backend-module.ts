import { ContainerModule } from '@theia/core/shared/inversify';
import { TheiaLauncherServiceEndpoint } from './launcher-endpoint';
import { BackendApplicationContribution } from '@theia/core/lib/node/backend-application';

export default new ContainerModule(bind => {
    bind(TheiaLauncherServiceEndpoint).toSelf().inSingletonScope();
    bind(BackendApplicationContribution).toService(TheiaLauncherServiceEndpoint);
});
