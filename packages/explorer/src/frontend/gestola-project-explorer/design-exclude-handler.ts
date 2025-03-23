import { injectable, inject } from '@theia/core/shared/inversify';
import URI from '@theia/core/lib/common/uri';
import { UriCommandHandler } from '@theia/core/lib/common/uri-command-handler';

import { ProjectManager } from '@gestola/project-manager/lib/frontend/project-manager/project-manager';
import { hdlExt } from '@gestola/project-manager/lib/frontend/project-manager/solution';

@injectable()
export class DesignFilesExcludeHandler implements UriCommandHandler<URI[]> {

    @inject(ProjectManager) 
    protected readonly projManager: ProjectManager;


    isVisible(uris: URI[]): boolean{

        let check = true;

        if(!this.projManager.getCurrProject()) return false;
        
        for (let uri of uris) {
            if(!hdlExt.includes(uri.path.ext)){check = false; break;}
        }

        return check;

    }

    isEnabled(uris: URI[]): boolean {

        let sol = this.projManager.getCurrProject()?.getCurrSolution();
        if(!sol) return false;
        if(uris.filter(e => sol?.rtlUri.isEqualOrParent(e)).length < uris.length) return false;
        return uris.filter(e => this.projManager.getCurrProject()?.getCurrSolution()?.excludedDesignHDLFiles.find(i => i.isEqual(e)) === undefined).length > 0;

    }
    
    execute(uris: URI[]){
        this.projManager.excludeFilesFromDesign(uris.filter(e => this.projManager.getCurrProject()?.getCurrSolution()?.excludedDesignHDLFiles.find(i => e.isEqual(i)) === undefined));
    }


}