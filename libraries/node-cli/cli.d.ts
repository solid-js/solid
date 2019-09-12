export declare type AnyHandler = (...rest) => any|void;

// ----------------------------------------------------------------------------- CONFIGURATION

export declare function hookStandards ( stdout?: NodeJS.WriteStream, stderr?: NodeJS.WriteStream, exit?: (code?: number) => never):never

// ----------------------------------------------------------------------------- SMALL UTILITIES

export declare function repeat ( total:number, char?:string ):string;

export declare function print ( content:string, bold?:boolean, newLine?:boolean ):never

export declare function offset ( spaces:number, content:string ):string

export declare function newLine ():never

export declare function halt ( content:string, code?:number, redAndBold?:boolean ):never

// ----------------------------------------------------------------------------- EXEC UTILITIES

// TODO : Options type ?
export declare async function exec ( command:string, stdLevel?:number, options?:{} ):Promise<string,string>
export declare function execSync ( command:string, stdLevel?:number, options?:{} ):string|null

// ----------------------------------------------------------------------------- CLI UTILITIES

export declare interface Task
{
    end ()
    success (newText?:string)
    custom (state:string, bold?:boolean, clearOverflow?:boolean, newText?:string)
    error (errorObject?:any, code?:boolean)
    progress (current:number, total:number, width?:number)
}

export declare function task ( name:string, icon?:string, dots?:string ):Task

export declare function table ( lines:any[][], firstLineAreLabels?:false, minColumnWidths?:number[], lineStart?:string, lineEnd?:string, separator?:string ):number[]

// ----------------------------------------------------------------------------- UNIT TESTING

export declare type AssertHandler = ( value, expected?:any ) => void;

export declare type ItHandler = ( assert : AssertHandler ) => void;

export declare type TestHandler = ( it : ItHandler ) => void;

export declare async function test ( name:string, testHandler:TestHandler )

// ----------------------------------------------------------------------------- ARGV

export declare interface IArguments
{
    _?:string[]
    [key:string] : (string|number|boolean)
}

export declare function getArguments ():IArguments

// ----------------------------------------------------------------------------- CLI COMMANDS


export declare interface ICommands
{
    add ( name:string, optionsOrHandler:{}|AnyHandler, handler?:AnyHandler )
    list ()
    start (defaultHandler?: AnyHandler):Promise
    run (name:string, options?:{}):Promise
}

export declare const commands:ICommands;

export declare interface IEntry
{
    title       :string|number
    action      ?:AnyHandler
    shortcut    ?:(string|number)[]
}

// ----------------------------------------------------------------------------- CLI COMMANDS

export declare async function askMenu ( message:string, entries:(IEntry|string)[] ):Promise<string|number>

export declare async function askList ( message:string, choices:(string|number)[], shortcuts?:(string|number)[]):Promise<string|number>

export declare async function askInput ( message:string, shortcuts?:(string|number)[], isNumber?:boolean, notEmpty?:boolean, defaultValue?:string):Promise<string|number>
