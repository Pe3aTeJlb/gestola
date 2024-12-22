/********************************************************************************
 * Copyright (c) 2019-2024 EclipseSource and others.
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
import { ConnectionHandler } from '@theia/core/lib/common';
import { ContainerModule } from '@theia/core/shared/inversify';
import { NODE_RED_BACKEND_PATH, NodeRedService } from '../common/protocol';
import { NodeRedServiceImpl } from './node-red-service';
import { BackendApplicationContribution } from '@theia/core/lib/node';
import { JsonRpcConnectionHandler } from '@theia/core/lib/common/messaging';

export default new ContainerModule(bind => {

    console.log("dirname", __dirname);

    bind(NodeRedServiceImpl).toSelf().inSingletonScope();
    bind(BackendApplicationContribution).toService(NodeRedServiceImpl);
    bind(NodeRedService).to(NodeRedServiceImpl).inSingletonScope()
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new JsonRpcConnectionHandler(NODE_RED_BACKEND_PATH, () => {
            return ctx.container.get<NodeRedService>(NodeRedService);
        })
    ).inSingletonScope();

});