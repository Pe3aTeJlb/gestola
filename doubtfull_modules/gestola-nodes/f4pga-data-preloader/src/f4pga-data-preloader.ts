require("reflect-metadata");
import util = require("node:util");
import { NodeDef, NodeAPI, Node } from "@node-red/registry";
import { F4PGADataPreloader } from './f4pga-data-preloader-node'

export default function(RED: NodeAPI) {

    function MakeNode(this: Node, config: NodeDef) {
        RED.nodes.createNode(this, config);
        util.inherits(F4PGADataPreloader, this.constructor);
        return new F4PGADataPreloader(this, config, RED);
    }

    RED.nodes.registerType("f4pga-data-preloader", MakeNode);
};