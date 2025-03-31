import { ContainerModule } from '@theia/core/shared/inversify';
import { VerilatorFrontendService } from './verilator-service';
import { CommandContribution, MenuContribution } from '@theia/core';
import { VerilatorCommandContribution } from './command-contribution';
import { VERILATOR_BACKEND_PATH, VerilatorBackendService } from '../common/protocol';
import { WebSocketConnectionProvider } from '@theia/core/lib/browser';

export default new ContainerModule((bind, _unbind) => {

    bind(VerilatorFrontendService).toSelf().inSingletonScope();
    bind(CommandContribution).to(VerilatorCommandContribution);
    bind(MenuContribution).to(VerilatorCommandContribution);

    bind(VerilatorBackendService).toDynamicValue(ctx => {
        const connection = ctx.container.get(WebSocketConnectionProvider);
        return connection.createProxy<VerilatorBackendService>(VERILATOR_BACKEND_PATH);
    }).inSingletonScope();


});