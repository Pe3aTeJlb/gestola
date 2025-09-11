import { ContainerModule } from '@theia/core/shared/inversify';
//import { CommandContribution } from '@theia/core/lib/common/command';
//import { SerialMonitorContribution } from './serial-monitor-contribution';
import { SerialMonitorClient } from './serial-monitor-client';
import { SERIAL_MONITOR_SERVER_BACKEND_PATH, ISerialMonitorServer } from '../common/protocol';
import { WebSocketConnectionProvider } from '@theia/core/lib/browser';
import { SerialMonitorWatcher } from '../common/serial-monitor-watcher';

export default new ContainerModule(bind => {
    
    bind(SerialMonitorClient).toSelf().inSingletonScope();
    //bind(CommandContribution).to(SerialMonitorContribution);

    bind(SerialMonitorWatcher).toSelf().inSingletonScope();
    bind(ISerialMonitorServer).toDynamicValue(ctx => {
        const connection = ctx.container.get(WebSocketConnectionProvider);
        const client = ctx.container.get(SerialMonitorWatcher);
        return connection.createProxy<ISerialMonitorServer>(SERIAL_MONITOR_SERVER_BACKEND_PATH, client.getClient());
    }).inSingletonScope();

});