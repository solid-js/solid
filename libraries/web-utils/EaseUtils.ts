// TODO : A virer si on ne garde pas greensock

// ----------------------------------------------------------------------------- STRUCT

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


// ----------------------------------------------------------------------------- CLASS

export class EaseUtils
{
    // ------------------------------------------------------------------------- MAIN EASE

    /**
     * Application's main easing
     */
    protected static __mainEase		:CustomEaseType;

    /**
     * Application's main easing
     * @returns {EaseType}
     */
    static get mainEase ():CustomEaseType { return this.__mainEase; }

    /**
     * Set Application's main easing
     * @param pEase
     */
    public static registerMainEase (pEase:CustomEaseType)
    {
        this.__mainEase = pEase;
    }


    // ------------------------------------------------------------------------- COMBINE EASE

    /**
     * Combine two easing into one.
     * Handy to adjust Attack or Release of a tween.
     * The first easing is used before the ratio, and second one after.
     * @param pFirstEase First tween, the easeIn
     * @param pSecondEase Second tween the easeOut
     * @param pRatio Ratio when we get from first to second ease. Default is .5
     * @returns {(pTweenRatio:number)=>number}
     */
    public static combine (pFirstEase:GSAPEase, pSecondEase:GSAPEase, pRatio = .5) : CustomEaseType
    {
        // Compute inverted ratio once
        const invertRatio = (1 - pRatio);

        // Return a function, TweenLite seems compatible with this light approach
        return (pTweenRatio:number) =>
            (
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