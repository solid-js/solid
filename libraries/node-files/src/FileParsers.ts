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
			line.split("=", 2);
			if (line.length == 0) return;
			data[ line[0].trim() ] = line[1].trim();
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