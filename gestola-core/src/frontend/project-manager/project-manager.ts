import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution, CommonMenus } from '@theia/core/lib/browser';
import { WorkspaceService } from "@theia/workspace/lib/browser/workspace-service";
import {  CommandRegistry, MessageService } from '@theia/core/lib/common';
import { OpenFileDialogProps, FileDialogService } from '@theia/filesystem/lib/browser';
import { Event, Emitter, URI } from "@theia/core";
import { FileStat } from '@theia/filesystem/lib/common/files';
import * as utils from '../utils';
import { defProjStruct, Project } from './project';
import { ProjectManagerCommands } from './project-manager-commands';
import { MenuModelRegistry } from '@theia/core/lib/common';

export interface ProjectChangeEvent {
    readonly proj: Project;
}

export interface ProjectsListChangeEvent {
    readonly projects: Project[];
}

export interface ProjectFavoriteStatusChangeEvent {
    readonly project: Project;
}

//export const PROJECT_MANAGER_FILE = [...CommonMenus.FILE, '2_workspace'];

@injectable()
export class ProjectManager implements FrontendApplicationContribution {

    @inject(WorkspaceService)
    private readonly workspaceService: WorkspaceService;

    @inject(FileDialogService)
    private readonly fileDialogService: FileDialogService;
    
    @inject(MessageService) 
    private readonly messageService: MessageService;

    @inject(CommandRegistry)
    protected readonly commandRegistry: CommandRegistry;

    @inject(MenuModelRegistry)
    protected readonly menuRegistry: MenuModelRegistry;

    projRoot: FileStat | undefined;

    openedProjects: Project[];
    currProj: Project | undefined;

    private _onDidChangeProject: Emitter<ProjectChangeEvent>;
    private _onDidChangeProjectList: Emitter<ProjectsListChangeEvent>;
    private _onDidChangeFavoriteStatus: Emitter<ProjectFavoriteStatusChangeEvent>;

    @postConstruct()
    protected init(): void {
        this.doInit();
    }

    protected async doInit(): Promise<void> {

        this.workspaceService.onWorkspaceChanged(() => this.refreshProjectsList());

        this._onDidChangeProject = new Emitter<ProjectChangeEvent>();
        this._onDidChangeProjectList = new Emitter<ProjectsListChangeEvent>();
        this._onDidChangeFavoriteStatus = new Emitter<ProjectFavoriteStatusChangeEvent>();
    
        this.openedProjects = [];

        this.refreshProjectsList();
        
        this.openedProjects.length > 0 
        ? this.currProj = this.openedProjects[0]
        : this.currProj = undefined;

        this.commandRegistry.registerCommand(ProjectManagerCommands.CREATE_GESTOLA_PROJECT, {
            execute: () => this.createProject()
        });

        this.commandRegistry.registerCommand(ProjectManagerCommands.OPEN_GESTOLA_PROJECT, {
            execute: () => this.openProject()
        });

        this.menuRegistry.registerMenuAction(CommonMenus.FILE, {
            commandId: ProjectManagerCommands.CREATE_GESTOLA_PROJECT.id,
            order: 'a'
        });

        this.menuRegistry.registerMenuAction(CommonMenus.FILE, {
            commandId: ProjectManagerCommands.OPEN_GESTOLA_PROJECT.id,
            order: 'a'
        });

    }



    createProject() {

        const options: OpenFileDialogProps = {
            title: 'Create Gestola Project',
            openLabel: 'Create',
            canSelectMany: false,
            canSelectFiles: false,
            canSelectFolders: true
        };

        this.fileDialogService.showOpenDialog(options).then(uri => {

            if (uri) {
                if(utils.FSProvider.isDirEmpty(uri.path.fsPath())){
                    utils.FSProvider.createDirStructure(uri.path.fsPath(), defProjStruct);
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

        this.fileDialogService.showOpenDialog(options).then(uri => {

            if (uri) {
                if(utils.FSProvider.isDirEmpty(uri.path.fsPath())){
                    this.messageService.error("Selected directory is not a Gestola project");
                } else {
                    if(this.checkForGestolaProject(uri.path.fsPath())){
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

    private refreshProjectsList(){
        this.openedProjects = [];
        for(let i = 0; i < this.workspaceService.tryGetRoots().length; i++){
            if(this.checkForGestolaProject(this.workspaceService.tryGetRoots()[i].resource.path.fsPath())){
                let j = i;
                this.openedProjects.push(new Project(this.workspaceService.tryGetRoots()[j]));
            }
        }
        this.fireProjectsListChangeEvent();
    }

    addProjectByDrop(uri: URI | undefined){
        
        if(!uri){
            return;
        }

        if(this.checkForGestolaProject(uri.path.fsPath())){
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
    private fireProjectChangeEvent(){
        this._onDidChangeProject.fire({proj: this.currProj} as ProjectChangeEvent);
    }

    private fireProjectsListChangeEvent(){
        //vscode.commands.executeCommand('setContext', 'gestola-core.isProjOpened', this.openedProjects.length > 0);
        this._onDidChangeProjectList.fire({projects: this.openedProjects} as ProjectsListChangeEvent);
    }

    private fireProjectFavoriteStatusChangeEvent(proj: Project){
        this._onDidChangeFavoriteStatus.fire({project: proj} as ProjectFavoriteStatusChangeEvent);
    }

    get onDidChangeProject(): Event<ProjectChangeEvent> {
		return this._onDidChangeProject.event;
	}

    get onDidChangeProjectList(): Event<ProjectsListChangeEvent> {
		return this._onDidChangeProjectList.event;
	}

    get onDidChangeProjectFavoriteStatus(): Event<ProjectFavoriteStatusChangeEvent> {
        return this._onDidChangeFavoriteStatus.event;
    }



    //Utils

    private checkForGestolaProject(path: string){

        let dirs = utils.FSProvider.getSubDirList(path);

        return (
            dirs.filter( i => i.match(new RegExp('system', "i"))).length   === 1 &&
            dirs.filter( i => i.match(new RegExp('rtl', "i"))).length      === 1 &&
            dirs.filter( i => i.match(new RegExp('topology', "i"))).length === 1 &&
            dirs.filter( i => i.match(new RegExp('other', "i"))).length    === 1 
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