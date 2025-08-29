import * as fs from 'fs';

interface SlackHistogram {
    metadata: {
        toolVersion: string;
        date: string;
        host: string;
        command: string;
        design: string;
        device: string;
        speedFile: string;
        designState: string;
    };
    summary: {
        totalItems: number;
        minSlack: number;
        maxSlack: number;
        setup: {
            ranges: {
                min: number;
                max: number;
                count: number;
                cumulativeCount: number;
            }[];
        };
    };
    details: {
        totalItems: number;
        minSlack: number;
        maxSlack: number;
        setup: {
            entries: {
                slack: number;
                type: string;
                group: string;
                corner: string;
                sourceClock: string;
                destinationClock: string;
                pin: string;
            }[];
        };
    };
}

function parseSlackHistogram(fileContent: string): SlackHistogram {
    const lines = fileContent.split('\n');
    const result: SlackHistogram = {
        metadata: {
            toolVersion: '',
            date: '',
            host: '',
            command: '',
            design: '',
            device: '',
            speedFile: '',
            designState: ''
        },
        summary: {
            totalItems: 0,
            minSlack: 0,
            maxSlack: 0,
            setup: { ranges: [] }
        },
        details: {
            totalItems: 0,
            minSlack: 0,
            maxSlack: 0,
            setup: { entries: [] }
        }
    };

    // Metadata parsing with variable whitespace
    const metadataPatterns = {
        toolVersion: /Tool Version\s*:/,
        date: /Date\s*:/,
        host: /Host\s*:/,
        command: /Command\s*:/,
        design: /Design\s*:/,
        device: /Device\s*:/,
        speedFile: /Speed File\s*:/,
        designState: /Design State\s*:/
    };

    for (const line of lines) {
        for (const [key, pattern] of Object.entries(metadataPatterns)) {
            if (pattern.test(line)) {
                const value = line.split(/:\s*(.+)/)[1].trim();
                result.metadata[key as keyof typeof result.metadata] = value;
                break;
            }
        }
    }

    function findTableBoundaries(lines: string[], sectionHeader: string): 
        { columnHeader: string, dataStart: number, dataEnd: number } | null {
        
        let sectionIndex = -1;
        let topBorderIndex = -1;
        let columnHeaderIndex = -1;
        let bottomBorderIndex = -1;

        // Find the table section header (e.g. "Setup sub-table")
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(sectionHeader)) {
                sectionIndex = i;
                break;
            }
        }
        
        if (sectionIndex === -1) return null;

        // Find the top border (line after section header)
        for (let i = sectionIndex + 1; i < lines.length; i++) {
            if (lines[i].trim().match(/^\+[-+]+\+$/)) {
                topBorderIndex = i;
                break;
            }
        }

        if (topBorderIndex === -1) return null;

        // Find the column header (line after top border)
        for (let i = topBorderIndex + 1; i < lines.length; i++) {
            if (lines[i].trim().startsWith('|')) {
                columnHeaderIndex = i;
                break;
            }
        }

        if (columnHeaderIndex === -1) return null;

        // Find the bottom border (after data rows)
        for (let i = columnHeaderIndex + 2; i < lines.length; i++) {
            if (lines[i].trim().match(/^\+[-+]+\+$/)) {
                bottomBorderIndex = i;
                break;
            }
        }

        if (bottomBorderIndex === -1) return null;

        return {
            columnHeader: lines[columnHeaderIndex].trim(),
            dataStart: columnHeaderIndex + 2, // First data row after column header
            dataEnd: bottomBorderIndex         // Line before bottom border
        };
    }

    function parseTableRows(columnHeader: string, lines: string[], start: number, end: number): string[][] {
        const rows: string[][] = [];
        
        // First parse the column header to understand column count
        const headerCols = columnHeader.split('|')
            .map(col => col.trim())
            .filter(col => col && !col.includes('+-')); // Filter out decorative elements
        
        const expectedColCount = headerCols.length;

        for (let i = start; i < end; i++) {
            const line = lines[i].trim();
            
            // Skip empty lines and border lines
            if (line === '' || line.match(/^\+[-+]+\+$/)) {
                continue;
            }
            
            // Process data rows
            if (line.startsWith('|')) {
                const columns = line.split('|')
                    .map(col => col.trim())
                    .filter(col => col);
                
                // Only include rows that match expected column count
                if (columns.length === expectedColCount) {
                    rows.push(columns);
                }
            }
        }
        return rows;
    }

    // Parse summary section
    const summaryStart = lines.findIndex(line => line.includes('Summary Tables'));
    if (summaryStart !== -1) {
        const summaryLines = lines.slice(summaryStart);
        
        // Total items line
        const totalItemsLine = summaryLines.find(line => line.includes('items from'));
        if (totalItemsLine) {
            const itemsMatch = totalItemsLine.match(/(\d+) items from ([\d.]+) ns to ([\d.]+) ns/);
            if (itemsMatch) {
                result.summary.totalItems = parseInt(itemsMatch[1]);
                result.summary.minSlack = parseFloat(itemsMatch[2]);
                result.summary.maxSlack = parseFloat(itemsMatch[3]);
            }
        }

        // Setup table
        const tableBoundaries = findTableBoundaries(summaryLines, 'Setup sub-table');
        if (tableBoundaries) {
            const tableRows = parseTableRows(
                tableBoundaries.columnHeader,
                summaryLines, 
                tableBoundaries.dataStart, 
                tableBoundaries.dataEnd
            );
            
            for (const row of tableRows) {
                if (row.length >= 5) {
                    result.summary.setup.ranges.push({
                        min: parseFloat(row[1]),
                        max: parseFloat(row[2]),
                        count: parseInt(row[3]),
                        cumulativeCount: parseInt(row[4])
                    });
                }
            }
        }
    }

    // Parse detailed section
    const detailsStart = lines.findIndex(line => line.includes('Detailed Tables'));
    if (detailsStart !== -1) {
        const detailsLines = lines.slice(detailsStart);
        
        const totalItemsLine = detailsLines.find(line => line.includes('items from'));
        if (totalItemsLine) {
            const itemsMatch = totalItemsLine.match(/(\d+) items from ([\d.]+) ns to ([\d.]+) ns/);
            if (itemsMatch) {
                result.details.totalItems = parseInt(itemsMatch[1]);
                result.details.minSlack = parseFloat(itemsMatch[2]);
                result.details.maxSlack = parseFloat(itemsMatch[3]);
            }
        }

        const tableBoundaries = findTableBoundaries(detailsLines, 'Setup sub-table');
        if (tableBoundaries) {
            const tableRows = parseTableRows(
                tableBoundaries.columnHeader,
                detailsLines, 
                tableBoundaries.dataStart, 
                tableBoundaries.dataEnd
            );
            
            for (const row of tableRows) {
                if (row.length >= 8) {
                    result.details.setup.entries.push({
                        slack: parseFloat(row[1]),
                        type: row[2],
                        group: row[3],
                        corner: row[4],
                        sourceClock: row[5],
                        destinationClock: row[6],
                        pin: row[7]
                    });
                }
            }
        }
    }

    return result;
}

// Example usage:
const fileContent = fs.readFileSync('scripts/test/slack.txt', 'utf-8');
const parsedData = parseSlackHistogram(fileContent);
console.log(JSON.stringify(parsedData));