
export declare function hookStandards ( stdout?: NodeJS.WriteStream, stderr?: NodeJS.WriteStream, exit?: (code?: number) => never):never

export declare function createSpaces ( totalSpaces:number ):string

export declare function print ( content:string, bold?:boolean, newLine?:boolean ):never

export declare function offset ( spaces:number, content:string ):string

export declare function newLine ():never

export declare function halt ( content:string, code?:number, redAndBold?:boolean ):never

// TODO : Options type ?
export declare function exec ( command:string, options?:{} ):string|null


export declare interface Task
{
    end ()
    success (newText?:string)
    custom (state:string, bold?:boolean, clearOverflow?:boolean, newText?:string)
    error (errorObject?:any, code?:boolean)
    progress (current:number, total:number, width?:number)
}


export declare function task ( name:string, dots?:string ):Task


export declare function table ( lines:any[][], firstLineAreLabels?:false, sep?:string, lineStart?:string, lineEnd?:string, minColumnWidths?:number[] ):never


export declare type AssertHandler = ( value, expected?:any ) => void;

export declare type ItHandler = ( assert : AssertHandler ) => void;

export declare type TestHandler = ( it : ItHandler ) => void;

export declare async function test ( name:string, testHandler:TestHandler )