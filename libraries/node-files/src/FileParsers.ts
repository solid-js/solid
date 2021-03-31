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
			// Remove comments
			if ( line.trim().indexOf('#') === 0 )
				return;

			// TODO : Remove comments in values only :
			// TODO : KEY=value # This is a comment

			// Split key and value
			const parts = line.split("=");

			// Continue only if their is an assignment
			if ( parts.length < 2 ) return;

			// Extract key and value, we join to allow "=" on values
			let key = parts.shift().trim()
			let value = parts.join('=').trim()

			// Remove quotes on value
			if (
				// "value"
				(value.indexOf('"') === 0 && value.lastIndexOf('"') === value.length - 1 )
				// 'value'
				|| (value.indexOf("'") === 0 && value.lastIndexOf("'") === value.length - 1 )
			) {
				value = value.substr( 1, value.length - 2 )
					.replace("\'", "'")
					.replace('\"', '"')
			}

			// Register data
			data[ key ] = value;
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