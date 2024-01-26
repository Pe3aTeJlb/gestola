import { injectable, inject } from '@theia/core/shared/inversify';
import { WorkspaceService } from "@theia/workspace/lib/browser/workspace-service";
import { MessageService } from '@theia/core/lib/common';
import { OpenFileDialogProps, FileDialogService } from '@theia/filesystem/lib/browser';
import { Event, Emitter, URI } from "@theia/core";
import { FileStat } from '@theia/filesystem/lib/common/files';
import * as utils from '../utils';
import { defProjStruct, Project } from './project';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';

export interface ProjectChangeEvent {
    readonly proj: Project;
}

export interface ProjectsListChangeEvent {
    readonly projects: Project[];
}

export interface ProjectFavoriteStatusChangeEvent {
    readonly project: Project;
}

@injectable()
export class ProjectManager implements FrontendApplicationContribution {
   
    @inject(WorkspaceService)
    private readonly workspaceService: WorkspaceService;

    @inject(FileDialogService)
    private readonly fileDialogService: FileDialogService;
    
    @inject(MessageService) 
    private readonly messageService: MessageService;

    @inject(FileService)
    protected readonly fileService: FileService;

    @inject(FrontendApplicationStateService)
    protected readonly stateService: FrontendApplicationStateService;

    projRoot: FileStat | undefined;

    openedProjects: Project[];
    currProj: Project | undefined;

    async onStart(): Promise<void> {
        this.stateService.reachedState('ready').then(
            () => {
                if(this.openedProjects.length > 1){
                    this.setProject(this.openedProjects[0]);
                }
            }
        );
    }

    configure(): void {
        this.doInit();
    }

    protected async doInit(): Promise<void> {

        console.log("proj man state",this.stateService.state);

        this.workspaceService.onWorkspaceChanged(() => this.refreshProjectsList());
    
        this.openedProjects = [];
        await this.refreshProjectsList();

        if(this.openedProjects.length > 1){
            this.setProject(this.openedProjects[0]);
        }
        
    }



    createProject() {

        const options: OpenFileDialogProps = {
            title: 'Create Gestola Project',
            openLabel: 'Create',
            canSelectMany: false,
            canSelectFiles: false,
            canSelectFolders: true
        };

        this.fileDialogService.showOpenDialog(options).then(async uri => {

            if (uri) {
                if(await utils.FSProvider.isDirEmpty(this.fileService, uri)){
                    utils.FSProvider.createDirStructure(this.fileService, uri, defProjStruct);
                    this.addProject([uri]);
                } else {
                    this.messageService.error("Selected directory is not empty");
                }
            }

        });
        
    }

    openProject(){

        const options: OpenFileDialogProps = {
            title: 'Open Gestola Project',
            openLabel: 'Open',
            canSelectMany: false,
            canSelectFiles: false,
            canSelectFolders: true
        };

        this.fileDialogService.showOpenDialog(options).then(async uri => {

            if (uri) {
                if(await utils.FSProvider.isDirEmpty(this.fileService, uri)){
                    this.messageService.error("Selected directory is not a Gestola project");
                } else {
                    if(await this.checkForGestolaProject(uri)){
                        if(this.openedProjects.filter(i => i.rootUri === uri).length > 0) {
                            this.setProject(this.openedProjects.filter(i => i.rootUri === uri)[0]);
                        } else {
                            this.messageService.info("Is Gestola project");
                            this.addProject([uri]);
                        }
                    } else {
                        this.messageService.error("Selected directory is not a Gestola project");
                    }
                }
            }

        });

    }

    private async refreshProjectsList(){
        this.openedProjects = [];
        let roots = await this.workspaceService.roots;
        for(let i = 0; i < roots.length; i++){
            if(await this.checkForGestolaProject(roots[i].resource)){
                let j = i;
                this.openedProjects.push(new Project(this.fileService, roots[j]));
            }
        }
        this.fireProjectsListChangeEvent();
    }

    async addProjectByDrop(uri: URI | undefined){
        
        if(!uri){
            return;
        }

        if(await this.checkForGestolaProject(uri)){
            this.addProject([uri]);
        } else {
            this.messageService.error("Selected directory is not a Gestola project");
        }

    }

    addProject(uri: URI[]){

        this.workspaceService.addRoot(uri);
        this.refreshProjectsList();

        //If project is only folder in workspace
        if(this.openedProjects.length === 1){
            this.setProject(this.openedProjects[0]);
        }

    }

    removeProject(proj: Project[]){
        this.workspaceService.removeRoots(proj.map(i => i.rootUri));
        this.refreshProjectsList();
    }   

    setProject(proj: Project){
        this.currProj = proj;
        this.fireProjectChangeEvent();
    }



    //Context

    setFavorite(proj: Project){
        proj.setFavorite();
        this.fireProjectFavoriteStatusChangeEvent(proj);
    }

   
    //Listeners

    protected readonly onDidChangeProjectEmitter = new Emitter<ProjectChangeEvent>();
    get onDidChangeProject(): Event<ProjectChangeEvent> {
		return this.onDidChangeProjectEmitter.event;
	}
    private fireProjectChangeEvent(){
        this.onDidChangeProjectEmitter.fire({proj: this.currProj} as ProjectChangeEvent);
    }

    protected readonly onDidChangeProjectListEmitter = new Emitter<ProjectsListChangeEvent>();
    get onDidChangeProjectList(): Event<ProjectsListChangeEvent> {
		return this.onDidChangeProjectListEmitter.event;
	}
    private fireProjectsListChangeEvent(){
        //vscode.commands.executeCommand('setContext', 'gestola-core.isProjOpened', this.openedProjects.length > 0);
        this.onDidChangeProjectListEmitter.fire({projects: this.openedProjects} as ProjectsListChangeEvent);
    }

    protected readonly onDidChangeFavoriteStatusEmitter = new Emitter<ProjectFavoriteStatusChangeEvent>();
    get onDidChangeProjectFavoriteStatus(): Event<ProjectFavoriteStatusChangeEvent> {
        return this.onDidChangeFavoriteStatusEmitter.event;
    }
    private fireProjectFavoriteStatusChangeEvent(proj: Project){
        this.onDidChangeFavoriteStatusEmitter.fire({project: proj} as ProjectFavoriteStatusChangeEvent);
    }



    //Utils

    private async checkForGestolaProject(path: URI){

        let dirs = Array.from((await utils.FSProvider.getSubDirList(this.fileService, path)).values());
        
        return (
            dirs.filter( i => i[0].match(new RegExp('system', "i"))).length   === 1 &&
            dirs.filter( i => i[0].match(new RegExp('rtl', "i"))).length      === 1 &&
            dirs.filter( i => i[0].match(new RegExp('topology', "i"))).length === 1 &&
            dirs.filter( i => i[0].match(new RegExp('other', "i"))).length    === 1 
        );

    }

    public getOpenedProject(uri: URI) : Project[] {
        return this.openedProjects.filter(i => i.rootUri.path.fsPath() === uri.path.fsPath());
    }

    public isOpenedProject(uri: URI) : boolean{
        return this.openedProjects.filter(i => i.rootUri.path.fsPath() === uri.path.fsPath()).length > 0;
    }


    onStop(): void {
        //throw new Error('Method not implemented.');
    }

}