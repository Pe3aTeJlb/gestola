import { ContainerModule } from '@theia/core/shared/inversify';
import { VivadoFrontendService } from './vivado-service';
import { VIVADO_BACKEND_PATH, VivadoBackendService } from '../common/protocol';
import { WebSocketConnectionProvider } from '@theia/core/lib/browser';

export default new ContainerModule((bind, _unbind) => {

    bind(VivadoFrontendService).toSelf().inSingletonScope();

    bind(VivadoBackendService).toDynamicValue(ctx => {
        const connection = ctx.container.get(WebSocketConnectionProvider);
        return connection.createProxy<VivadoBackendService>(VIVADO_BACKEND_PATH);
    }).inSingletonScope();


});