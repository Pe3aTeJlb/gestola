"use strict"

import 'reflect-metadata';

import { Container } from 'inversify';
import { ContainerModule } from 'inversify';
import { SocketServerLauncher } from './backend/server-launcher/socket-server-launcher';

export async function launch(argv?: string[]): Promise<void> {

    const appContainer = new Container();
    appContainer.load(
        new ContainerModule((bind) => {})
    );

    process.on('unhandledRejection', (reason, p) => {
        console.error('Unhandled Rejection:', p, reason);
    });

    process.on('uncaughtException', error => {
        console.error('Uncaught exception:', error);
    });

    const launcher = appContainer.resolve(SocketServerLauncher);
    launcher.start({ port: 1880, host: "127.0.0.1" });

}

launch(process.argv).catch(error => console.error('Error in node-red server launcher:', error));