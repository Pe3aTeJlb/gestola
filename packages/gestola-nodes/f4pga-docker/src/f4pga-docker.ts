require("reflect-metadata");
import util = require("node:util");
import { NodeDef, NodeAPI, Node } from "@node-red/registry";
import { F4PGADockerContainer } from './f4pga-container'

export default function(RED: NodeAPI) {

    function MakeNode(this: Node, config: NodeDef) {
        RED.nodes.createNode(this, config);
        util.inherits(F4PGADockerContainer, this.constructor);
        return new F4PGADockerContainer(this, config, RED);
    }

    RED.nodes.registerType("f4pga-docker", MakeNode);
};