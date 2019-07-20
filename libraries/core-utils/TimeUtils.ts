import { AnyHandler } from "./Global";

export module TimeUtils
{
	/**
	 * Time based promise delay.
	 * @param duration Delay to wait, in seconds.
	 */
	export function delay ( duration = 1 )
	{
		return new Promise( r =>  setTimeout( r, duration ) )
	}
}