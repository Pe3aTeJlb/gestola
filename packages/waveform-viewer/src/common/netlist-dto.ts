export type NetlistId = number;
export type SignalId  = number;

export type NetlistIdTable = NetlistIdRef[];
export type NetlistIdRef = {
  netlistItem: NetlistItem;
  displayedItem: NetlistItem | undefined;
  signalId: SignalId;
};

// Scopes
const moduleIcon    = 'chip';
const taskIcon      = 'debug-stack-frame';
const funcIcon      = 'symbol-module';
const beginIcon     = 'debug-start';
const forkIcon      = 'repo-forked';
const structIcon    = 'symbol-structure';
const unionIcon     = 'surround-with';
const classIcon     = 'symbol-misc';
const interfaceIcon = 'debug-disconnect';
const packageIcon   = 'package';
const scopeIcon     = 'symbol-module';

export function createScope(name: string, type: string, path: string, netlistId: number) {
  
  let icon = scopeIcon;
  const typename = type.toLocaleLowerCase();
  switch (typename) {
    case 'module':           {icon = moduleIcon; break;}
    case 'task':             {icon = taskIcon; break;}
    case 'function':         {icon = funcIcon; break;}
    case 'begin':            {icon = beginIcon; break;}
    case 'fork':             {icon = forkIcon; break;}
    case 'generate':         {icon = scopeIcon; break;}
    case 'struct':           {icon = structIcon; break;}
    case 'union':            {icon = unionIcon; break;}
    case 'class':            {icon = classIcon; break;}
    case 'interface':        {icon = interfaceIcon; break;}
    case 'package':          {icon = packageIcon; break;}
    case 'program':          {icon = scopeIcon; break;}
    case 'vhdlarchitecture': {icon = scopeIcon; break;}
    case 'vhdlprocedure':    {icon = taskIcon; break;}
    case 'vhdlfunction':     {icon = funcIcon; break;}
    case 'vhdlrecord':       {icon = scopeIcon; break;}
    case 'vhdlprocess':      {icon = scopeIcon; break;}
    case 'vhdlblock':        {icon = scopeIcon; break;}
    case 'vhdlforgenerate':  {icon = scopeIcon; break;}
    case 'vhdlifgenerate':   {icon = scopeIcon; break;}
    case 'vhdlgenerate':     {icon = scopeIcon; break;}
    case 'vhdlpackage':      {icon = packageIcon; break;}
    case 'ghwgeneric':       {icon = scopeIcon; break;}
    case 'vhdlarray':        {icon = scopeIcon; break;}
  }

  const module    = new NetlistItem(name, 'module', 'none', 0, 0, netlistId, name, path, 0, 0, []);
  module.iconId = icon;

  return module;
}
  
function bitRangeString(msb: number, lsb: number): string {
  if (msb < 0 || lsb < 0) {return "";}
  if (msb === lsb) {return " [" + msb + "]";}
  return "[" + msb + ":" + lsb + "]";
}

// Variables
const regIcon     = 'symbol-array';
const wireIcon    = 'symbol-interface';
const intIcon     = 'symbol-variable';
const paramIcon   = 'settings';
const realIcon    = 'pulse';
const defaultIcon = 'file-binary';
const stringIcon  = 'symbol-key';
const portIcon    = 'plug';
const timeIcon    = 'watch';

export function createVar(name: string, type: string, encoding: string, path: string, netlistId: NetlistId, signalId: SignalId, width: number, msb: number, lsb: number) {
  const field = bitRangeString(msb, lsb);

  // field is already included in signal name for fsdb
  name = name + field;

  const variable = new NetlistItem(name, type, encoding, width, signalId, netlistId, name, path, msb, lsb, []);
  const typename = type.toLocaleLowerCase();
  let icon = defaultIcon;

  switch (typename) {
    case 'event':           {icon = defaultIcon; break;}
    case 'integer':         {icon = intIcon; break;}
    case 'parameter':       {icon = paramIcon; break;}
    case 'real':            {icon = realIcon; break;}
    case 'reg':             {icon = defaultIcon; break;}
    case 'supply0':         {icon = defaultIcon; break;}
    case 'supply1':         {icon = defaultIcon; break;}
    case 'time':            {icon = timeIcon; break;}
    case 'tri':             {icon = defaultIcon; break;}
    case 'triand':          {icon = defaultIcon; break;}
    case 'trior':           {icon = defaultIcon; break;}
    case 'trireg':          {icon = defaultIcon; break;}
    case 'tri0':            {icon = defaultIcon; break;}
    case 'tri1':            {icon = defaultIcon; break;}
    case 'wand':            {icon = defaultIcon; break;}
    case 'wire':            {icon = wireIcon; break;}
    case 'wor':             {icon = defaultIcon; break;}
    case 'string':          {icon = stringIcon; break;}
    case 'port':            {icon = portIcon; break;}
    case 'sparsearray':     {icon = defaultIcon; break;}
    case 'realtime':        {icon = timeIcon; break;}
    case 'bit':             {icon = defaultIcon; break;}
    case 'logic':           {icon = defaultIcon; break;}
    case 'int':             {icon = intIcon; break;}
    case 'shortint':        {icon = intIcon; break;}
    case 'longint':         {icon = intIcon; break;}
    case 'byte':            {icon = defaultIcon; break;}
    case 'enum':            {icon = defaultIcon; break;}
    case 'shortreal':       {icon = defaultIcon; break;}
    case 'boolean':         {icon = defaultIcon; break;}
    case 'bitvector':       {icon = defaultIcon; break;}
    case 'stdlogic':        {icon = defaultIcon; break;}
    case 'stdlogicvector':  {icon = defaultIcon; break;}
    case 'stdulogic':       {icon = defaultIcon; break;}
    case 'stdulogicvector': {icon = defaultIcon; break;}
  }

  variable.iconId = icon;
  if ((typename === 'wire') || (typename === 'reg') || (icon === defaultIcon)) {
    if (width > 1) {variable.iconId = regIcon;}
    else           {variable.iconId = wireIcon;}
  }

  return variable;
}

export class NetlistItem {

  public numberFormat: string;
  public description: string;
  public iconId: string;

  constructor(
    public readonly label:      string,
    public readonly type:       string,
    public readonly encoding:   string,
    public readonly width:      number,
    public readonly signalId:   SignalId, // Signal-specific information
    public readonly netlistId:  NetlistId, // Netlist-specific information
    public readonly name:       string,
    public readonly modulePath: string,
    public readonly msb:        number,
    public readonly lsb:        number,
    public children:         NetlistItem[] = [],
  ) {
    let fullName = "";
    if (modulePath !== "") {fullName += modulePath + ".";}
    fullName += label;

    this.numberFormat = "hexadecimal";
    this.description = "Name: " + fullName + "\n" + "Type: " + type + "\n";

  }

}
