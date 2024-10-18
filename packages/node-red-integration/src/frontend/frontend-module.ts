import { ContainerModule } from '@theia/core/shared/inversify';
import { NodeRedIntegrationWidget } from './node-red-integration-widget';
import { NodeRedIntegrationContribution } from './node-red-integration-contribution';
import { bindViewContribution, FrontendApplicationContribution, WidgetFactory } from '@theia/core/lib/browser';

import '../../src/frontend/style/index.css';


export default new ContainerModule(bind => {
    bindViewContribution(bind, NodeRedIntegrationContribution);
    bind(FrontendApplicationContribution).toService(NodeRedIntegrationContribution);
    bind(NodeRedIntegrationWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: NodeRedIntegrationWidget.ID,
        createWidget: () => ctx.container.get<NodeRedIntegrationWidget>(NodeRedIntegrationWidget)
    })).inSingletonScope();

});
