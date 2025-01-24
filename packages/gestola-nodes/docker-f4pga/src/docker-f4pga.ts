require("reflect-metadata");
import util = require("node:util");
import { NodeDef, NodeAPI, Node } from "@node-red/registry";
import { F4PGAContainer } from './f4pga-container'

export default function(RED: NodeAPI) {

    function MakeNode(this: Node, config: NodeDef) {
        RED.nodes.createNode(this, config);
        util.inherits(F4PGAContainer, this.constructor);
        return new F4PGAContainer(this, config, RED);
    }

    RED.nodes.registerType("docker-f4pga", MakeNode);
};