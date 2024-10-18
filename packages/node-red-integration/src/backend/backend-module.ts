import { bindAsService } from '@eclipse-glsp/protocol/lib/di';
import { ContainerModule } from '@theia/core/shared/inversify';
import { MessagingService } from '@theia/core/lib/node/messaging/messaging-service';
import { bindContributionProvider, ConnectionHandler, RpcConnectionHandler } from '@theia/core/lib/common';
import { NodeRedBackendContribution } from './node-red-backend-contribution';
import { NodeRedContribution } from '../common/node-red-contribution';
import { NodeRedServerContribution } from './node-red-server-contribution';
import { ServerContainerFactory } from './server-container-factory';
import { NodeRedServer } from './node-red-socket-server-contribution';


export default new ContainerModule(bind => {

    bindAsService(bind, MessagingService.Contribution, NodeRedBackendContribution);
    bind(NodeRedContribution.Service).toService(NodeRedBackendContribution);
    bindContributionProvider(bind, NodeRedServerContribution);

    bind(ConnectionHandler)
        .toDynamicValue(ctx => new RpcConnectionHandler(NodeRedContribution.servicePath, () => ctx.container.get(NodeRedContribution.Service)))
        .inSingletonScope();

    bind(ServerContainerFactory).toFactory(ctx => () => ctx.container.createChild());

    bind(NodeRedServer).toSelf().inSingletonScope();
    bind(NodeRedServerContribution).toService(NodeRedServer);

});
