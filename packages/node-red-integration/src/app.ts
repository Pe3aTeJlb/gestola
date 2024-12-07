"use strict"

import 'reflect-metadata';
import * as http from "http";
import * as RED from "node-red";
import { nrSettings } from './common/settings';
import * as express from "express";

export async function launch(argv?: string[]): Promise<void> {

    console.log("Node red server", __dirname);

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
            netServer.off;
            return;
        } else if (typeof addressInfo === 'string') {
            netServer.off;
            return;
        }
    });

    netServer.on('error', () => netServer.off);

    RED.start().then(() =>{
        console.info("------ Engine started! ------");
    });

}

//launch(process.argv).catch(error => console.error('Error in node-red server launcher:', error));