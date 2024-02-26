import { CreateLauncherCommandContribution } from './create-launcher-contribution';
import { ContainerModule } from '@theia/core/shared/inversify';
import { LauncherService } from './launcher-service';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';

export default new ContainerModule(bind => {
    bind(FrontendApplicationContribution).to(CreateLauncherCommandContribution);
    bind(LauncherService).toSelf().inSingletonScope();
});
