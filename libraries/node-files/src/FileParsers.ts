import { ScalarObject } from "@solid-js/core";

// ----------------------------------------------------------------------------- STRUCT

interface IParser
{
	decode ( buffer:string ):any
	encode ( data:any, ...rest ):string
}

// ----------------------------------------------------------------------------- CLASSIC JSON PARSER

export function JSONParser ():IParser {
	return {
		decode ( buffer:string ) {
			return JSON.parse( buffer )
		},
		encode ( data:any, replacers, spaces ) {
			return JSON.stringify( data, replacers, spaces )
		}
	}
}

// ----------------------------------------------------------------------------- JSON 5 PARSER

export function JSON5Parser ():IParser {
	const JSON5 = require('json5');
	if (!JSON5) throw new Error(`File.json5 needs the package "json5" installed.`)
	return {
		decode ( buffer:string ) {
			return JSON5.parse(buffer)
		},
		encode ( data:any, replacers, spaces ) {
			return JSON5.stringify( data, replacers, spaces )
		}
	}
}

// ----------------------------------------------------------------------------- YAML PARSER

export function YAMLParser ():IParser {
	const YAWN = require('yawn-yaml/cjs');
	if (!YAWN) throw new Error(`File.yaml needs the package "yawn-yaml" installed.`)

	return {
		decode (buffer:string) {
			return new YAWN( buffer ).json
		},
		encode ( data:any ) {
			const yamlDataToSave = new YAWN('');
			yamlDataToSave.json = data;
			return yamlDataToSave.yaml;
		}
	}
}

// ----------------------------------------------------------------------------- DOT ENV PARSER

// FIXME : Manage comments ?
// FIXME : Check properties orders ? Need to be the same reading / writing.
export function DotEnvParser () {
	return {
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
}