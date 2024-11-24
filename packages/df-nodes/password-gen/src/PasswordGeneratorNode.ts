import * as nodered from "node-red";
import { generatePassword } from "./PasswordGenerator";
import { PasswordGeneratorNodeDef } from "./PasswordGeneratorNodeDef";
import * as yutolity from "yutolity";

export = (RED: nodered.NodeAPI): void => {
    RED.nodes.registerType("password-generator",
        function (this: nodered.Node, config: PasswordGeneratorNodeDef): void {
            RED.nodes.createNode(this, config);

            this.on("input", async (msg: any, send, done) => {
                const password = await generatePassword(config.length);
                const valueSetPath = msg.to || config.setTo || "payload";
                msg = yutolity.setValue(msg, valueSetPath, password);
                send(msg);
                done();
            });
        });
}
