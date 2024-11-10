
import { inject, injectable, named } from '@theia/core/shared/inversify';
import { MessagingService } from '@theia/core/lib/node/messaging/messaging-service';
import { NodeRedContribution } from '../common/node-red-contribution';
import { ContributionProvider } from '@theia/core/lib/common';
import { NodeRedServerContribution } from './node-red-server-contribution';

@injectable()
export class NodeRedBackendContribution implements MessagingService.Contribution {

    @inject(ContributionProvider)
    @named(NodeRedServerContribution)
    protected readonly contributors: ContributionProvider<NodeRedServerContribution>;

    configure(service: MessagingService): void {
        for (const contribution of this.contributors.getContributions()) {
            if (contribution.launch) {
                contribution.launch().then(() => this.forward(service, NodeRedContribution.servicePath, contribution));
            }
        }
    }

    protected forward(service: MessagingService, path: string, contribution: NodeRedServerContribution): void {
        service.registerChannelHandler(path, async (_params, clientChannel) => {
            try {
                const toDispose = await contribution.connect(clientChannel);
                clientChannel.onClose(() => toDispose.dispose());
            } catch (e) {
                console.error(`Error occurred while starting GLSP contribution. ${path}.`, e);
            }
        });
    }


}