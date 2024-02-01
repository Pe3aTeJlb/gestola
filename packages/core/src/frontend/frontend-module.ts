import { ContainerModule } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { ProjectManager } from './project-manager/project-manager';

export default new ContainerModule((bind, _unbind) => {

    //Project Manager
    bind(FrontendApplicationContribution).toService(ProjectManager);
    bind(ProjectManager).toSelf().inSingletonScope();

});