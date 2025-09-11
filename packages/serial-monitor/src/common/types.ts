export const isSerialPort = (portOrFilter?: SerialPort | SerialFilter): portOrFilter is SerialPort => !!(portOrFilter as SerialPort)?.getInfo;
export const getName = (port: SerialInfo) => (port.manufacturer || port.serialNumber) ? `${port.path} (${port.manufacturer || port.serialNumber})` : port.path;

export interface SerialFilter {
    serialNumber?: string;
    vendorId?: number;
    productId?: number;
    path?: string;
}

// The web version can ony populate vid/pid
export interface SerialInfo {
    path: string;
    serialNumber?: string;
    manufacturer?: string;
    productId?: string;
    vendorId?: string;
}