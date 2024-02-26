import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

execute();

async function execute(): Promise<void> {

    const packageJsonPath = path.resolve(
        './',
        'package.json'
    );

    console.log(`Updating ${packageJsonPath}...`);

    const packageJsonContents: string = fs.readFileSync(packageJsonPath, { encoding: 'utf8' });
    const packageJson = JSON.parse(packageJsonContents);

    console.log('...plugins...');
    console.log(packageJson.theiaPlugins);
    if (packageJson.theiaPlugins) {
        await updateTheiaVersions(packageJson.theiaPlugins);
    }
    console.log('...done...');
    console.log('\n\n\n');

    // note: "null" is valid as per `stringify()` signature
    // eslint-disable-next-line no-null/no-null
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

async function updateTheiaVersions(theiaPlugins: Partial<Record<string, string>>): Promise<void> {
    for (const plugin in theiaPlugins) {
        if (theiaPlugins[plugin]?.startsWith('https://open-vsx.org')) {
            console.log(`...setting ${plugin} from ${theiaPlugins[plugin]}`);
            let response = await getResponse(plugin);
            if(response){
                theiaPlugins[plugin] = response;
            }
        }
    }
}

async function getResponse(url: string): Promise<string | undefined> {
    try {
        const response = await axios.get("https://open-vsx.org/api/"+url);
        console.log('result is: ', response.data.downloads.universal);
        return response.data.downloads.universal;
      } catch (error) {
        if (error instanceof Error) {
          console.log('error message: ', error.message);
          return error.message;
        } else {
          console.log('unexpected error: ', error);
          return 'An unexpected error occurred';
        }
      }
}