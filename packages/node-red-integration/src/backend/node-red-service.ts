import { MaybePromise, URI } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { NodeRedService } from '../common/protocol';
import { BackendApplicationContribution } from '@theia/core/lib/node';
import * as http from "http";
import * as https from "https";
import * as RED from "node-red";
import { nrSettings } from '../common/settings';
import * as express from "express";
import * as fs from 'fs';

@injectable()
export class NodeRedServiceImpl implements NodeRedService, BackendApplicationContribution {
    
    onStart(server: http.Server | https.Server): MaybePromise<void> {

        var app = express();
        var netServer = http.createServer(app);

        // Initialise the runtime with a server and settings
        RED.init(netServer, nrSettings);
        RED.events.emit('core:stop-flows');

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
      
    }

    launch(): Promise<void> {
        RED.start().then(async () =>{
            await RED.runtime.flows.setFlows({flows: {flows: [], credentials: {}}});
            console.info("------ Engine started! ------");
        });
        return Promise.resolve();
    }

    async openFile(uri: URI): Promise<void> {

        if(!uri) return;

        let flowData = await this.readJSONFile(uri); 
        let flowDesc = flowData.filter((e:any) => e.type == 'tab')[0];
        let flowNodes = flowData.filter((e:any) => e.z == flowDesc.id);

        await RED.runtime.flows.addFlow({flow: {id: flowDesc.id, label: flowDesc.label, nodes: flowNodes }});

        return Promise.resolve();

    }

    async readJSONFile(uri: URI) {
        try {
            const rawData = await fs.promises.readFile(uri.path.fsPath(), 'utf-8');
            const jsonData = JSON.parse(rawData);
            return jsonData;
        } catch (error) {
            console.error('Error reading JSON file:', error);
        }
    }

}