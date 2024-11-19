
import { MessageConnection } from 'vscode-jsonrpc';
import { GLSPServer } from './glsp-server';
import { DisposeClientSessionParameters, InitializeClientSessionParameters, InitializeParameters } from './types';
import { JsonrpcGLSPClient } from './glsp-jsonrpc-client';

/**
 * Configure the given client connection to forward the requests and notifications to the given {@link GLSPServer} instance.
 * @param clientConnection JSON-RPC client connection.
 * @param glspServer The GLSP Server which should react to requests & notifications.
 */
export function configureClientConnection(clientConnection: MessageConnection, glspServer: GLSPServer): void {
    clientConnection.onRequest(JsonrpcGLSPClient.InitializeRequest.method, (params: InitializeParameters) => glspServer.initialize(params));
    clientConnection.onRequest(JsonrpcGLSPClient.InitializeClientSessionRequest, (params: InitializeClientSessionParameters) =>
        glspServer.initializeClientSession(params)
    );
    clientConnection.onRequest(JsonrpcGLSPClient.DisposeClientSessionRequest, (params: DisposeClientSessionParameters) =>
        glspServer.disposeClientSession(params)
    );
    clientConnection.onNotification(JsonrpcGLSPClient.ActionMessageNotification, message => glspServer.process(message));

    clientConnection.listen();
}