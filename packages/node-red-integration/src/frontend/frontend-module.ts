import { ContainerModule } from '@theia/core/shared/inversify';
import { NodeRedIntegrationWidget } from './node-red-integration-widget';
import { NodeRedIntegrationContribution } from './node-red-integration-contribution';
import { bindViewContribution, FrontendApplicationContribution, WidgetFactory } from '@theia/core/lib/browser';
import '../../src/frontend/style/index.css';
import { NodeRedContribution } from '../common/node-red-contribution';
import { OpenHandler } from '@theia/core/lib/browser';
import { NodeRedFileOpener } from './node-red-file-opener';
import { ServiceConnectionProvider } from '@theia/core/lib/browser/messaging/service-connection-provider';

export default new ContainerModule(bind => {

    bindViewContribution(bind, NodeRedIntegrationContribution);
    bind(FrontendApplicationContribution).toService(NodeRedIntegrationContribution);
    bind(NodeRedIntegrationWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: NodeRedIntegrationWidget.ID,
        createWidget: () => ctx.container.get<NodeRedIntegrationWidget>(NodeRedIntegrationWidget)
    })).inSingletonScope();

    bind(NodeRedContribution.Service)
    .toDynamicValue(({ container }) => ServiceConnectionProvider.createProxy(container, NodeRedContribution.servicePath))
    .inSingletonScope();

/*
    bind(NodeRedContribution.Service).toDynamicValue(ctx => {
        const connection = ctx.container.get(WebSocketConnectionProvider);
        return connection.createProxy<NodeRedContribution>(NodeRedContribution.servicePath);
    }).inSingletonScope();
*/
    bind(NodeRedFileOpener).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(NodeRedFileOpener);
    bind(OpenHandler).toService(NodeRedFileOpener);

});
