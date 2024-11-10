import { NodeRedContribution } from "../common/node-red-contribution";
import { MaybePromise } from '../common/type-util';
import { Channel, Disposable, DisposableCollection } from '@theia/core';
import { inject, injectable } from '@theia/core/shared/inversify';
import { ProcessErrorEvent } from '@theia/process/lib/node/process';
import { ProcessManager } from '@theia/process/lib/node/process-manager';
import { RawProcess, RawProcessFactory } from '@theia/process/lib/node/raw-process';
import * as cp from 'child_process';
import { createInterface } from 'readline';
import * as net from 'net';
import * as fs from 'fs';
import { getWebSocketAddress, isValidWebSocketAddress } from '../common/websocket-utils';
import { SocketConnectionForwarder } from './socket-connection-forwarder';
import { WebSocketConnectionForwarder } from './websocket-connection-forwarder';
import { Deferred } from '@theia/core/lib/common/promise-util';
const path = require('path');
import { ForwardingChannel } from '@theia/core/lib/common/message-rpc/channel';
import { WebSocket } from 'ws';

export const NodeRedServerContribution = Symbol('NodeRedServerContribution');
export interface NodeRedServerContribution extends NodeRedContribution, Disposable {
    /**
     * Establish a connection between the given client (connection) and the GLSP server.
     * @param clientChannel  The client (channel) which should be connected to the server
     * @returns A 'Disposable' that cleans up all client (channel)-specific resources.
     */
    connect(clientChannel: Channel): MaybePromise<Disposable>;

    /**
     * Optional function that can be used by the contribution to launch an embedded GLSP server.
     * @returns A 'Promise' that resolves after the server has been successfully launched and is ready to establish a client connection.
     */
    launch?(): Promise<Disposable>;

}



@injectable()
export abstract class BaseNodeRedServerContribution implements NodeRedServerContribution {
    
    openFile(): Promise<void> {
        console.log('kekw BaseNodeRedServerContribution');
        return Promise.resolve();
    }
    
    @inject(RawProcessFactory)
    protected readonly processFactory: RawProcessFactory;

    @inject(ProcessManager)
    protected readonly processManager: ProcessManager;

    abstract readonly id: string;

    protected toDispose = new DisposableCollection();

    async connect(clientChannel: Channel): Promise<Disposable> {
        const clientDisposable = await this.doConnect(clientChannel);
        this.toDispose.push(clientDisposable);
        return clientDisposable;
    }

    abstract doConnect(clientChannel: Channel): MaybePromise<Disposable>;

    protected spawnProcessAsync(command: string, args?: string[], options?: cp.SpawnOptions): Promise<RawProcess> {
        const rawProcess = this.processFactory({ command, args, options });

        createInterface(rawProcess.outputStream).on('line', line => console.log(line));
        createInterface(rawProcess.errorStream).on('line', line => console.log(line));

        return new Promise<RawProcess>((resolve, reject) => {
            rawProcess.onError((error: ProcessErrorEvent) => {
                this.onDidFailSpawnProcess(error);
                if (error.code === 'ENOENT') {
                    const guess = command.split(/\s+/).shift();
                    if (guess) {
                        reject(new Error(`Failed to spawn ${guess}\nPerhaps it is not on the PATH.`));
                        return;
                    }
                }
                reject(error);
            });
            process.nextTick(() => resolve(rawProcess));
        });
    }

    protected onDidFailSpawnProcess(error: Error | ProcessErrorEvent): void {
        console.error(error);
    }

    protected processLogError(line: string): void {
        console.error(`${this.id}: ${line}`);
    }

    protected processLogInfo(line: string): void {
        console.info(`${this.id}: ${line}`);
    }

    dispose(): void {
        this.toDispose.dispose();
    }
}



/**
 *  A reusable base implementation for {@link GLSPServerContribution}s that are using a socket connection to communicate
 *  with a Java or Node based GLSP server.
 **/
@injectable()
export class NodeRedSocketServerContribution extends BaseNodeRedServerContribution {

    readonly id = 'node-red';
    readonly DEFAULT_PORT = 1880;
    readonly HOST = '127.0.0.1'
    readonly PORT_ARG_KEY = 'NODERED';
    readonly MODULE_PATH = path.resolve(__dirname, '../../resources/node-red/node-red-integration.js');
    START_UP_COMPLETE_MSG = '[Node-Red-Server]:Startup completed';
    
    protected onReadyDeferred = new Deferred<void>();

    doConnect(clientChannel: Channel): MaybePromise<Disposable> {
        const webSocketAddress = getWebSocketAddress({ port: getPort(this.PORT_ARG_KEY, this.DEFAULT_PORT), host: this.HOST});
        if (webSocketAddress) {
            if (!isValidWebSocketAddress(webSocketAddress)) {
                throw new Error(`Could not connect to server. The given websocket address is not valid: ${webSocketAddress}`);
            }
            return this.connectToWebSocketServer(clientChannel, webSocketAddress);
        }
        return this.connectToSocketServer(clientChannel);
    }

    async launch(): Promise<void> {
        try {

            if (!this.MODULE_PATH) {
                throw new Error('Could not launch Node Red server. No executable path is provided via the contribution options');
            }
            if (!fs.existsSync(this.MODULE_PATH)) {
                throw new Error(`Could not launch Node Red server. The given server executable path is not valid: ${this.MODULE_PATH}`);
            }

            if (this.MODULE_PATH.endsWith('.js')) {
                const process = await this.launchNodeProcess();
                this.toDispose.push(Disposable.create(() => process.kill()));
            } else {
                throw new Error(`Could not launch Node Red Server. Invalid executable path ${this.MODULE_PATH}`);
            }
        } catch (error) {
            this.onReadyDeferred.reject(error);
        }

        return this.onReadyDeferred.promise;
    }

    protected getPortFromStartupMessage(message: string): number | undefined {
        if (message.includes(this.START_UP_COMPLETE_MSG)) {
            const port = message.substring(message.lastIndexOf(':') + 1);
            return parseInt(port, 10);
        }
        return undefined;
    }

    protected launchNodeProcess(): Promise<RawProcess> {
        const args = [this.MODULE_PATH, '--port', `${this.DEFAULT_PORT}`];

        if (this.HOST) {
            args.push('--host', `${this.HOST}`);
        }

        return this.spawnProcessAsync('node', args);
    }

    protected override processLogInfo(line: string): void {
        if (line.startsWith(this.START_UP_COMPLETE_MSG)) {
            const port = this.getPortFromStartupMessage(line);
            if (port) {
                if (this.DEFAULT_PORT !== port) {
                    throw new Error(
                        // eslint-disable-next-line max-len
                        `The configured port ${this.DEFAULT_PORT} does not match the port in the startup message: ${line}`
                    );
                }
            } else {
                throw new Error(`Could not find listening port in startup message of Node Red server: ${line}`);
            }
            this.onReadyDeferred.resolve();
        }
    }

    protected checkServerPort(): void {
        if (isNaN(this.DEFAULT_PORT)) {
            throw new Error(
                // eslint-disable-next-line max-len
                `Could not connect to to Node Red Server. The given server port is not a number: ${this.DEFAULT_PORT}`
            );
        }
    }

    protected async connectToSocketServer(clientChannel: Channel): Promise<Disposable> {
        const clientDisposable = new DisposableCollection();
        this.checkServerPort();
        const socket = new net.Socket();

        clientDisposable.push(this.forwardToSocketConnection(clientChannel, socket));
        if (clientChannel instanceof ForwardingChannel) {
            socket.on('error', error => clientChannel.onErrorEmitter.fire(error));
        }
        socket.connect({ port: getPort(this.PORT_ARG_KEY, this.DEFAULT_PORT), host: this.HOST});
        clientDisposable.push(Disposable.create(() => socket.destroy()));
        return clientDisposable;
    }

    protected forwardToSocketConnection(clientChannel: Channel, socket: net.Socket): Disposable {
        return new SocketConnectionForwarder(clientChannel, socket);
    }

    protected async connectToWebSocketServer(clientChannel: Channel, webSocketAddress: string | undefined): Promise<Disposable> {
        const clientDisposable = new DisposableCollection();
        this.checkServerPort();
        if (!webSocketAddress) {
            throw new Error('Could not connect to to Node Red Server. The WebSocket path cannot be empty');
        }

        const webSocket = new WebSocket(webSocketAddress);
        clientDisposable.push(Disposable.create(() => webSocket.close()));
        clientDisposable.push(this.forwardToWebSocketConnection(clientChannel, webSocket));
        if (clientChannel instanceof ForwardingChannel) {
            webSocket.onerror = error => clientChannel.onErrorEmitter.fire(error);
        }
        return clientDisposable;
    }

    protected forwardToWebSocketConnection(clientChannel: Channel, webSocket: WebSocket): Disposable {
        return new WebSocketConnectionForwarder(clientChannel, webSocket);
    }
}

/**
 * Utility function to parse a server port that is defined via command line arg.
 * @param argsKey Name/Key of the commandLine arg
 * @param defaultPort Default port that should be returned if no (valid) port was passed via CLI#
 * @returns the path value of the given argument if set, default value or `NaN` instead.
 */
export function getPort(argsKey: string, defaultPort?: number): number {
    argsKey = `--${argsKey.replace('--', '').replace('=', '')}=`;
    const args = process.argv.filter(a => a.startsWith(argsKey));
    if (args.length > 0) {
        return Number.parseInt(args[0].substring(argsKey.length), 10);
    }
    return defaultPort ?? NaN;
}
