




/**
 * Wait a bit, with a promise.
 */
export const delay = ( seconds:number ) => new Promise(
	resolve => setTimeout( resolve, seconds * 1000)
);

