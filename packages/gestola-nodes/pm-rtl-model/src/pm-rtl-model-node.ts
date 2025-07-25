import { injectable } from '@theia/core/shared/inversify';
import { NodeDef, NodeAPI, Node } from "@node-red/registry";
import ES6Node from "@gestola/df-base-node";

//import getDecorators from "inversify-inject-decorators";
//let { lazyInject } = getDecorators(diContainer);

//import { ProjectService } from "@gestola/project-manager/lib/common/protocol";
//const ProjectServiceSymbol = getSymbol("@gestola/project-manager/lib/common/protocol", 'ProjectService');

@injectable()
export class ProjectManagerRTLModel extends ES6Node {

   // @lazyInject(ProjectServiceSymbol)
 //   private readonly projectService: ProjectService;

    constructor(node: Node, config: NodeDef, RED: NodeAPI){
        super(node);
        this.initialize();
    }

    initialize() {

        this.on("input", async (msg, send, done) => {
          
            const newMsg = {
                ...msg,
                //project: this.projectService.getProject()
            };
            send(newMsg);
            if (done) { done(); }
        });
        
    }

}