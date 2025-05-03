"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const wasm_component_model_1 = require("@vscode/wasm-component-model");
const filehandler_1 = require("./filehandler");
async function main() {
    const connection = await wasm_component_model_1.Connection.createWorker(filehandler_1.filehandler._);
    connection.listen();
}
main().catch((0, wasm_component_model_1.RAL)().console.error);
//# sourceMappingURL=worker.js.map