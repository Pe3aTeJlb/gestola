import { URI } from '@theia/core/lib/common/uri';
import { IProject } from '../../common/project';
import { Solution } from './solution';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileStat } from '@theia/filesystem/lib/common/files';

export const defProjStruct = ['.theia', 'database', 'system', '.config'];

export class Project implements IProject {

    fileService: FileService

    projName: string;

    rootFStat: FileStat;
    rootUri: URI;

    systemUri: URI;
    databesUri: URI;
    theiaUri: URI;
    configUri: URI;

    curSolution: Solution | undefined;
    solutions: Solution[] = [];
    solutionDepTree: undefined;

    isFavorite: boolean = false;

    public static regexp =  [
                                new RegExp('system'), 
                                new RegExp('database'),
                                new RegExp('\.theia'),
                                new RegExp('\.config'), 
                            ];

    public async constructProject(fileService: FileService, projectRoot: FileStat): Promise<Project>{

        this.fileService = fileService;

        this.rootFStat = projectRoot;

        this.projName = projectRoot.name;

        this.rootUri = this.rootFStat.resource.normalizePath();
        this.systemUri = this.rootUri.resolve('system');
        this.databesUri = this.rootUri.resolve('database');
        this.theiaUri = this.rootUri.resolve('.theia');
        this.configUri = this.rootUri.resolve('.config');

        await this.getSolutionList(this.rootUri);

        this.curSolution = this.solutions[0];

        return Promise.resolve(this);

    }

    private async getSolutionList(projRoot: URI) {

        let dirs = Array.from((await this.readDir(projRoot)).values());

        for (let regexp of Project.regexp) {
            dirs = dirs.filter(i => !i[0].match(regexp));
        }

        for(let dir of dirs){
            let uri = new URI(projRoot.path.join(dir[0]).fsPath());
            if(await this.checkSolutionStruct(uri)){
                this.solutions.push(new Solution(this.fileService, uri));
            }
        }

    }

    private async checkSolutionStruct(path: URI){

        let dirs = Array.from((await this.readDir(path)).values());
        let check = true;

        for (let regexp of Solution.regexp) {
            if (dirs.filter( i => i[0].match(regexp)).length !== 1) {check = false; break;}
        }

        return check;

    }

    private async readDir(path: URI) {
        return await (await this.fileService.activateProvider(path.scheme)).readdir(path);
    }



    public getCurrSolution(): Solution | undefined{
        return this.curSolution;
    }

    public setCurrSolution(solution: Solution){
        this.curSolution = solution;
    }

    public removeSolution(solutions: Solution[]){
        this.solutions = this.solutions.filter(i => !solutions.includes(i));
    }

    public addSolution(sol: Solution){
        this.solutions.push(sol);
    }



    public getRootUri(): URI{
        return this.rootUri;
    }

    public getSystemUri(): URI{
        return this.systemUri;
    }

    public getDatabesUri(): URI{
        return this.databesUri;
    }

    public getTheiaUri(): URI{
        return this.theiaUri;
    }

    public getConfigUri(): URI {
        return this.configUri;
    }

    public async systemFolderFStat(): Promise<FileStat> {
        return await this.fileService.resolve(this.systemUri);
    }

    setFavorite() {
        this.isFavorite = !this.isFavorite;
    }

}