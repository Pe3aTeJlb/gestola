import { ContainerModule } from '@theia/core/shared/inversify';
import { BackendApplicationContribution } from '@theia/core/lib/node/backend-application';
import { VeribleBinManager } from './veribleBinManager';

export default new ContainerModule(bind => {
  
    bind(VeribleBinManager).toSelf().inSingletonScope();
    bind(BackendApplicationContribution).toService(VeribleBinManager);

});
