import { Endpoint } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';

@injectable()
export class LauncherService {

    async isInitialized(): Promise<boolean> {
        const response = await fetch(new Request(`${this.endpoint()}/initialized`), {
            body: undefined,
            method: 'GET'
        }).then(r => r.json());
        return !!response?.initialized;
    }

    async createLauncher(create: boolean): Promise<void> {
        fetch(new Request(`${this.endpoint()}`), {
            body: JSON.stringify({ create }),
            method: 'PUT',
            headers: new Headers({ 'Content-Type': 'application/json' })
        });
    }

    protected endpoint(): string {
        const url = new Endpoint({ path: 'launcher' }).getRestUrl().toString();
        return url.endsWith('/') ? url.slice(0, -1) : url;
    }
}
