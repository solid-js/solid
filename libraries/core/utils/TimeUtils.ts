import { AnyHandler } from "../Global";

export module TimeUtils
{
	/**
	 *
	 * @param duration
	 */
	export function timeDelay ( duration = 1 )
	{
		return new Promise( r =>  setTimeout( r, duration ) )
	}

	/**
	 *
	 * @param duration
	 * @param loopHandler
	 */
	export function frameDelay ( duration = 60, loopHandler?:AnyHandler )
	{
		return new Promise( r =>
		{
			const requestFrame = () => requestAnimationFrame( frameLoop );

			function frameLoop ()
			{
				loopHandler && loopHandler();
				duration -- == 0 ? r() : requestFrame();
			}
		})
	}
}