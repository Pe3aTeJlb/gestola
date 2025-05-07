import { ContainerModule } from '@theia/core/shared/inversify';
import { WaveformViewverBackendServiceImpl } from './waveform-viewer-backend-service';
import { WAVEFROM_VIEWER_BACKEND_PATH, WaveformViewerBackendService, WaveformViewerFrontendService } from '../common/protocol';
import { ConnectionHandler, RpcConnectionHandler } from "@theia/core/lib/common/messaging";
import { DocumentWatcher } from '../common/document-watcher';

export default new ContainerModule(bind => {
/*
    bind(WaveformViewverBackendServiceImpl).toSelf().inSingletonScope();
    bind(WaveformViewerBackendService).toService(WaveformViewverBackendServiceImpl);
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new JsonRpcConnectionHandler(WAVEFROM_VIEWER_BACKEND_PATH, () => {
            return ctx.container.get<WaveformViewerBackendService>(WaveformViewerBackendService);
        })
    ).inSingletonScope();
*/

    bind(DocumentWatcher).toSelf().inSingletonScope();

    bind(WaveformViewverBackendServiceImpl).toSelf().inSingletonScope();
    bind(WaveformViewerBackendService).toService(WaveformViewverBackendServiceImpl);
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler<WaveformViewerFrontendService>(WAVEFROM_VIEWER_BACKEND_PATH, client => {
            const backendService = ctx.container.get<WaveformViewerBackendService>(WaveformViewerBackendService);
            backendService.setClient(client);
            // when connection closes, cleanup that client of task-server
            client.onDidCloseConnection(() => {
                backendService.disconnectClient(client);
            });
            return backendService;
        })
    ).inSingletonScope();


});
