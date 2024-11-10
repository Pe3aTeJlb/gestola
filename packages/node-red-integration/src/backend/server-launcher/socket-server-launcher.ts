/********************************************************************************
 * Copyright (c) 2022-2024 STMicroelectronics and others.
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
import { Disposable } from '../../common/disposable';
import { injectable } from 'inversify';
import * as net from 'net';
import * as http from "http";
import * as RED from "node-red";
import * as express from "express";
import * as jsonrpc from 'vscode-jsonrpc/node';
import { JsonRpcNodeRedServerLauncher } from './jsonrpc-server-launcher';
import { nrSettings } from '../../common/settings';
import { NodeRedContribution } from '../../common/node-red-contribution';

@injectable()
export class SocketServerLauncher extends JsonRpcNodeRedServerLauncher<net.TcpSocketConnectOpts> implements NodeRedContribution {

    protected netServer: http.Server;

    constructor() {
        super();
        this.toDispose.push(
            Disposable.create(() => {
                this.netServer.close();
            })
        );
    }

    protected run(opts: net.TcpSocketConnectOpts): Promise<void> {

        var app = express();
        this.netServer = http.createServer(app);
    
        // Initialise the runtime with a server and settings
        RED.init(this.netServer, nrSettings);

        // Serve the editor UI from /red
        app.use(nrSettings.httpAdminRoot,RED.httpAdmin);

        // Serve the http nodes UI from /api
        app.use(nrSettings.httpNodeRoot,RED.httpNode);

        this.netServer.listen(nrSettings.port, nrSettings.host);
        this.netServer.on('listening', () => {
            const addressInfo = this.netServer.address();
            if (!addressInfo) {
                this.shutdown();
                return;
            } else if (typeof addressInfo === 'string') {
                this.shutdown();
                return;
            }
            const currentPort = addressInfo.port;
            // Print a message to the output stream that indicates that the start is completed.
            // This indicates to the client that the server process is ready (in an embedded scenario).
            console.log(this.startupCompleteMessage.concat(currentPort.toString()));
        });


        this.netServer.on('error', () => this.shutdown());

        RED.start().then(() =>{
            console.info("------ Engine started! ------");
          });

        return new Promise((resolve, reject) => {
            this.netServer.on('close', () => resolve(undefined));
            this.netServer.on('error', error => reject(error));
        });
    }

    protected createConnection(socket: net.Socket): jsonrpc.MessageConnection {
        return jsonrpc.createMessageConnection(new jsonrpc.SocketMessageReader(socket), new jsonrpc.SocketMessageWriter(socket), console);
    }

    openFile(): Promise<void> {
        console.log('kekw kekl');
        return Promise.resolve();
    }

}

