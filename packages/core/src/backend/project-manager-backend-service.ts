import { injectable } from '@theia/core/shared/inversify';
import { ProjectManagerBackendService } from './project-manager-backend-service-protocol';
import { URI } from '@theia/core';
import * as fs from 'fs';

@injectable()
export class ProjectManagerBackendServiceImpl implements ProjectManagerBackendService {

    test(): Promise<void> {
        console.log("shit from backend", __dirname, __filename);
        return Promise.resolve();
    }

    async createProjectFromTemplate(uri: URI, type: string): Promise<void> {
        console.log("shit from backend", __dirname);


        let source = URI.fromFilePath(__dirname+"/../../../packages/core/template/"+type).resolveToAbsolute();
        if(source){
            this.copyDirectory(source.path.fsPath(), uri.path.fsPath());
        }

        return Promise.resolve();
    }

    copyDirectory = (source: string, destination: string) => {
        if (!fs.existsSync(destination)) {
          fs.mkdirSync(destination);
        }
      
        // Read all files/folders in the source directory
        const files = fs.readdirSync(source);
      
        // Copy each file/folder to the destination directory
        files.forEach(file => {
          const currentPath = `${source}/${file}`;
          const newPath = `${destination}/${file}`;
          if (fs.statSync(currentPath).isDirectory()) {
            // Recursively copy a subdirectory
            this.copyDirectory(currentPath, newPath);
          } else {
            // Copy a file
            fs.copyFileSync(currentPath, newPath);
          }
        });
      };
    
}