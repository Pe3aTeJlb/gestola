import { MaybePromise, URI } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { NodeRedService } from '../common/protocol';
import { BackendApplicationContribution } from '@theia/core/lib/node';
import { Application } from 'express';
import * as http from "http";
import * as RED from "node-red";
import { nrSettings } from '../common/settings';
import * as express from "express";

@injectable()
export class NodeRedServer implements NodeRedService, BackendApplicationContribution {
    
    configure(lol: Application): MaybePromise<void> {
        
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

    launch(): Promise<void> {
        throw new Error('Method not implemented.');
    }

    openFile(uri: URI): Promise<void> {
        throw new Error('Method not implemented.');
    }

}