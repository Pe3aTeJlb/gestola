import * as React from 'react';
import { injectable, postConstruct, inject } from '@theia/core/shared/inversify';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { MessageService, URI } from '@theia/core';
import { Message } from '@theia/core/lib/browser';
import { NodeRedIntegrationOptions } from './node-red-file-opener';
import { NodeRedService } from '../common/protocol';

@injectable()
export class NodeRedIntegrationWidget extends ReactWidget {

    static readonly ID = 'node-red-integration:widget';
    static readonly LABEL = 'Gestola: Design Flow Editor';
    private src = `http://127.0.0.1:1880/admin`;
    public opt: NodeRedIntegrationOptions;
    public uri: URI;

    @inject(MessageService)
    protected readonly messageService!: MessageService;

    @inject(NodeRedService)
    private readonly nodeRedService: NodeRedService;

    configure(opts: NodeRedIntegrationOptions){
        if(!!opts){
            this.opt = opts;
            this.uri = new URI(this.opt.uri);
            this.nodeRedService.openFile(this.uri);
        }
    }

    @postConstruct()
    protected init(): void {
        this.doInit()
    }

    protected async doInit(): Promise <void> {
        this.id = NodeRedIntegrationWidget.ID;
        this.title.label = NodeRedIntegrationWidget.LABEL;
        this.title.caption = NodeRedIntegrationWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'fa fa-window-maximize'; // example widget icon.
        this.update();

    }

    render(): React.ReactElement {
        return <div id='widget-container'>``
            <iframe src={this.src} id='frame'> </iframe>
        </div>
    }

    protected displayMessage(): void {
        this.messageService.info('Congratulations: Design Flow Editor Widget Successfully Created!');
    }

    protected override onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        const htmlElement = document.getElementById('displayMessageButton');
        if (htmlElement) {
            htmlElement.focus();
        }
    }

}
