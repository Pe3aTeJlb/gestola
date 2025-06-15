import { injectable, inject } from '@theia/core/shared/inversify';
import { WorkspaceService } from "@theia/workspace/lib/browser/workspace-service";
import { MessageService, QuickInputService, QuickPickService, QuickPickValue, nls } from '@theia/core/lib/common';
import { OpenFileDialogProps, FileDialogService } from '@theia/filesystem/lib/browser';
import { Event, Emitter, URI } from "@theia/core";
import { FileStat } from '@theia/filesystem/lib/common/files';
import  { Project }  from './project';
import { ConfirmDialog, Dialog, FrontendApplication, FrontendApplicationContribution, OnWillStopAction } from '@theia/core/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { DatabaseBackendService, ProjectManagerBackendService, ProjectTemplate, RTLModelTemplate } from '../../common/protocol';
import { RTLModel, TopLevelModule } from './rtl-model';
import { VeriblePrefsManager } from "@gestola/verible-wrapper/lib/frontend/prefsManager";

export interface ProjectChangeEvent {
    readonly proj: Project;
}

export interface ProjectsListChangeEvent {
    readonly projects: Project[];
}

export interface RTLModelChangeEvent {
    readonly model: RTLModel;
}

export interface RTLModelListChangeEvent {
    readonly models: RTLModel[];
}

export interface ProjectFavoriteStatusChangeEvent {
    readonly project: Project;
}

export interface DesignFilesIncludeEvent {
    readonly uris: URI[];
}

export interface DesignFilesExcludeEvent {
    readonly uris: URI[];
}

export interface DesignTopModuleChangeEvent {
    readonly module: TopLevelModule | undefined;
    complete: () => void
}

export interface TestBenchesChangeEvent {
    readonly uris: URI[];
    complete: () => void
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

    @inject(QuickInputService)
    private readonly quickInputService: QuickInputService;

    @inject(ProjectManagerBackendService)
    private readonly projManagerBackendService: ProjectManagerBackendService;

    @inject(DatabaseBackendService)
    private readonly databaseBackendService: DatabaseBackendService;

    @inject(VeriblePrefsManager)
    private readonly veriblePrefsManager: VeriblePrefsManager;

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

        this.onDidChangeProject((event: ProjectChangeEvent) => {
            let sol = event.proj.getCurrRTLModel();
            if(sol){
                this.fireRTLModelChangeEvent(sol);
            }
        });
        this.onDidChangeRTLModel((event: RTLModelChangeEvent) => {
            this.veriblePrefsManager.setFilelistPath(event.model.veribleFilelistUri.path.fsPath());
            this.fireDesignTopModuleChangeEvent(event.model.topLevelModule);
        });
    
        //await this.refreshProjectsList();

        if(this.openedProjects.length > 1){
            this.setProject(this.openedProjects[0]);
        }
        
    }

    onWillStop(app: FrontendApplication): boolean | undefined | OnWillStopAction<any>{

        return  {
            action: async () => {
                this.saveProjectsMetaData();
                return true;
            },
            reason: 'Saving projects metadata before close',
            priority: 1001
        };

    };

    /* Project */

    async createProject() {

        const templates = await this.projManagerBackendService.getProjectTemplates();
        const items: QuickPickValue<ProjectTemplate>[] = templates.map((e: ProjectTemplate) => <QuickPickValue<ProjectTemplate>>{ label: e.label, value: e });
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
                if(await this.isDirEmpty(uri)){
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
                if(await this.isDirEmpty(uri)){
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
                if(this.openedProjects.filter(e => e.rootUri.isEqual(roots[j].resource)).length == 0){
                    this.openedProjects.push(await (new Project()).constructProject(this, roots[j]));
                }
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
        proj.forEach(async e => await this.saveProjectMetaData(e));
        this.workspaceService.removeRoots(proj.map(i => i.rootUri));
    }

    setProject(proj: Project){
        this.currProj = proj;
        this.projManagerBackendService.updateCurrProject(proj);
        this.fireProjectChangeEvent();
    }

    async saveProjectsMetaData(){
        this.openedProjects.forEach(async e => await this.saveProjectMetaData(e));
    }

    async saveProjectMetaData(proj: Project){
       proj.saveMetadata();
    }


    /*  RTL Model */

    async createRTLModel() {

        if(!this.currProj) return;

        let quickInputResult = await this.quickInputService.input();

        if(!quickInputResult){
            return;
        }

        if(this.currProj.rtlModels.map(e => e.rtlModelName).includes(quickInputResult)){
            this.messageService.error(`RTL Model ${quickInputResult} already exists`);
            return;
        }

        const templates = await this.projManagerBackendService.getRTLModelTemplates();
        const items: QuickPickValue<RTLModelTemplate>[] = templates.map((e: RTLModelTemplate) => <QuickPickValue<RTLModelTemplate>>{ label: e.label, value: e });
        let quickPickResult = await this.quickPickService.show(items);
        if(!quickPickResult){
            return;
        }

        let modelUri = this.currProj.rootUri.resolve(quickInputResult);
        await this.projManagerBackendService.createRTLModelFromTemplate(quickPickResult.value.id, modelUri);
        await this.addRTLModel(modelUri);

    }


    async addRTLModel(modelUri: URI){
        if(this.currProj){
            let model = new RTLModel(this, modelUri);
            this.currProj.addRTLModel(model);
            this.fireRTLModelListChangeEvent();
            this.setRTLModel(model);
        }
    }

    async removeRTLModel(model: RTLModel[]){

        if(this.currProj){

            const shouldDelete = await new ConfirmDialog({
                title: 'Delete confirmation',
                msg: model.length > 1 ? `Confirm the deletion of multiple rtl models` : `Confirm the deletion of ${model[0].rtlModelName}`,
                ok: Dialog.YES,
                cancel: Dialog.CANCEL,
            }).open();

            if(shouldDelete){

                this.currProj.removeRTLModel(model);
                for(let s of model){
                    await this.fileService.delete(s.rtlModelUri, {
                        recursive: true,
                        useTrash: true
                    });
                }
                this.fireRTLModelListChangeEvent();

            }

        }

    }

    setRTLModel(model: RTLModel): void {
        if(this.currProj){
            this.currProj.setCurrRTLModel(model);
            this.fireRTLModelChangeEvent(model)
        }
    }

    async selectModule(items: string[]): Promise<string | undefined> {

        const qitems: QuickPickValue<string>[] = items.map((e: string) => <QuickPickValue<string>>{ label: e, value: e });
        let quickPickResult = await this.quickPickService.show(qitems);
        return quickPickResult ? quickPickResult.value : undefined; 

    }

    public async setTopModule(uri: URI | undefined){
        if(uri && this.currProj?.curRTLModel){
            let descriptions = this.currProj.curRTLModel.hdlFilesDescription.filter(e => e.uri.isEqual(uri));
            if(descriptions.length > 0){
                if(descriptions.length > 1){
                    let moduleName = await this.selectModule(descriptions.map(e => e.module.name));
                    if(moduleName) this.fireDesignTopModuleChangeEvent({name: moduleName, uri: descriptions[0].uri});
                } else {
                    this.fireDesignTopModuleChangeEvent({name: descriptions[0].module.name, uri: descriptions[0].uri});
                }
            }
        } else {
            this.fireDesignTopModuleChangeEvent(undefined);
        }
    }

    public includeFilesIntoDesign(uris: URI[]){
        this.fireDesignFilesIncludeEvent(uris);
    };

    public excludeFilesFromDesign(uris: URI[]){
        this.fireDesignFilesExcludeEvent(uris);
    }

    public addTestBench(uris: URI[]){
        this.fireAddTestBench(uris);
    }

    public removeTestBench(uris: URI[]){
        this.fireRemoveTestBench(uris);
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


    protected readonly onDidChangeRTLModelEmitter = new Emitter<RTLModelChangeEvent>();
    get onDidChangeRTLModel(): Event<RTLModelChangeEvent> {
        return this.onDidChangeRTLModelEmitter.event;
    }
    private fireRTLModelChangeEvent(model: RTLModel){
        this.onDidChangeRTLModelEmitter.fire({model: model} as RTLModelChangeEvent);
    }


    protected readonly onDidChangeRTLModelListEmitter = new Emitter<RTLModelListChangeEvent>();
    get onDidChangeRTLModelList(): Event<RTLModelListChangeEvent> {
		return this.onDidChangeRTLModelListEmitter.event;
	}
    private fireRTLModelListChangeEvent(){
        this.onDidChangeRTLModelListEmitter.fire({models: this.currProj?.rtlModels} as RTLModelListChangeEvent);
    }


    protected readonly onDidChangeFavoriteStatusEmitter = new Emitter<ProjectFavoriteStatusChangeEvent>();
    get onDidChangeProjectFavoriteStatus(): Event<ProjectFavoriteStatusChangeEvent> {
        return this.onDidChangeFavoriteStatusEmitter.event;
    }
    private fireProjectFavoriteStatusChangeEvent(proj: Project){
        this.onDidChangeFavoriteStatusEmitter.fire({project: proj} as ProjectFavoriteStatusChangeEvent);
    }


    protected readonly onDidDesignFilesIncludeEmitter = new Emitter<DesignFilesIncludeEvent>();
    get onDidDesignFilesInclude(): Event<DesignFilesIncludeEvent> {
        return this.onDidDesignFilesIncludeEmitter.event;
    }
    private fireDesignFilesIncludeEvent(uris: URI[]){
        this.onDidDesignFilesIncludeEmitter.fire({uris: uris} as DesignFilesIncludeEvent);
    }


    protected readonly onDidDesignFilesExcludeEmitter = new Emitter<DesignFilesExcludeEvent>();
    get onDidDesignFilesExclude(): Event<DesignFilesExcludeEvent> {
        return this.onDidDesignFilesExcludeEmitter.event;
    }
    private fireDesignFilesExcludeEvent(uris: URI[]){
        this.onDidDesignFilesExcludeEmitter.fire({uris: uris} as DesignFilesExcludeEvent);
    }


    protected readonly onDidChangeDesignTopModuleEmitter = new Emitter<DesignTopModuleChangeEvent>();
    get onDidChangeDesignTopModule(): Event<DesignTopModuleChangeEvent> {
        return this.onDidChangeDesignTopModuleEmitter.event;
    }
    private fireDesignTopModuleChangeEvent(module: TopLevelModule | undefined){
        this.onDidChangeDesignTopModuleEmitter.fire({module: module, complete: () => {
            this.fireDesignTopModuleChangedEvent(this.getCurrProject()?.getCurrRTLModel()?.topLevelModule)
        }} as DesignTopModuleChangeEvent);
    }

    protected readonly onDidChangedDesignTopModuleEmitter = new Emitter<DesignTopModuleChangeEvent>();
    get onDidChangedDesignTopModule(): Event<DesignTopModuleChangeEvent> {
        return this.onDidChangedDesignTopModuleEmitter.event;
    }
    private fireDesignTopModuleChangedEvent(module: TopLevelModule | undefined){
        this.onDidChangedDesignTopModuleEmitter.fire({module: module} as DesignTopModuleChangeEvent);
    }

    protected readonly onDidAddTestBenchEmitter = new Emitter<TestBenchesChangeEvent>();
    get onDidAddTestBench(): Event<TestBenchesChangeEvent> {
        return this.onDidAddTestBenchEmitter.event;
    }
    private fireAddTestBench(uris: URI[]){
        this.onDidAddTestBenchEmitter.fire({uris: uris, complete: () => {
            this.fireTestBenchesChangedEvent(uris)
        }} as TestBenchesChangeEvent);
    }

    protected readonly onDidRemoveTestBenchEmitter = new Emitter<TestBenchesChangeEvent>();
    get onDidRemoveTestBench(): Event<TestBenchesChangeEvent> {
        return this.onDidRemoveTestBenchEmitter.event;
    }
    private fireRemoveTestBench(uris: URI[]){
        this.onDidRemoveTestBenchEmitter.fire({uris: uris, complete: () => {
            this.fireTestBenchesChangedEvent(uris)
        }} as TestBenchesChangeEvent);
    }

    protected readonly onDidTestBenchesChangedEmitter = new Emitter<URI[]>();
    get onDidChangedTestBenches(): Event<URI[]> {
        return this.onDidTestBenchesChangedEmitter.event;
    }
    private fireTestBenchesChangedEvent(uris: URI[]){
        this.onDidTestBenchesChangedEmitter.fire(uris);
    }



    //Utils

    private async checkForGestolaProject(path: URI) {

        if(! await this.fileService.exists(path)){
            return;
        }

        let dirs = Array.from((await this.getSubDirList(path)).values());
        let check = true;
        
        for (let regexp of Project.regexp) {
            if (dirs.filter( i => i[0].match(regexp)).length !== 1) {check = false; break;}
        }

        return check;

    }

    private async isDirEmpty(path: URI): Promise<boolean> {
        return (await (await this.fileService.activateProvider(path.scheme)).readdir(path)).length === 0;
    }

    private async getSubDirList(path: URI) {
        return await (await this.fileService.activateProvider(path.scheme)).readdir(path);
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



}