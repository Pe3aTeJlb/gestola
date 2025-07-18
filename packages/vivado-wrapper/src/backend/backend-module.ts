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
import { VIVADO_BACKEND_PATH, VivadoBackendService } from '../common/protocol';
import { JsonRpcConnectionHandler } from '@theia/core/lib/common/messaging';
import { VivadoBackendServiceImpl } from './vivado-backend-service';

export default new ContainerModule(bind => {

    bind(VivadoBackendServiceImpl).toSelf().inSingletonScope();
    bind(VivadoBackendService).to(VivadoBackendServiceImpl).inSingletonScope()
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new JsonRpcConnectionHandler(VIVADO_BACKEND_PATH, () => {
            return ctx.container.get<VivadoBackendService>(VivadoBackendService);
        })
    ).inSingletonScope();

});