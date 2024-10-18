import { NodeRedContribution } from "../common/node-red-contribution";
import { MaybePromise } from '@eclipse-glsp/protocol';
import { Channel, Disposable, DisposableCollection } from '@theia/core';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { ProcessErrorEvent } from '@theia/process/lib/node/process';
import { ProcessManager } from '@theia/process/lib/node/process-manager';
import { RawProcess, RawProcessFactory } from '@theia/process/lib/node/raw-process';
import * as cp from 'child_process';
import { createInterface } from 'readline';
export const NodeRedServerContribution = Symbol('NodeRedServerContribution');

export interface NodeRedServerContribution extends NodeRedContribution, Disposable {
    /**
     * Establish a connection between the given client (connection) and the GLSP server.
     * @param clientChannel  The client (channel) which should be connected to the server
     * @returns A 'Disposable' that cleans up all client (channel)-specific resources.
     */
    connect(clientChannel: Channel): MaybePromise<Disposable>;

    /**
     * Optional function that can be used by the contribution to launch an embedded GLSP server.
     * @returns A 'Promise' that resolves after the server has been successfully launched and is ready to establish a client connection.
     */
    launch?(): Promise<Disposable>;

    /**
     * The {@link NodeRedServerContributionOptions} for this contribution.
     */
    options: NodeRedServerContributionOptions;
}

export interface NodeRedServerContributionOptions {
    /** Declares wether the  server should be launched on application start or on demand (e.g. on widget open). */
    launchOnDemand: boolean;
    /**
     * Declares that the server contribution does not have to launch a server but expects it to be already started.
     * Mostly used for debugging purposes during development.
     */
    launchedExternally: boolean;
}

export namespace NodeRedServerContributionOptions {
    /** Default values for {@link NodeRedServerContributionOptions } **/
    export function createDefaultOptions(): NodeRedServerContributionOptions {
        return {
            launchOnDemand: false,
            launchedExternally: inDebugMode()
        };
    }

    /**
     * Utility function to partially set the launch options. Default values (from 'defaultOptions') are used for
     * options that are not specified.
     * @param options (partial) launch options that should be extended with default values (if necessary).
     */
    export function configure(options?: Partial<NodeRedServerContributionOptions>): NodeRedServerContributionOptions {
        return {
            ...createDefaultOptions(),
            ...options
        };
    }

    export const debugArgument = '--noderedDebug';

    /**
     * Utility function which specifies if the Theia application has been started in debug mode.
     * i.e. if the '--glspDebug' flag has been passed.
     * @returns `true` if the '--glspDebug' flag has been set.
     */
    export function inDebugMode(): boolean {
        const args = process.argv.filter(a => a.toLowerCase().startsWith(debugArgument.toLowerCase()));
        return args.length > 0;
    }

    /**
     * Utility function that processes the contribution launch options to determine wether the server should be launched on
     * application start.
     * @param contribution The glsp server contribution.
     * @returns `true` if the server should be launched on application start.
     */
    export function shouldLaunchOnApplicationStart(contribution: NodeRedServerContribution): boolean {
        return !contribution.options.launchOnDemand && !contribution.options.launchedExternally;
    }
}


@injectable()
export abstract class BaseNodeRedServerContribution implements NodeRedServerContribution {
    @inject(RawProcessFactory)
    protected readonly processFactory: RawProcessFactory;

    @inject(ProcessManager)
    protected readonly processManager: ProcessManager;

    abstract readonly id: string;
    options: NodeRedServerContributionOptions;

    protected toDispose = new DisposableCollection();

    @postConstruct()
    protected initialize(): void {
        this.options = NodeRedServerContributionOptions.configure(this.createContributionOptions?.());
    }

    async connect(clientChannel: Channel): Promise<Disposable> {
        const clientDisposable = await this.doConnect(clientChannel);
        this.toDispose.push(clientDisposable);
        return clientDisposable;
    }

    abstract doConnect(clientChannel: Channel): MaybePromise<Disposable>;

    abstract createContributionOptions?(): Partial<NodeRedServerContributionOptions>;

    protected spawnProcessAsync(command: string, args?: string[], options?: cp.SpawnOptions): Promise<RawProcess> {
        const rawProcess = this.processFactory({ command, args, options });

        createInterface(rawProcess.outputStream).on('line', line => this.processLogInfo(line));
        createInterface(rawProcess.errorStream).on('line', line => this.processLogError(line));

        return new Promise<RawProcess>((resolve, reject) => {
            rawProcess.onError((error: ProcessErrorEvent) => {
                this.onDidFailSpawnProcess(error);
                if (error.code === 'ENOENT') {
                    const guess = command.split(/\s+/).shift();
                    if (guess) {
                        reject(new Error(`Failed to spawn ${guess}\nPerhaps it is not on the PATH.`));
                        return;
                    }
                }
                reject(error);
            });
            process.nextTick(() => resolve(rawProcess));
        });
    }

    protected onDidFailSpawnProcess(error: Error | ProcessErrorEvent): void {
        console.error(error);
    }

    protected processLogError(line: string): void {
        console.error(`${this.id}: ${line}`);
    }

    protected processLogInfo(line: string): void {
        console.info(`${this.id}: ${line}`);
    }

    dispose(): void {
        this.toDispose.dispose();
    }
}
