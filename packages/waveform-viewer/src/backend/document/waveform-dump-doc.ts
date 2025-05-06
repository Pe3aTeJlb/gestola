import URI from '@theia/core/lib/common/uri';
import { filehandler } from './filehandler';
import { Worker } from 'worker_threads';
import { NetlistIdTable, NetlistItem, SignalId, createScope, createVar } from "../../common/netlist-dto";
import * as fs from 'fs';
import { IWaveformDumpDoc, MetadataPackage, TransactionPackage, WaveformTopMetadata as WaveformTopMetadata } from '../../common/waveform-doc-dto';
import { WaveformViewerFrontendService } from 'src/common/protocol';

export interface fsWrapper {
  loadStatic: boolean;
  fd: number;
  fileSize: number;
  bufferSize: number;
  fileData?: Uint8Array;
  loadFile: (uri: URI, fileType: string) => void;
  readSlice: (fd: number, buffer: Uint8Array, offset: number, length: number, position: number) => number;
  close: (fd: number) => void;
}

export class WaveformDumpDoc implements IWaveformDumpDoc {

    private readonly uri: URI;
    public backend: WaveformViewerFrontendService;

    public netlistTree:         NetlistItem[] = [];
    public netlistIdTable: NetlistIdTable = [];
  
    private fileReader: fsWrapper;
    public _wasmWorker: Worker;
    public wasmApi: any;
    private fileBuffer: Uint8Array;

    public metadata:   WaveformTopMetadata = {
      timeTableLoaded: false,
      moduleCount:    0,
      netlistIdCount: 0,
      signalIdCount:  0,
      timeEnd:     0,
      timeScale:   1,
      defaultZoom: 1,
      timeUnit:    "ns",
    };

    public readonly service: filehandler.Imports.Promisified = {
  
      log: (msg: string) => {console.log(msg);},
      fsread: (fd: number, offset: bigint, length: number): Uint8Array => {
  
        const bytesRead = this.fileReader.readSlice(fd, this.fileBuffer, 0, length, Number(offset));
        return this.fileBuffer.subarray(0, bytesRead);
      },
      getsize: (fd: number): bigint => {
        //const stats = fs.fstatSync(fd);
        return BigInt(this.fileReader.fileSize);
      },
      setscopetop: (name: string, id: number, tpe: string) => {
        const scope = createScope(name, tpe, "", id);
        this.netlistTree.push(scope);
        this.netlistIdTable[id] = {netlistItem: scope, displayedItem: undefined, signalId: 0};
      },
      setvartop: (name: string, id: number, signalid: number, tpe: string, encoding: string, width: number, msb: number, lsb: number) => {
        const varItem = createVar(name, tpe, encoding, "", id, signalid, width, msb, lsb);
        this.netlistTree.push(varItem);
        this.netlistIdTable[id] = {netlistItem: varItem, displayedItem: undefined, signalId: signalid};
      },
      setmetadata: (scopecount: number, varcount: number, timescale: number, timeunit: string) => {
        console.log('wasm meta');
        this.setMetadata(scopecount, varcount, timescale, timeunit);
      },
      setchunksize: (chunksize: bigint, timeend: bigint) => {
        console.log('wasm chunk size');
        this.setChunkSize(chunksize, timeend);
      },
      sendtransitiondatachunk: (signalid: number, totalchunks: number, chunknum: number, min: number, max: number ,transitionData: string) => {
        console.log('wasm transaction');
        this.backend.onTransactionReceived({
          uri: this.uri,
          signalId: signalid,
          transitionDataChunk: transitionData,
          totalChunks: totalchunks,
          chunkNum: chunknum,
          min: min,
          max: max
        } as TransactionPackage);
      }
    };
  

  
    constructor(
      uri: URI,
      fileReader: fsWrapper,
      _wasmWorker: Worker
    ) {
      this.uri = uri;
      this._wasmWorker = _wasmWorker;
      this.fileBuffer  = new Uint8Array(65536);
      this.fileReader = fileReader;
    }

    static async create(
      backend: WaveformViewerFrontendService,
      uri: URI,
      wasmWorker: Worker,
      wasmModule: WebAssembly.Module,
    ): Promise<WaveformDumpDoc | PromiseLike<WaveformDumpDoc>> {
  
      const fsWrapper : fsWrapper = {
        loadStatic: true,
        fd: 0,
        fileSize: 0,
        bufferSize: 60 * 1024,
        loadFile: (uri: URI, fileType: string) => {
          const stats        = fs.statSync(uri.path.fsPath());
          fsWrapper.fileData = fs.readFileSync(uri.path.fsPath());
          fsWrapper.fileSize = stats.size ? stats.size : 0;
        },
        readSlice: (fd: number, buffer: Uint8Array, offset: number, length: number, position: number) => {
          buffer.set(fsWrapper.fileData!.subarray(position, position + length), offset);
          return length;
        },
        close: (fd: number) => {}
      };
      const document  = new WaveformDumpDoc(uri, fsWrapper, wasmWorker);
      document.setBackend(backend);
      await document.createWasmApi(wasmModule);
      await document.load();
      await document.generateTreeData(document.netlistTree);
      return document;
    }

    public setBackend(back: WaveformViewerFrontendService){
      this.backend = back;
    }

    public async createWasmApi(wasmModule: WebAssembly.Module) {
      this.wasmApi = await filehandler._.bind(this.service, wasmModule, this._wasmWorker);
    }
  
    // Load VCD, FST, GHW files using WASM
    protected async load() {
      const fileType = this.uri.path.ext;
      this.fileReader.loadFile(this.uri, fileType);
      await this.wasmApi.loadfile(BigInt(this.fileReader.fileSize), this.fileReader.fd, this.fileReader.loadStatic, this.fileReader.bufferSize);
      await this.wasmApi.readbody();
    }

    public async generateTreeData(netlist: NetlistItem[]){
      for(let net of netlist){
        if(net.type == 'module'){
          await(this.generateTreeData(await this.getChildrenExternal(net)));
        }
      }
    }
  
    async getChildrenExternal(element: NetlistItem | undefined): Promise<NetlistItem[]> {
  
      if (!element) {return Promise.resolve(this.netlistTree);} // Return the top-level netlist items
      if (!this.wasmApi) {return Promise.resolve([]);}
      if (element.children.length > 0) {return Promise.resolve(element.children);}
  
      let modulePath = "";
      if (element.modulePath !== "") {modulePath += element.modulePath + ".";}
      modulePath += element.name;
      let itemsRemaining = Infinity;
      let startIndex     = 0;
      const result: NetlistItem[] = [];
  
      //console.log(element);
      let callLimit = 255;
      const varTable: any = {};
      while (itemsRemaining > 0) {
        //console.log("calling getscopes for " + modulePath + " with start index " + startIndex);
        const children = await this.wasmApi.getchildren(element.netlistId, startIndex);
        const childItems = JSON.parse(children);
        //console.log(children);
        //console.log(childItems);
        itemsRemaining = childItems.remainingItems;
        startIndex    += childItems.totalReturned;
  
        childItems.scopes.forEach((child: any) => {
          result.push(createScope(child.name, child.type, modulePath, child.id));
        });
        childItems.vars.forEach((child: any) => {
          // Need to handle the case where we get a variable with the same name but
          // different bit ranges.
          const encoding = child.encoding.split('(')[0];
          const varItem = createVar(child.name, child.type, encoding, modulePath, child.netlistId, child.signalId, child.width, child.msb, child.lsb);
          if (varTable[child.name] === undefined) {
            varTable[child.name] = [varItem];
          } else {
            varTable[child.name].push(varItem);
          }
          this.netlistIdTable[child.netlistId] = {netlistItem: varItem, displayedItem: undefined, signalId: child.signalId};
        });
  
        callLimit--;
        if (callLimit <= 0) {break;}
      }
  
      for (const [key, value] of Object.entries(varTable)) {
        if ((value as NetlistItem[]).length === 1) {
          key;
          result.push((value as NetlistItem[])[0]);
        } else {
          const varList = value as NetlistItem[];
          const bitList: NetlistItem[] = [];
          const busList: NetlistItem[] = [];
          let maxWidth = 0;
          let parent: any = undefined; // set to any because the linter is complaining
          varList.forEach((varItem) => {
            if (varItem.width === 1) {bitList.push(varItem);}
            else {busList.push(varItem);}
          });
          busList.forEach((busItem: NetlistItem) => {
            if (busItem.width > maxWidth) {
              maxWidth = busItem.width;
              parent = busItem;
            }
            result.push(busItem);
          });
          if (parent !== undefined) {
            parent.children = bitList;
          } else {
            result.push(...bitList);
          }
  
        }
      }
  
      element.children = result;
      return Promise.resolve(element.children);
    }
  
    public async getSignalData(signalIdList: SignalId[]) {
      this.wasmApi.getsignaldata(signalIdList);
    }

    public setMetadata(scopecount: number, varcount: number, timescale: number, timeunit: string) {
      this.metadata.moduleCount    = scopecount; // scopecount might different between fsdb and vcd
      this.metadata.netlistIdCount = varcount; // varcount is not read for fsdb
      this.metadata.timeScale      = timescale;
      this.metadata.timeUnit       = timeunit;
      this.netlistIdTable = new Array(varcount);
    }
  
    public setChunkSize(chunksize: bigint, timeend: bigint) {
      //this._setChunkSize(Number(chunksize));
      const newMinTimeStemp         = 10 ** (Math.round(Math.log10(Number(chunksize) / 128)) | 0);
      this.metadata.defaultZoom     = 4 / newMinTimeStemp;
      this.metadata.timeEnd         = Number(timeend);
      this.metadata.timeTableLoaded = true;
      this.onDoneParsingWaveforms();
    }

    public onDoneParsingWaveforms() {

      this.backend.onMetadataReceived({
        uri: this.uri,
        metadata: this.metadata
      } as MetadataPackage);
      
    }
  
  
    public async unload() {
      //console.log("Reloading document");  
      this.fileReader.close(this.fileReader.fd);
      await this.wasmApi.unload();

    }
  
    dispose(): void {
      this.unload();
      this._wasmWorker.terminate();
    }

}