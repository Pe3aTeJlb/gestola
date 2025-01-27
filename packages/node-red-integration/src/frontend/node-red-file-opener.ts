import {
    
    OpenWithService,
    WidgetOpenerOptions,
    WidgetOpenHandler
} from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { NodeRedIntegrationWidget } from './node-red-integration-widget';
import { NodeRedService } from '../common/protocol';

@injectable()
export class NodeRedFileOpener extends WidgetOpenHandler<NodeRedIntegrationWidget> {

    @inject(OpenWithService)
    protected openWithService: OpenWithService;

    @inject(NodeRedService)
    private readonly nodeRedService: NodeRedService;

    fileExtensions: string[] = ['.df','.json'];

    protected registerOpenWithHandler = true;

    override get id(): string {
        return NodeRedIntegrationWidget.ID;
    }

    protected override createWidgetOptions(uri: URI, options: WidgetOpenerOptions): WidgetOpenerOptions {
        return options;
    }

    override async open(uri: URI, options?: WidgetOpenerOptions): Promise<NodeRedIntegrationWidget> {

        let widget;
        if(this.all.length > 0){
            widget = this.all[0];
        } else {
            widget = await this.getOrCreateWidget(uri, options);
        }
        await this.doOpen(widget, options);
        return widget;
    }

    canHandle(uri: URI, _options?: WidgetOpenerOptions | undefined): number {
        for (const extension of this.fileExtensions) {
            if (uri.path.toString().endsWith(extension)) {
                this.nodeRedService.openFile(uri);
                return 1001;
            }
        }
        return 0;
    }

}

