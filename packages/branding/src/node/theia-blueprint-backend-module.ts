import { ContainerModule } from '@theia/core/shared/inversify';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { TheiaBlueprintEnvVariableServer } from './theia-blueprint-variables-server';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    rebind(EnvVariablesServer).to(TheiaBlueprintEnvVariableServer).inSingletonScope();
});
