import { AnyHandler } from "./_global";

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

	/**
	 * TODO : Un délais qui peut-être annulé
	 */
	export function cancelableDelay ()
	{

	}

	/**
	 * TODO : Une boucle isomorphique node / browser
	 * @param frequency
	 * @param handler
	 */
	export function loop ( frequency = 1, handler:AnyHandler )
	{
		return () => {
			// Stop loop
		};
	}

	/**
	 * TODO : Debounce
	 */
	export function debounce ()
	{

	}

	/**
	 * TODO : Throttle
	 */
	export function throttle ()
	{

	}
}