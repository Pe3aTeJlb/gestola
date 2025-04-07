import { Docker, Options } from 'docker-cli-js';
import * as fs from 'fs';
const path = require('path');

execute();

async function execute() {

    if(!fs.existsSync(path.resolve(__dirname, '../electron-app/resources/verilator/verilator.tar'))){

        fs.mkdirSync(path.resolve(__dirname, '../electron-app/resources/verilator'));

        const options = new Options (
            undefined, // uses local docker
            undefined, // uses current working directory
            true // echo command output to stdout/stderr
        );
        
        var docker = new Docker(options);
        let resp = await docker.command('images');
        let search = (resp.images).find((e: any) => e.repository.match('verilator'));

        if(search === undefined) {
            await docker.command('pull verilator/verilator:latest');
        }

        await docker.command(`save -o ${path.resolve(__dirname, '../electron-app/resources/verilator/verilator.tar')} verilator/verilator:latest`);

    }
}