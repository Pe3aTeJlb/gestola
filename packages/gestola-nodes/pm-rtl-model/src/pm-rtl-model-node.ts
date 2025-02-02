import { injectable } from '@theia/core/shared/inversify';
import { NodeDef, NodeAPI, Node } from "@node-red/registry";
import ES6Node from "@gestola/df-base-node";
import { getSymbol } from "@gestola/df-base-node";

const { container } = require("@gestola/electron-app/lib/backend/main");
import getDecorators from "inversify-inject-decorators";
let { lazyInject } = getDecorators(container);

import { ProjectService } from "@gestola/project-manager/lib/common/protocol2";
const ProjectServiceSymbol = getSymbol("@gestola/project-manager/lib/common/protocol2", 'ProjectService');

@injectable()
export class ProjectManagerRTLModel extends ES6Node {

    @lazyInject(ProjectServiceSymbol)
    private readonly projectService: ProjectService;

    constructor(node: Node, config: NodeDef, RED: NodeAPI){
        super(node);
        this.initialize();
    }

    initialize() {

        this.on("input", async (msg, send, done) => {
          
            console.log("bbbbbbbbb", this.projectService);

            let rtl_model = await this.projectService.getRTLModelFiles();
            let projConfig = this.projectService.getProjectConfigState();

            const newMsg = {
                ...msg,
                rtl:rtl_model,
                config:projConfig
            };
            send(newMsg);
            if (done) { done(); }
        });
        
    }

}