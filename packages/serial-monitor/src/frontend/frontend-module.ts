import { ContainerModule } from '@theia/core/shared/inversify';
import { CommandContribution } from '@theia/core/lib/common/command';
import { SerialMonitorContribution } from './serial-monitor-contribution';
import { SerialMonitorClient } from './serial-manager';
import { SERIAL_MONITOR_BACKEND_PATH, SerialMonitorBackedService } from '../common/protocol';
import { WebSocketConnectionProvider } from '@theia/core/lib/browser';

export default new ContainerModule(bind => {
    
    bind(SerialMonitorClient).toSelf().inSingletonScope();
    bind(CommandContribution).to(SerialMonitorContribution);

    bind(SerialMonitorBackedService).toDynamicValue(ctx => {
        const connection = ctx.container.get(WebSocketConnectionProvider);
        return connection.createProxy<SerialMonitorBackedService>(SERIAL_MONITOR_BACKEND_PATH);
    }).inSingletonScope();

});