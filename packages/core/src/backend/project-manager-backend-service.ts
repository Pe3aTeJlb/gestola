import { injectable } from '@theia/core/shared/inversify';
import { ProjectManagerBackendService } from './project-manager-backend-service-protocol';
import { URI } from '@theia/core';
import * as fs from 'fs';
import * as path from 'path';

@injectable()
export class ProjectManagerBackendServiceImpl implements ProjectManagerBackendService {

    test(): Promise<void> {
        console.log("shit from backend", __dirname, `local-dir:${path.resolve(__dirname, '../../', 'resources/templates')}`);
        return Promise.resolve();
    }

    async createProjectFromTemplate(uri: URI, type: string): Promise<void> {
        console.log("shit from backend", __dirname, `local-dir:${path.resolve(__dirname, '../../', 'resources/templates', type)}`);


        let source = path.resolve(__dirname, '../../', 'resources/templates', type);
        if(source){
            this.copyDirectory(source, uri.path.fsPath());
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