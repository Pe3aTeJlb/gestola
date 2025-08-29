require("reflect-metadata");
import util = require("node:util");
import { NodeDef, NodeAPI, Node } from "@node-red/registry";
import { ProjectManagerRTLModel } from './pm-rtl-model-node';

export default function(RED: NodeAPI) {

    function MakeNode(this: Node, config: NodeDef) {
        RED.nodes.createNode(this, config);
        util.inherits(ProjectManagerRTLModel, this.constructor);
        return new ProjectManagerRTLModel(this, config, RED);
    }

    RED.nodes.registerType("pm-rtl-model", MakeNode);
};