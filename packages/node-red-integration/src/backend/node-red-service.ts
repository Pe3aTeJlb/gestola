import { MaybePromise, URI } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { NodeRedService } from '../common/protocol';
import { BackendApplicationContribution } from '@theia/core/lib/node';
import * as http from "http";
import * as https from "https";
/*
import * as http from "http";
import * as RED from "node-red";
import { nrSettings } from '../common/settings';
import * as express from "express";*/

const nodeRedServer = require('../../dist/node-red-integration');

@injectable()
export class NodeRedServiceImpl implements NodeRedService, BackendApplicationContribution {
    
    onStart(server: http.Server | https.Server): MaybePromise<void> {
        
        console.log("Red onstart", __dirname);
        nodeRedServer.launch();
      
    }

    launch(): Promise<void> {
        console.log("Kek lol arbidol server");
        return Promise.resolve();
    }

    openFile(uri: URI): Promise<void> {
        throw new Error('Method not implemented.');
    }

}