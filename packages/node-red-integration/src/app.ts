"use strict"

import 'reflect-metadata';

import { Container } from 'inversify';
import { ContainerModule } from 'inversify';
import { SocketServerLauncher } from './backend/launch/socket-server-launcher';
import { DefaultGLSPServer } from './backend/glsp-server';
import { GLSPServer } from './common/glsp-server';
import { InjectionContainer } from './common/service-identifiers';

export async function launch(argv?: string[]): Promise<void> {

    const appContainer = new Container();
    appContainer.load(
        new ContainerModule((bind) => {
            bind(InjectionContainer).toDynamicValue(dynamicContext => dynamicContext.container);
        })
    );

    process.on('unhandledRejection', (reason, p) => {
        console.error('Unhandled Rejection:', p, reason);
    });

    process.on('uncaughtException', error => {
        console.error('Uncaught exception:', error);
    });

    const launcher = appContainer.resolve(SocketServerLauncher);
    launcher.configure(new ContainerModule((bind) => {
        
        bind(DefaultGLSPServer).toSelf().inSingletonScope();
        bind(GLSPServer).to(DefaultGLSPServer).inSingletonScope();
    
    }));
    launcher.start({ port: 1881, host: "127.0.0.1" });

}

launch(process.argv).catch(error => console.error('Error in node-red server launcher:', error));