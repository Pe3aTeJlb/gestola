import { injectable, inject } from '@theia/core/shared/inversify';
import { WorkspaceService } from "@theia/workspace/lib/browser/workspace-service";
import { MessageService, QuickPickService, QuickPickValue, nls } from '@theia/core/lib/common';
import { OpenFileDialogProps, FileDialogService } from '@theia/filesystem/lib/browser';
import { Event, Emitter, URI } from "@theia/core";
import { FileStat } from '@theia/filesystem/lib/common/files';
import  { Project }  from '../../common/project';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { DatabaseBackendService, ProjectManagerBackendService, Template } from '../../common/protocol';

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
    private readonly fileService: FileService;

    @inject(FrontendApplicationStateService)
    private readonly stateService: FrontendApplicationStateService;

    @inject(QuickPickService)
    private readonly quickPickService: QuickPickService;

    @inject(ProjectManagerBackendService)
    private readonly projManagerBackendService: ProjectManagerBackendService;

    @inject(DatabaseBackendService)
    private readonly databaseBackendService: DatabaseBackendService;

    projRoot: FileStat | undefined;

    protected openedProjects: Project[] = [];
    protected currProj: Project | undefined = undefined;
    protected projToSet: URI | undefined = undefined;

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

        this.workspaceService.onWorkspaceChanged(async () => {

            await this.refreshProjectsList();

            //If project is only folder in workspace
            if(this.getProjectsCount() == 1){
                this.setProject(this.getOpenedProjects()[0]);
            } else if(this.projToSet !== undefined){
                this.setProject(this.getOpenedProjects().filter(i => i.rootUri.path.fsPath() == this.projToSet?.path.fsPath())[0]);
                this.projToSet = undefined;
            }

        });
    
        await this.refreshProjectsList();

        if(this.openedProjects.length > 1){
            this.setProject(this.openedProjects[0]);
        }
        
    }



    async createProject() {

        const templates = await this.projManagerBackendService.getTemplates();
        const items: QuickPickValue<Template>[] = templates.map((e: Template) => <QuickPickValue<Template>>{ label: e.label, value: e });
        let quickPickResult = await this.quickPickService.show(items);
        if(!quickPickResult){
            return;
        }

        const options: OpenFileDialogProps = {
            title: nls.localize("gestola/project-manager/create-gestola-project", "Create Gestola Project"),
            openLabel: nls.localize("gestola/project-manager/create", "Create"),
            canSelectMany: false,
            canSelectFiles: false,
            canSelectFolders: true
        };

        this.fileDialogService.showOpenDialog(options).then(async uri => {

            if (uri) {
                if(await this.isDirEmpty(this.fileService, uri)){
                    if(quickPickResult?.value){
                        await this.projManagerBackendService.createProjectFromTemplate(quickPickResult.value.id, uri);
                        this.projToSet = uri;
                        await this.addProject([uri]);
                    }
                } else {
                    this.messageService.error("Selected directory is not empty");
                }
            }

        });
        
    }

    async openProject(){

        const options: OpenFileDialogProps = {
            title: nls.localize("gestola/project-manager/open-gestola-project", "Open Gestola Project"),
            openLabel: nls.localize("gestola/project-manager/open", "Open"),
            canSelectMany: false,
            canSelectFiles: false,
            canSelectFolders: true
        };

        this.fileDialogService.showOpenDialog(options).then(async uri => {
            if (uri) {
                if(await this.isDirEmpty(this.fileService, uri)){
                    this.messageService.error("Selected directory is not a Gestola project");
                } else {
                    if(await this.checkForGestolaProject(uri)){
                        if(this.openedProjects.filter(i => i.rootUri === uri).length > 0) {
                            this.setProject(this.openedProjects.filter(i => i.rootUri === uri)[0]);
                        } else {
                            this.messageService.info("Is Gestola project");
                            this.projToSet = uri;
                            await this.addProject([uri]);
                        }
                    } else {
                        this.messageService.error("Selected directory is not a Gestola project");
                    }
                }
            }

        });

    }

    private async refreshProjectsList(){
        this.openedProjects.length = 0;
        let roots = await this.workspaceService.roots;
        for(let i = 0; i < roots.length; i++){
            if(await this.checkForGestolaProject(roots[i].resource)){
                let j = i;
                this.openedProjects.push(new Project(roots[j].resource));
            }
        }
        this.projManagerBackendService.updateOpenedProjects(this.openedProjects);
        this.fireProjectsListChangeEvent();
    }

    async addProjectByDrop(uri: URI | undefined){
        
        if(!uri){
            return;
        }

        if(await this.checkForGestolaProject(uri)){
            await this.addProject([uri]);
        } else {
            this.messageService.error("Selected directory is not a Gestola project");
        }

    }

    async addProject(uri: URI[]){
        this.workspaceService.addRoot(uri);
    }

    async removeProject(proj: Project[]){
        this.workspaceService.removeRoots(proj.map(i => i.rootUri));
    }

    setProject(proj: Project){
        this.currProj = proj;
        this.projManagerBackendService.updateCurrProject(proj);
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
        this.onDidChangeProjectListEmitter.fire({projects: this.getOpenedProjects()} as ProjectsListChangeEvent);
    }

    protected readonly onDidChangeFavoriteStatusEmitter = new Emitter<ProjectFavoriteStatusChangeEvent>();
    get onDidChangeProjectFavoriteStatus(): Event<ProjectFavoriteStatusChangeEvent> {
        return this.onDidChangeFavoriteStatusEmitter.event;
    }
    private fireProjectFavoriteStatusChangeEvent(proj: Project){
        this.onDidChangeFavoriteStatusEmitter.fire({project: proj} as ProjectFavoriteStatusChangeEvent);
    }



    //Utils

    private async checkForGestolaProject(path: URI) {

        if(! await this.fileService.exists(path)){
            return;
        }

        let dirs = Array.from((await this.getSubDirList(this.fileService, path)).values());
        let check = true;
        
        for (let regexp of Project.regexp) {
            if (dirs.filter( i => i[0].match(regexp)).length !== 1) {check = false; break;}
        }

        return check;

    }

    private async isDirEmpty(fileService: FileService, path: URI): Promise<boolean> {
        return (await (await fileService.activateProvider(path.scheme)).readdir(path)).length === 0;
    }

    private async getSubDirList(fileService: FileService, path: URI) {
        return await (await fileService.activateProvider(path.scheme)).readdir(path);
    }

    public getOpenedProjects(): Project[]{
        return this.openedProjects.slice();
    }

    public getOpenedProject(uri: URI) : Project[] {
        return this.openedProjects.filter(i => i.rootUri.path.fsPath() === uri.path.fsPath());
    }

    public isOpenedProject(uri: URI) : boolean{
        return this.openedProjects.filter(i => i.rootUri.path.fsPath() === uri.path.fsPath()).length > 0;
    }

    public getProjectsCount(): number {
        return this.openedProjects.length;
    }

    public getCurrProject(): Project | undefined {
        return this.currProj;
    }

    public getFileSerivce(): FileService {
        return this.fileService;
    }

    public getDatabaseService(): DatabaseBackendService {
        return this.databaseBackendService;
    }

    onStop(): void {
        //throw new Error('Method not implemented.');
    }

}