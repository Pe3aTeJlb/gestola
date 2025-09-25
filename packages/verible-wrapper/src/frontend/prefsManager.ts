import { inject, injectable } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { PreferenceService  } from '@theia/core/lib/browser/preferences/preference-service';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import URI from '@theia/core/lib/common/uri';
import * as path from 'path';
import { ProjectManager, LLDChangeEvent } from '@gestola/project-manager';
import { CommandService } from '@theia/core/lib/common/command';

@injectable()
export class VeriblePrefsManager implements FrontendApplicationContribution {

    @inject(PreferenceService)
    protected readonly prefsService: PreferenceService;

    @inject(EnvVariablesServer)
    protected readonly envServer: EnvVariablesServer;

    @inject(ProjectManager)
    protected readonly projManager: ProjectManager;

    @inject(CommandService)
    protected readonly commandService: CommandService;

    private defaultFileListPath: string;

    async onStart() {

        let configDirUri = new URI(await this.envServer.getConfigDirUri()).path.fsPath();
        let veriblePath = path.join(configDirUri, 'verible', 'verible-verilog-ls');
        let filelistPath = path.join(configDirUri, 'verible.filelist');
        this.defaultFileListPath = filelistPath;

        this.prefsService.updateValue("verible.path", veriblePath);
        this.prefsService.updateValue("verible.arguments", [`--file_list_path=${this.defaultFileListPath}`]);

        this.projManager.onDidChangeLLD((event: LLDChangeEvent) => {
            this.setFilelistPath(event.lld.rtlModel.veribleFilelistUri.path.fsPath());
        });
    
        this.projManager.onDidDesignFilesInclude(() => {
            if(this.projManager.getCurrRTLModel()){
                this.setFilelistPath(this.projManager.getCurrRTLModel()!.veribleFilelistUri.path.fsPath());
                this.commandService.executeCommand("verible.restart");
            }
        });
    
        this.projManager.onDidDesignFilesExclude(() => {
            if(this.projManager.getCurrRTLModel()){
                this.setFilelistPath(this.projManager.getCurrRTLModel()!.veribleFilelistUri.path.fsPath());
                this.commandService.executeCommand("verible.restart");
            }
        });

    }

    private setFilelistPath(filelistPath: string){
        this.prefsService.updateValue("verible.arguments", [`--file_list_path=${filelistPath}`]);
    }

}