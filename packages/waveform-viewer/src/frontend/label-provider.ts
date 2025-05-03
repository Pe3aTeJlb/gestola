import { FileStatNode } from '@theia/filesystem/lib/browser/file-tree/file-tree';
import { FileTreeLabelProvider } from '@theia/filesystem/lib/browser/file-tree/file-tree-label-provider';
import { injectable } from '@theia/core/shared/inversify';

@injectable()
export class WaveformViewerLabelProviderContribution extends FileTreeLabelProvider {

    fileExtensions: string[] = ['.fst','.vcd'];
    
    override canHandle(element: object): number {
        if (FileStatNode.is(element)) {
            let uri = element.uri;
            if (this.fileExtensions.includes(uri.path.ext)) {
                return super.canHandle(element)+1;
            }
        }
        return 0;
    }

    override getIcon(): string {
        return "waveform-file";
    }

}