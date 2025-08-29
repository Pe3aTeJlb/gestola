require("reflect-metadata");
import util = require("node:util");
import { NodeDef, NodeAPI, Node } from "@node-red/registry";
import { HelloWorldContainerStarter } from './hello-container'

export default function(RED: NodeAPI) {

    function MakeNode(this: Node, config: NodeDef) {
        RED.nodes.createNode(this, config);
        util.inherits(HelloWorldContainerStarter, this.constructor);
        return new HelloWorldContainerStarter(this, config, RED);
    }

    RED.nodes.registerType("docker-hello", MakeNode);
};