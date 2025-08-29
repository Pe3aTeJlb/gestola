import { ContainerModule } from '@theia/core/shared/inversify';
import {  FrontendApplicationContribution} from '@theia/core/lib/browser';
import { NodeRedIntegrationWidget } from './node-red-integration-widget';
import { NodeRedIntegrationContribution } from './node-red-integration-contribution';
import { bindViewContribution, WidgetFactory } from '@theia/core/lib/browser';
import '../../src/frontend/style/index.css';
import { OpenHandler } from '@theia/core/lib/browser';
import { NodeRedFileOpener, NodeRedIntegrationOptions } from './node-red-file-opener';
import { NODE_RED_BACKEND_PATH, NodeRedService } from "../common/protocol"
import { WebSocketConnectionProvider } from '@theia/core/lib/browser';

export default new ContainerModule(bind => {
    
    bindViewContribution(bind, NodeRedIntegrationContribution);
    bind(FrontendApplicationContribution).toService(NodeRedIntegrationContribution);

    bind(NodeRedFileOpener).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(NodeRedFileOpener);
    bind(OpenHandler).toService(NodeRedFileOpener);

    bind(NodeRedIntegrationWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: NodeRedIntegrationWidget.ID,
        createWidget: (options: NodeRedIntegrationOptions) => {
            const child = ctx.container.createChild();
            const widget = child.get(NodeRedIntegrationWidget);
            widget.configure(options);
            return widget;
        }
    }));

    bind(NodeRedService).toDynamicValue(ctx => {
        const connection = ctx.container.get(WebSocketConnectionProvider);
        return connection.createProxy<NodeRedService>(NODE_RED_BACKEND_PATH);
    }).inSingletonScope();

});
