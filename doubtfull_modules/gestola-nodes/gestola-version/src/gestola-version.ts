require("reflect-metadata");
import util = require("node:util");
import { NodeDef, NodeAPI, Node } from "@node-red/registry";
import { GestolaVersionNode } from './gestola-version-node'

export default function(RED: NodeAPI) {

    function MakeNode(this: Node, config: NodeDef) {
        RED.nodes.createNode(this, config);
        util.inherits(GestolaVersionNode, this.constructor);
        return new GestolaVersionNode(this, config, RED);
    }

    RED.nodes.registerType("gestola-version", MakeNode);
};