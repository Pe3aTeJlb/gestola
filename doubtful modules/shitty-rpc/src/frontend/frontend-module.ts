import { ContainerModule } from '@theia/core/shared/inversify';
import { GLSPCONTRIBUTION_PATH, GLSPContributionService } from '../common/glsp-contribution';
import { ServiceConnectionProvider, } from '@theia/core/lib/browser/messaging/service-connection-provider';
import { bindContributionProvider } from '@theia/core/lib/common';
import { GLSPClientContribution } from './client/glsp-client-contribution';
import { GLSPFrontendContribution } from './client/glsp-frontend-contribution';
import {  FrontendApplicationContribution} from '@theia/core/lib/browser';
import { NodeRedGLSPClientContribution } from './node-red-client';
import { NodeRedIntegrationWidget } from './node-red-integration-widget';
import { NodeRedIntegrationContribution } from './node-red-integration-contribution';
import { bindViewContribution, WidgetFactory } from '@theia/core/lib/browser';
import '../../src/frontend/style/index.css';
import { OpenHandler } from '@theia/core/lib/browser';
import { NodeRedFileOpener } from './node-red-file-opener';

export default new ContainerModule(bind => {
    
    bindContributionProvider(bind, GLSPClientContribution);

    bind(GLSPFrontendContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(GLSPFrontendContribution);

/*
    bind(GLSPClientContribution).toDynamicValue(dynamicContext => {
        return dynamicContext.container.resolve(NodeRedGLSPClientContribution);
    });
*/

    bind(NodeRedGLSPClientContribution).toSelf().inSingletonScope();
    bind(GLSPClientContribution).toService(NodeRedGLSPClientContribution);


    bind(GLSPContributionService)
    .toDynamicValue(({ container }) => ServiceConnectionProvider.createProxy(container, GLSPCONTRIBUTION_PATH))
    .inSingletonScope();

    bindViewContribution(bind, NodeRedIntegrationContribution);
    bind(FrontendApplicationContribution).toService(NodeRedIntegrationContribution);
    bind(NodeRedIntegrationWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: NodeRedIntegrationWidget.ID,
        createWidget: () => ctx.container.get<NodeRedIntegrationWidget>(NodeRedIntegrationWidget)
    })).inSingletonScope();

    bind(NodeRedFileOpener).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(NodeRedFileOpener);
    bind(OpenHandler).toService(NodeRedFileOpener);

});
