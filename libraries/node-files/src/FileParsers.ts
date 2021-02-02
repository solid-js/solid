import { ScalarObject } from "@solid-js/core";

// Quick helper to create YAML parser which keep comments and structure
export const YAMLParser = ( raw) => {
	const YAWN = require('yawn-yaml/cjs');
	return new YAWN( raw );
};

// Quick helper to encode and decode dot env file format
// FIXME : Manage comments ?
// FIXME : Check properties orders ? Need to be the same reading / writing.
export const DotEnvParser = {

	decode ( buffer:string ) {
		const data:ScalarObject = {};
		buffer.split("\n").map( line => {
			const parts = line.split("=", 2);
			if ( parts.length < 2 ) return;
			data[ parts[0].trim() ] = parts[1].trim();
		})
		return data;
	},

	encode ( data:ScalarObject ) {
		let buffer = '';
		Object.keys( data ).map( key => {
			const value = data[ key ];
			buffer += key + '=' + value + "\n";
		})
		return buffer;
	}
}