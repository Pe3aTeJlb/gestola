"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.filehandler = exports.Types = void 0;
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/* eslint-disable @typescript-eslint/ban-types */
const $wcm = __importStar(require("@vscode/wasm-component-model"));
var Types;
(function (Types) {
    var $;
    (function ($) {
        $.Scopeitem = new $wcm.RecordType([
            ['name', $wcm.wstring],
            ['id', $wcm.wstring],
            ['tpe', $wcm.wstring],
        ]);
    })($ = Types.$ || (Types.$ = {}));
})(Types || (exports.Types = Types = {}));
(function (Types) {
    var _;
    (function (_) {
        _.id = 'vscode:example/types';
        _.witName = 'types';
        _.types = new Map([
            ['Scopeitem', Types.$.Scopeitem]
        ]);
    })(_ = Types._ || (Types._ = {}));
})(Types || (exports.Types = Types = {}));
var filehandler;
(function (filehandler) {
    var $;
    (function ($) {
        $.Scopeitem = Types.$.Scopeitem;
        let imports;
        (function (imports) {
            imports.log = new $wcm.FunctionType('log', [
                ['msg', $wcm.wstring],
            ], undefined);
            imports.fsread = new $wcm.FunctionType('fsread', [
                ['fd', $wcm.u32],
                ['offset', $wcm.u64],
                ['length', $wcm.u32],
            ], new $wcm.Uint8ArrayType());
            imports.getsize = new $wcm.FunctionType('getsize', [
                ['fd', $wcm.u32],
            ], $wcm.u64);
            imports.setscopetop = new $wcm.FunctionType('setscopetop', [
                ['name', $wcm.wstring],
                ['id', $wcm.u32],
                ['tpe', $wcm.wstring],
            ], undefined);
            imports.setvartop = new $wcm.FunctionType('setvartop', [
                ['name', $wcm.wstring],
                ['id', $wcm.u32],
                ['signalid', $wcm.u32],
                ['tpe', $wcm.wstring],
                ['encoding', $wcm.wstring],
                ['width', $wcm.u32],
                ['msb', $wcm.s32],
                ['lsb', $wcm.s32],
            ], undefined);
            imports.setmetadata = new $wcm.FunctionType('setmetadata', [
                ['scopecount', $wcm.u32],
                ['varcount', $wcm.u32],
                ['timescale', $wcm.u32],
                ['timeunit', $wcm.wstring],
            ], undefined);
            imports.setchunksize = new $wcm.FunctionType('setchunksize', [
                ['chunksize', $wcm.u64],
                ['timeend', $wcm.u64],
            ], undefined);
            imports.sendtransitiondatachunk = new $wcm.FunctionType('sendtransitiondatachunk', [
                ['signalid', $wcm.u32],
                ['totalchunks', $wcm.u32],
                ['chunknum', $wcm.u32],
                ['min', $wcm.float64],
                ['max', $wcm.float64],
                ['data', $wcm.wstring],
            ], undefined);
        })(imports = $.imports || ($.imports = {}));
        let exports;
        (function (exports) {
            exports.loadfile = new $wcm.FunctionType('loadfile', [
                ['size', $wcm.u64],
                ['fd', $wcm.u32],
                ['loadstatic', $wcm.bool],
                ['buffersize', $wcm.u32],
            ], undefined);
            exports.readbody = new $wcm.FunctionType('readbody', [], undefined);
            exports.unload = new $wcm.FunctionType('unload', [], undefined);
            exports.getchildren = new $wcm.FunctionType('getchildren', [
                ['id', $wcm.u32],
                ['startindex', $wcm.u32],
            ], $wcm.wstring);
            exports.getsignaldata = new $wcm.FunctionType('getsignaldata', [
                ['signalidlist', new $wcm.Uint32ArrayType()],
            ], undefined);
        })(exports = $.exports || ($.exports = {}));
    })($ = filehandler.$ || (filehandler.$ = {}));
})(filehandler || (exports.filehandler = filehandler = {}));
(function (filehandler) {
    var _;
    (function (_) {
        _.id = 'vscode:example/filehandler';
        _.witName = 'filehandler';
        let imports;
        (function (imports) {
            imports.functions = new Map([
                ['log', filehandler.$.imports.log],
                ['fsread', filehandler.$.imports.fsread],
                ['getsize', filehandler.$.imports.getsize],
                ['setscopetop', filehandler.$.imports.setscopetop],
                ['setvartop', filehandler.$.imports.setvartop],
                ['setmetadata', filehandler.$.imports.setmetadata],
                ['setchunksize', filehandler.$.imports.setchunksize],
                ['sendtransitiondatachunk', filehandler.$.imports.sendtransitiondatachunk]
            ]);
            imports.interfaces = new Map([
                ['Types', Types._]
            ]);
            function create(service, context) {
                return $wcm.$imports.create(_, service, context);
            }
            imports.create = create;
            function loop(service, context) {
                return $wcm.$imports.loop(_, service, context);
            }
            imports.loop = loop;
        })(imports = _.imports || (_.imports = {}));
        let exports;
        (function (exports_1) {
            exports_1.functions = new Map([
                ['loadfile', filehandler.$.exports.loadfile],
                ['readbody', filehandler.$.exports.readbody],
                ['unload', filehandler.$.exports.unload],
                ['getchildren', filehandler.$.exports.getchildren],
                ['getsignaldata', filehandler.$.exports.getsignaldata]
            ]);
            function bind(exports, context) {
                return $wcm.$exports.bind(_, exports, context);
            }
            exports_1.bind = bind;
        })(exports = _.exports || (_.exports = {}));
        function bind(service, code, portOrContext, context) {
            return $wcm.$main.bind(_, service, code, portOrContext, context);
        }
        _.bind = bind;
    })(_ = filehandler._ || (filehandler._ = {}));
})(filehandler || (exports.filehandler = filehandler = {}));
//# sourceMappingURL=filehandler.js.map