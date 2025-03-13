import { URI } from '@theia/core/lib/common/uri';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileStat, FileType, FileChangeType } from '@theia/filesystem/lib/common/files';
import { ISolution } from '../../common/solution';

export const defSolutionStruct = ['rtl', 'fpga', 'topology', 'other', '.config'];

export class Solution implements ISolution{

    fileService: FileService;

    solutionName: string;

    solutionUri: URI;
    rtlUri: URI;
    fpgaUri: URI;
    topologyUri: URI;
    otherUri: URI;
    configUri: URI;

    veribleFilelistUri: URI;

    target: string = 'zybo';

    isFavorite: boolean = false;

    hdlExt = ['.v', '.vh', '.sv', '.svh'];
    indexedHDLFiles: URI[] = [];

    public static regexp =  [
                                new RegExp('rtl'), 
                                new RegExp('fpga'), 
                                new RegExp('topology'), 
                                new RegExp('other'),
                                new RegExp('.config')
                            ];

                            
    
    constructor(fileservice: FileService, solutionRoot: URI){

        this.fileService = fileservice;

        let a = solutionRoot.path.fsPath().split('/').pop();
        if(a) this.solutionName = a;

        this.solutionUri = solutionRoot.normalizePath();
        this.rtlUri = this.solutionUri.resolve('rtl');
        this.fpgaUri = this.solutionUri.resolve('fpga');
        this.topologyUri = this.solutionUri.resolve('topology');
        this.otherUri = this.solutionUri.resolve('other');
        this.configUri = this.solutionUri.resolve('.config');
        this.veribleFilelistUri = this.configUri.resolve('verible.filelist');    

        this.fileService.onDidFilesChange((event) => event.changes.forEach(i => {
            if(this.rtlUri.isEqualOrParent(i.resource)){
                if(this.hdlExt.includes(i.resource.path.ext)){

                    if((i.type == FileChangeType.ADDED || i.type == FileChangeType.UPDATED) && !this.indexedHDLFiles.includes(i.resource)){
                        this.indexedHDLFiles.push(i.resource);
                    } else if (i.type == FileChangeType.DELETED){
                        this.indexedHDLFiles = this.indexedHDLFiles.filter(e => !e.isEqual(i.resource));
                    } 
                    this.fileService.write(this.veribleFilelistUri, this.indexedHDLFiles.map(e => e.path.fsPath()).join('\n'));
                }
            }
        }));

        this.indexHDLFiles();

    }

    private async indexHDLFiles(): Promise<void>{
        this.indexedHDLFiles = [];
        await this.processDir(this.rtlUri);
        await this.fileService.write(this.veribleFilelistUri, this.indexedHDLFiles.map(e => e.path.fsPath()).join('\n'));
    }

    private async processDir(baseUri: URI) {
        let contents = Array.from((await (await this.fileService.activateProvider(baseUri.scheme)).readdir(baseUri)).values());
        for(let content of contents){
            if(content[1] == FileType.File){
                let extIndex = content[0].lastIndexOf('.');
                let ext = extIndex === -1 ? '' : content[0].substring(extIndex);
                if(this.hdlExt.includes(ext)){
                    this.indexedHDLFiles.push(new URI(baseUri.path.join(content[0]).fsPath()));
                }
            } else if (content[1] == FileType.Directory){
                let uri = new URI(baseUri.path.join(content[0]).fsPath());
                await this.processDir(uri);
            }
        }
    }

    public getRootUri(): URI{ 
        return this.solutionUri;
    }
    
    public getRTLUri(): URI{
        return this.rtlUri;
    }

    public getFPGAtUri(): URI{
        return this.fpgaUri;
    }

    public getTopologyUri(): URI{
        return this.topologyUri;
    }

    public getOthertUri(): URI{
        return this.otherUri;
    }

    public async rtlFolderFStat(): Promise<FileStat> {
        return await this.fileService.resolve(this.rtlUri);
    }
    
    public async fpgaFolderFStat(): Promise<FileStat> {
        return await this.fileService.resolve(this.fpgaUri);
    }

    public async topologyFolderFStat(): Promise<FileStat> {
        return await this.fileService.resolve(this.topologyUri);
    }

    public async otherFolderFStat(): Promise<FileStat> {
        return await this.fileService.resolve(this.otherUri);
    }

    public getConfig(): Object {
        return {
            name: this.solutionName,
            root: this.solutionUri,
            rtlUri: this.rtlUri,
            fpgaUri: this.fpgaUri,
            topologyUri: this.topologyUri,
            otherUri: this.otherUri
        };
    }
}