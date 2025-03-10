/********************************************************************************
 * Copyright (c) 2018-2024 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
import { ContributionProvider } from '@theia/core/lib/common';
import { MessagingService } from '@theia/core/lib/node/messaging/messaging-service';
import { inject, injectable, named } from '@theia/core/shared/inversify';
import { GLSPServerContribution, GLSPServerContributionOptions } from './glsp-server-contribution';
import { GLSPContribution } from '../../common/glsp-contribution';

/**
 * Responsible for the configuration of all registered {@link GLSPServerContribution}s.
 * This includes two main steps:
 *  - launch the GLSP server process (if necessary)
 *  - forwarding of the service connection to the `GLSPClientContribution` counterpart i.e. the client channel
 */
@injectable()
export class GLSPBackendContribution implements MessagingService.Contribution {
    @inject(ContributionProvider)
    @named(GLSPServerContribution)
    protected readonly contributors: ContributionProvider<GLSPServerContribution>;

    configure(service: MessagingService): void {
        for (const contribution of this.contributors.getContributions()) {
            const path = GLSPContribution.getPath(contribution);
            if (GLSPServerContributionOptions.shouldLaunchOnApplicationStart(contribution) && contribution.launch) {
                contribution.launch();
                this.forward(service, path, contribution);
            } else {
                this.forward(service, path, contribution);
            }
        }
    }

    protected forward(service: MessagingService, path: string, contribution: GLSPServerContribution): void {

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
