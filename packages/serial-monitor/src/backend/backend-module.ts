import { ConnectionHandler } from '@theia/core/lib/common';
import { ContainerModule } from '@theia/core/shared/inversify';
import { JsonRpcConnectionHandler } from '@theia/core/lib/common/messaging';
import { SerialMonitorServer } from './serial-monitor-server';
import { SERIAL_MONITOR_BACKEND_PATH, SerialMonitorBackedService } from '../common/protocol';

export default new ContainerModule(bind => {

    bind(SerialMonitorServer).toSelf().inSingletonScope();
    bind(SerialMonitorBackedService).to(SerialMonitorServer).inSingletonScope()
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new JsonRpcConnectionHandler(SERIAL_MONITOR_BACKEND_PATH, () => {
            return ctx.container.get<SerialMonitorBackedService>(SerialMonitorBackedService);
        })
    ).inSingletonScope();

});