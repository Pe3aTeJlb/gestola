import { ContainerModule } from '@theia/core/shared/inversify';
import { GestolaVersionNode } from './gestola-version';


export default new ContainerModule(bind => {
    bind(GestolaVersionNode).toSelf().inSingletonScope();
});