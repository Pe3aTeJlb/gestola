/********************************************************************************
 * Copyright (c) 2022-2023 STMicroelectronics and others.
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

import { Args } from '../common/types';
import { ActionMessage } from '../common/base-protocol';
import { GLSPClientProxy, GLSPServer } from '../common/glsp-server';
import { GLSPServerListener } from '../common/glsp-server';
import { distinctAdd } from '../utils/array-util';
//import { ServerActions } from '../common/types';
import { MaybePromise } from '../utils/type-util';
import { InitializeResult } from '../common/types';
import { InitializeParameters } from '../common/types';
import { InitializeClientSessionParameters } from '../common/types';
import { DisposeClientSessionParameters } from '../common/types';
import { remove } from '../utils/array-util';
import { nrSettings } from '../common/settings';
import { injectable, inject, multiInject, optional } from 'inversify';
import { MessageAction } from '../common/client-notification';
import { GLSPServerError } from '../utils/glsp-server-error';
import * as http from "http";
import * as RED from "node-red";
import * as express from "express";

@injectable()
export class DefaultGLSPServer implements GLSPServer {
    public static readonly PROTOCOL_VERSION = '1.0.0';

    @inject(GLSPClientProxy)
    protected glspClientProxy: GLSPClientProxy;

    protected initializeResult?: InitializeResult;

    protected applicationId: string;

    protected serverListeners: GLSPServerListener[] = [];

    constructor(@multiInject(GLSPServerListener) @optional() serverListeners: GLSPServerListener[] = []) {
        serverListeners.forEach(listener => this.addListener(listener));
    }

    protected validateProtocolVersion(params: InitializeParameters): void {
        if (params.protocolVersion !== DefaultGLSPServer.PROTOCOL_VERSION) {
            throw new Error(
                // eslint-disable-next-line max-len
                `Protocol version mismatch! The client protocol version ${params.protocolVersion} is not compatible with the server protocol version ${DefaultGLSPServer.PROTOCOL_VERSION}!`
            );
        }
    }

    protected validateServerInitialized(): void {
        if (!this.isInitialized()) {
            throw new Error('This GLSP server has not been initialized.');
        }
    }

    public async initialize(params: InitializeParameters): Promise<InitializeResult> {
        console.info(`Initializing server with: applicationId: ${params.applicationId}, protocolVersion: ${params.protocolVersion}`);
        this.validateProtocolVersion(params);

        if (this.isInitialized()) {
            if (params.applicationId !== this.applicationId) {
                throw new Error(`Could not initialize GLSP server for application ${params.applicationId}. 
                    Server has already been initialized for different application with id ${this.applicationId}`);
            }
            if (this.initializeResult) {
                return this.initializeResult;
            }
        }

        this.applicationId = params.applicationId;
        //const serverActions: ServerActions = {};

        //this.actionProvider.actionKinds.forEach((kinds, diagramType) => (serverActions[diagramType] = kinds));

        this.initNodeRed();

        let result = { protocolVersion: DefaultGLSPServer.PROTOCOL_VERSION };

        result = await this.handleInitializeArgs(result, params.args);
        this.getListenersToNotify('serverInitialized').forEach((listener: GLSPServerListener) => listener.serverInitialized!(this));
        this.initializeResult = result;
        return result;
    }

    protected handleInitializeArgs(result: InitializeResult, args: Args | undefined): MaybePromise<InitializeResult> {
        return result;
    }

    protected initNodeRed(){

        var app = express();
        var netServer = http.createServer(app);
    
        // Initialise the runtime with a server and settings
        RED.init(netServer, nrSettings);

        // Serve the editor UI from /red
        app.use(nrSettings.httpAdminRoot,RED.httpAdmin);

        // Serve the http nodes UI from /api
        app.use(nrSettings.httpNodeRoot,RED.httpNode);

        netServer.listen(nrSettings.port, nrSettings.host);
        netServer.on('listening', () => {
            const addressInfo = netServer.address();
            if (!addressInfo) {
                this.shutdown();
                return;
            } else if (typeof addressInfo === 'string') {
                this.shutdown();
                return;
            }
        });


        netServer.on('error', () => this.shutdown());

        RED.start().then(() =>{
            console.info("------ Engine started! ------");
        });

    }

    public async initializeClientSession(params: InitializeClientSessionParameters): Promise<void> {
        console.info(
            `Initializing client session with: clientSessionId: '${params.clientSessionId}', diagramType: '${params.diagramType}'`
        );
        this.validateServerInitialized();

        //const session = this.sessionManager.getOrCreateClientSession(params);

        //this.clientSessions.set(params.clientSessionId, session);
        return this.handleInitializeClientSessionArgs(params.args);
    }

    protected handleInitializeClientSessionArgs(args: Args | undefined): MaybePromise<void> {
        return;
    }

    public async disposeClientSession(params: DisposeClientSessionParameters): Promise<void> {
        console.debug('Dispose client session with:', params);
        this.validateServerInitialized();
        /*if (this.sessionManager.disposeClientSession(params.clientSessionId)) {
            this.clientSessions.delete(params.clientSessionId);
            return this.handleDisposeClientSessionArgs(params.args);
        }*/
        return;
    }

    protected async handleDisposeClientSessionArgs(args: Args | undefined): Promise<void> {
        return;
    }

    process(message: ActionMessage): void {
        this.validateServerInitialized();
        console.info(`process [action=${message.action.kind}, clientId=${message.clientId}]`);
        //const clientSessionId = message.clientId;
        /*const clientSession = this.clientSessions.get(clientSessionId);
        if (!clientSession) {
            throw new Error(`No client session has been initialized for client id: ${clientSessionId}`);
        }
        const action = message.action;
        ClientAction.mark(action);
        clientSession.actionDispatcher.dispatch(action).catch(error => this.handleProcessError(message, error));*/
    }

    protected handleProcessError(message: ActionMessage, reason: any): void | PromiseLike<void> {
        let errorMsg = `Could not process action: '${message.action.kind}`;
        console.error(errorMsg);
        console.error(reason);
        let details: string | undefined = reason?.toString?.();
        if (reason instanceof GLSPServerError) {
            details = reason.cause?.toString?.();
            errorMsg = reason.message;
        }
        const errorAction = MessageAction.create(errorMsg, { severity: 'ERROR', details });
        this.sendToClient({ clientId: message.clientId, action: errorAction });
    }

    protected sendToClient(message: ActionMessage): void {
        this.glspClientProxy.process(message);
    }

    /*getClientSession(sessionId: string): ClientSession | undefined {
        return this.clientSessions.get(sessionId);
    }*/

    public shutdown(): void {
        console.info('Shutdown GLSP Server');
        this.getListenersToNotify('serverShutDown').forEach(listener => listener.serverShutDown!(this));
        //this.clientSessions.clear();
        this.initializeResult = undefined;
    }

    protected isInitialized(): boolean {
        return this.initializeResult !== undefined;
    }

    addListener(listener: GLSPServerListener): boolean {
        distinctAdd(this.serverListeners, listener);
        return true;
    }

    removeListener(listener: GLSPServerListener): boolean {
        remove(this.serverListeners, listener);
        return true;
    }

    protected getListenersToNotify(method: keyof GLSPServerListener): GLSPServerListener[] {
        return this.serverListeners.filter(listener => listener[method]);
    }
}
