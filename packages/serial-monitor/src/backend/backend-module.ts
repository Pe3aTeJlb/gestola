import { ConnectionHandler, RpcConnectionHandler } from "@theia/core/lib/common/messaging";
import { ContainerModule } from '@theia/core/shared/inversify';
import { SerialMonitorServer } from './serial-monitor-server';
import { SERIAL_MONITOR_SERVER_BACKEND_PATH, ISerialMonitorServer, ISerialMonitorClient } from '../common/protocol';
import { SerialMonitorWatcher } from "../common/serial-monitor-watcher";

export default new ContainerModule(bind => {

    bind(SerialMonitorWatcher).toSelf().inSingletonScope();

    bind(SerialMonitorServer).toSelf().inSingletonScope();
    bind(ISerialMonitorServer).to(SerialMonitorServer).inSingletonScope();
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler<ISerialMonitorClient>(SERIAL_MONITOR_SERVER_BACKEND_PATH, client => {
            const backendService = ctx.container.get<ISerialMonitorServer>(ISerialMonitorServer);
            backendService.setClient(client);
            // when connection closes, cleanup that client of task-server
            client.onDidCloseConnection(() => {
                backendService.disconnectClient(client);
            });
            return backendService;
        })
    ).inSingletonScope();

});