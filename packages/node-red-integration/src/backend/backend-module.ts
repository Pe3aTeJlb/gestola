import { ContainerModule } from '@theia/core/shared/inversify';
import { MessagingService } from '@theia/core/lib/node/messaging/messaging-service';
import { bindContributionProvider, ConnectionHandler, JsonRpcConnectionHandler } from '@theia/core/lib/common';
import { NodeRedBackendContribution } from './node-red-backend-contribution';
import { NodeRedContribution } from '../common/node-red-contribution';
import { NodeRedSocketServerContribution } from './node-red-server-contribution';
import { NodeRedServerContribution } from './node-red-server-contribution'

export default new ContainerModule(bind => {

    bind(NodeRedBackendContribution).toSelf().inSingletonScope();
    bind(MessagingService.Contribution).toService(NodeRedBackendContribution);

    bind(NodeRedContribution.Service).toService(NodeRedBackendContribution);
    bindContributionProvider(bind, NodeRedServerContribution);

   /* bind(ConnectionHandler)
        .toDynamicValue(ctx => new RpcConnectionHandler(NodeRedContribution.servicePath, () => ctx.container.get(NodeRedContribution.Service)))
        .inSingletonScope();*/

    bind(ConnectionHandler).toDynamicValue(ctx =>
        new JsonRpcConnectionHandler(NodeRedContribution.servicePath, () => {
            return ctx.container.get<NodeRedContribution>(NodeRedContribution.Service);
        })
    ).inSingletonScope();

    bind(NodeRedSocketServerContribution).toSelf().inSingletonScope();
    bind(NodeRedServerContribution).to(NodeRedSocketServerContribution);

});
