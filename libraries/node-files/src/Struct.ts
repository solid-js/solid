import { ScalarValue, TFunctionalFilter } from "@solid-js/core";


export type TFileType = 'file'|'directory'|'all';

// @see : https://github.com/isaacs/node-glob
export interface IGlobOptions {
	cwd:string
	// ...
	[key:string] : any
}

export type TGlobOptionsArgument = Partial <IGlobOptions>

export type TRawWritableContent = ScalarValue | null

export type TContentArgument<G> = null | G | TFunctionalFilter <G>

export type TStructuralWritableContent = ScalarValue | object | any[]
