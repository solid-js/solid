namespace GreensockUtils
{
    /**
     * The name of the silly greensock injected var
     */
    const GS_TRANSFORM_KEY = '_gsTransform';

    /**
     * Get a position value transformed by Greensock.
     * Ex X or Y while a transition on a any object.
     */
    export function getGreensockValue (target:any):number
    {
        // No target
        if ( target == null )
            return null;

        // Transform key available
        else if (GS_TRANSFORM_KEY in target)
            return target[GS_TRANSFORM_KEY];

        // Transform key available in first child (jQuery / zepto)
        else if ( (0 in target) && GS_TRANSFORM_KEY in target[0] )
            return target[0][GS_TRANSFORM_KEY];

        // Oops
        else return null;
    }

    /**
     * Custom easing without GSAP implementation
     */
    export interface CustomEaseType
    {
        (pRatio:number) : number;
    }

    export interface GSAPEase
    {
        getRatio( pValue:number ) : number;
    }

    /**
     * Combine two easing into one.
     * Handy to adjust Attack or Release of a tween.
     * The first easing is used before the ratio, and second one after.
     * @param pFirstEase First tween, the easeIn
     * @param pSecondEase Second tween the easeOut
     * @param pRatio Ratio when we get from first to second ease. Default is .5
     * @returns {(pTweenRatio:number)=>number}
     */
    export function combineEasings (pFirstEase:GSAPEase, pSecondEase:GSAPEase, pRatio = .5) : CustomEaseType
    {
        // Compute inverted ratio once
        const invertRatio = (1 - pRatio);

        // Return a function, TweenLite seems compatible with this light approach
        return (pTweenRatio:number) => (
            // Before ratio we are on the first Easing
            (pTweenRatio < pRatio)
            // Compute first easing from 0 to this ratio
            // Multiply the result by the ratio so the Easing output
            // Is equal to ratio when ended
            ? pFirstEase.getRatio(pTweenRatio / pRatio) * pRatio
            // Compute second easing with output from ratio to 1
            : (
                // Start at ratio (remember Easing one result stops to ratio)
                pRatio + (
                    // Get second ease value from inverted ratio
                    pSecondEase.getRatio(
                        (pTweenRatio - pRatio) / invertRatio
                    )
                    // Multiply the ratio by invertRatio so the second Easing
                    // Is between ratio and 1
                    * invertRatio
                )
            )
        );
    }
}