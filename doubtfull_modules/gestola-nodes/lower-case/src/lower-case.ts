import * as nodered from "node-red";
import { NodeDef } from "@node-red/registry";

export = (RED: nodered.NodeAPI): void => {
    function LowerCaseNode1(this: any, config: NodeDef) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.on('input', function(msg: { payload: string; }) {
            msg.payload = msg.payload.toLowerCase();
            node.send(msg);
        });
    }
    RED.nodes.registerType("lower-case",LowerCaseNode1);
}