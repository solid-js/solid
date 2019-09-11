/**
 * TODO : Quid du rapport avec FlatDB ? A réfléchir ...
 * TODO : Faire plutôt un truc où on peut save des objets différents :
 *
 * // Configurer l'endroit
 * Store.setStorePath('.preferences');
 *
 * // Un object pour
 * const solidPreferences = Store.create('solid-preferences');
 *
 * // Un bucket pour l'utilisateur en cours
 * const userPreferences = Store.createUserStore(); // (ou un truc du genre...)
 *
 * // Utilisation
 * userPreferences.has('key');
 * userPreferences.get('key');
 * userPreferences.set('key', value);
 * userPreferences.all();
 * userPreferences.all({ key: value });
 */


// TODO : IMPORT
import {ScalarObject, ScalarValue} from "../core-utils/dist/Global";

import * as path from "path";
import * as fs from "fs";

// Default preferences folder path
let preferencesPath = '.preferences';

// Default username from OS current user
let currentUsername = require('os').userInfo().username;

/**
 * Read current user preferences file
 */
const readObject = ():Promise<ScalarObject> => new Promise( (resolve, reject) =>
{
	// Return empty object if there is no file
	const path = getFilePath();
	if ( !fs.existsSync( path ) ) resolve({});

	// Try to read JSON data if file exists
	fs.readFile( getFilePath(), (error, data) =>
	{
		// Error detected, reject
		if ( error ) { reject(); return; }

		// Try to parse JSON
		let parsedData:ScalarObject;
		try
		{
			parsedData = JSON.parse( data.toString() ) as ScalarObject
		}
		// Error detected, reject
		catch ( exception ) { reject();return; }

		// JSON parsed, resolve
		resolve( parsedData );
	});
});

/**
 * Write current user preferences file
 */
const writeObject = () => new Promise( (resolve, reject) =>
{

});

export function getUser ()
{
	return currentUsername;
}

export function setUser ( username:string )
{
	currentUsername = username;
}

export function setPath ( path:string )
{
	preferencesPath = path;
}

function getFilePath ()
{
	return path.join( preferencesPath, getUser(), '.json');
}


export async function has ( key:string )
{
	const object = await readObject();
	return (key in object);
}

export async function get ( key:string )
{
	const object = await readObject();
	return key in object ? object[ key ] : null;
}

/**
 * Set a preference for current User.
 * @param key
 * @param value
 */
export async function set ( key:string, value:ScalarValue )
{
	const object = await readObject();
	object[ key ] = value;
	await writeObject();
}

/**
 * Get or set all preferences values.
 * @param value Will set value if defined. Otherwise function will return all values.
 */
export async function all ( value?:ScalarObject )
{
	if (value != null)
		await writeObject( value );
	else
		return await readObject();
}

/**
 * Remove all preferences for current user.
 */
export function clear ()
{
	const path = getFilePath();
	fs.existsSync( path ) && fs.unlinkSync( path );
}