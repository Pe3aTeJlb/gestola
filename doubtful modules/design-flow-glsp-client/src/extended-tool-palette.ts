import { ToolPalette } from '@eclipse-glsp/client';
import { injectable } from 'inversify';

@injectable()
export class ExtendedToolPalette extends ToolPalette {

    protected override createHeaderTools(): HTMLElement {
       
        const headerTools = document.createElement('div');
        headerTools.classList.add('header-tools');

        this.defaultToolsButton = this.createDefaultToolButton();
        headerTools.appendChild(this.defaultToolsButton);

        const deleteToolButton = this.createMouseDeleteToolButton();
        headerTools.appendChild(deleteToolButton);

        const marqueeToolButton = this.createMarqueeToolButton();
        headerTools.appendChild(marqueeToolButton);
/*
        const validateActionButton = this.createValidateButton();
        headerTools.appendChild(validateActionButton);

        const resetViewportButton = this.createResetViewportButton();
        headerTools.appendChild(resetViewportButton);

        if (this.gridManager) {
            const toggleGridButton = this.createToggleGridButton();
            headerTools.appendChild(toggleGridButton);
        }

        if (this.debugManager) {
            const toggleDebugButton = this.createToggleDebugButton();
            headerTools.appendChild(toggleDebugButton);
        }

        // Create button for Search
        const searchIcon = this.createSearchButton();
        headerTools.appendChild(searchIcon);
*/
        return headerTools;

    }

}