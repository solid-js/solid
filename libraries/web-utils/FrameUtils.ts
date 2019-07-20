// TODO IMPORT
import { MathUtils } from "../../core/utils/MathUtils";
import { AnyHandler } from "../../core/utils/Global";

// TODO DOC
// TODO : Set et get global frame rate ?
// TODO : Global frame rate auto selon écran ? 90 / 120
let globalFrameRate = 60;

export module FrameUtils
{
    /**
     * List of all frame rates compatible with 60 fps sync to avoid jerky animations
     * Every frame rate is named by it divisor factor of 60
     * Ex : F2 is 60 divided by 2 so 30 fps
     * Ex : F6 is 60 divided by 6 so 10 fps
     *
     * -- IMPORTANT --
     * 60 is the base frame rate for majority of browsers / environments.
     * But some-times it may run at 90 or 120, for VR head-sets for examples.
     * In case of 120 fps, every animations will run twice.
     * In case of 90 fps, every animations will run at 150%.
     * In either case, there will be no jerky animation because of 90 and 120 on
     * the same base of 60 ( all listed divisors will work )
     */
    export enum FRAME_RATE
    {
        F1  = 60,
        F2  = 30,
        F3  = 20,
        F4  = 15,
        F5  = 12,
        F6  = 10,
        F10 = 6,
        F12 = 5,
        F15 = 4,
        F20 = 3,
        F30 = 2,
        F60 = 1,
    }

    /**
     * Frame based promise delay
     * @param duration Total number of frames to wait. Based on current browser frame rate.
     *                 default is 60 but can be 90 or 120 in cases of VR headset for example.
     *                 Check solid/core/utils/TimeUtils.delay to do time based delays.
     * @param loopHandler Handler to call at each counted frames.
     * @param loopScope Optional scope for the loop handler. Ignore to use contextual scope.
     */
    export function delay ( duration = 60, loopHandler?:AnyHandler, loopScope?:any )
    {
        return new Promise( r =>
        {
            // Ask the browser to call frameLoop() at next animation frame
            const requestFrame = () => requestAnimationFrame( frameLoop );

            // Process a frame loop
            function frameLoop ()
            {
                // Call handler with scope if defined
                loopHandler && (
                    loopScope
                    ? loopHandler.call( loopScope )
                    : loopHandler()
                );

                // Decrease duration and resolve if finished
                duration -- == 0 ? r() : requestFrame();
            }
        })
    }

	/**
	 * TODO DOC
	 * @param loopHandler
	 * @param frameRate
	 * @param loopScope
	 */
    export function loop ( loopHandler:AnyHandler, frameRate:FRAME_RATE|number = FRAME_RATE.F1, loopScope?:any )
    {
        // Ask the browser to call frameLoop() at next animation frame
        // We store the last request id to be able to cancel it further
        let requestNumber:number;
        const requestFrame = () => requestNumber = window.requestAnimationFrame( frameLoop );

        // Frame counter if we have a frame rate divider
        let frameCounter = 0;

		// Call handler with scope if defined
        const callHandler = () => ( loopScope ? loopHandler.call( loopScope ) : loopHandler() );

        // Process a frame loop
        function frameLoop ()
        {
            // Always validate frame directly if this loop is running at global speed
            if ( frameRate == globalFrameRate ) callHandler();

            // Count this frame and validate if we have waited enough frames
            else if ( ++ frameCounter >= globalFrameRate / frameRate )
			{
        		// Validate a frame by calling handler and resetting counter
				callHandler();
				frameCounter = 0;
			}

            // Allways request next frame
            requestFrame();
        }

        // Return a function which will destroy the ticker when called
        return () => cancelAnimationFrame( requestNumber );
    }

	/**
	 * NOTE : Disabled because of polyfill.js : https://caniuse.com/#feat=requestanimationframe
	 * Install polyfill for requestAnimationFrame if browser does't already have it.
	 */
	/*
	export function polyfillRAF ()
	{
	    // Do not polyfill if requestAnimationFrame is already there
		if ('requestAnimationFrame' in window) return;

		// We add a exclamation mark here because typescript is lost somehow ...
		// https://stackoverflow.com/questions/44147937/property-does-not-exist-on-type-never
		window!.requestAnimationFrame = (
			window!['webkitRequestAnimationFrame'] ||
			window!['mozRequestAnimationFrame'] ||
			window!['oRequestAnimationFrame'] ||
			window!['msRequestAnimationFrame'] ||
			function ( callback )
			{
				window.setTimeout( callback, 1000 / globalFrameRate );
			}
		);
	}
	*/
}