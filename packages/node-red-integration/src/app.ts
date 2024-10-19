"use strict"

import 'reflect-metadata';

import { Container } from 'inversify';
import { ContainerModule } from 'inversify';
import { SocketServerLauncher } from './backend/socket-server-launcher';

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

/*
var nrSettings = require("../settings.js");
var http = require('http');
var express = require("express");
var RED = require("node-red");

// Create an Express app
var app = express();

// Add a simple route for static content served from 'public'
app.use("/",express.static("public"));

// Create a server
var server = http.createServer(app);

// Initialise the runtime with a server and settings
RED.init(server,nrSettings);

// Serve the editor UI from /red
app.use(nrSettings.httpAdminRoot,RED.httpAdmin);

// Serve the http nodes UI from /api
app.use(nrSettings.httpNodeRoot,RED.httpNode);

server.listen(1880);

// Start the runtime
RED.start();
*/