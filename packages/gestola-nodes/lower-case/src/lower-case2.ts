import * as nodered from "node-red";
import { NodeRedServer } from "@gestola/node-red-integration";
import { NodeDef } from "@node-red/registry";
import { Container } from 'inversify';
//import { ProjectManagerBackendServiceImpl } from "@gestola/project-manager/src/backend/project-manager-backend-service";

export = (RED: nodered.NodeAPI): void => {
    function LowerCaseNode(this: any, config: NodeDef) {
        RED.nodes.createNode(this, config);
        const appContainer = new Container();

        //var backend = appContainer.resolve(ProjectManagerBackendServiceImpl);
        const lel = appContainer.resolve(NodeRedServer);
        console.log("kek lol arbidol 2",  lel.launch());

        var node = this;
        node.on('input', function(msg: { payload: string; }) {
            console.log("kek lol arbidol 3",  lel.launch());
            msg.payload = msg.payload.toLowerCase();
            node.send(msg);
        });
    }
    RED.nodes.registerType("lower-case2",LowerCaseNode);
}