import {Signal} from "./Signal";
import {StringUtils} from "../utils/StringUtils";
import {DOMUtils} from "../utils/DOMUtils";

/**
 - Une sorte de ResponsiveManager qui balance des signaux / event ça pourrait être cool car comme ça on peut setState les react
 - S'inspirer de ça : https://github.com/contra/react-responsive
 - Faudrait une sorte de block react if / else pour que ça soit plus pratique
 */


/**
 * A breakpoint.
 * Can be created in plain javascript for more usability.
 * All parameters are mandatory.
 */
export interface IBreakpoint
{
    direction		:EDirection;
    from			:number;
    name			:EBreakpointName;
}

/**
 * Direction
 */
export enum EDirection
{
    HORIZONTAL,
    VERTICAL
}

/**
 * Screen aspect ratio
 */
export enum EAspectRatio
{
    LANDSCAPE,
    PORTRAIT
}

/**
 * Pre-created sizes.
 * You can use either abstract or concrete naming.
 */
export enum EBreakpointName
{
    // Abstract paradigm
    TINY,
    EXTRA_SMALL,
    SMALL,
    MEDIUM,
    LARGE,
    EXTRA_LARGE,
    GIGANTIC,

    // Concrete paradigm
    MOBILE,
    PHABLET,
    TABLET,
    LAPTOP,
    DESKTOP
}

export class ResponsiveManager
{
    // ------------------------------------------------------------------------- SINGLETON

    // Our singleton instance
    protected static __INSTANCE	:ResponsiveManager;

    /**
     * Get responsive manager instance.
     * @returns {ResponsiveManager}
     */
    static get instance ():ResponsiveManager
    {
        // If instance does'n exists
        if (ResponsiveManager.__INSTANCE == null)
        {
            // Create a new one
            ResponsiveManager.__INSTANCE = new ResponsiveManager();
        }

        // Return instance
        return ResponsiveManager.__INSTANCE;
    }


    // ------------------------------------------------------------------------- PROPERTIES

    /**
     * All registered breakpoints, horizontal and vertical.
     * Can be unordered, breakpoint matching algorithm doesn't need ordered breakpoints.
     */
    protected _breakpoints						:IBreakpoint[] = [];
    get breakpoints ():IBreakpoint[] { return this._breakpoints }

    /**
     * When horizontal breakpoint changed after window resize.
     */
    protected _onHorizontalBreakpointChanged	:Signal 		= new Signal();
    get onHorizontalBreakpointChanged ():Signal { return this._onHorizontalBreakpointChanged; }

    /**
     * When vertical breakpoint changed after window resize.
     */
    protected _onVerticalBreakpointChanged		:Signal 		= new Signal();
    get onVerticalBreakpointChanged ():Signal { return this._onVerticalBreakpointChanged; }

    /**
     * When screen aspect ratio has changed.
     */
    protected _onAspectRatioChanged				:Signal = new Signal();
    get onAspectRatioChanged ():Signal { return this._onAspectRatioChanged; }

    /**
     * When window size has changed.
     */
    protected _onWindowSizeChanged				:Signal 		= new Signal();
    get onWindowSizeChanged ():Signal { return this._onWindowSizeChanged; }

    /**
     * Current window width
     */
    protected _currentWindowWidth				:number;
    get currentWindowWidth ():number { return this._currentWindowWidth; }

    /**
     * Current window height
     */
    protected _currentWindowHeight				:number;
    get currentWindowHeight ():number { return this._currentWindowHeight; }

    /**
     * Current horizontal breakpoint.
     * Can be null if breakpoints are not registered correctly.
     * @important Please use horizontalLessThan and horizontalMoreThan instead of this
     * to check breakpoints when building views.
     * Those methods are stronger in case you add a breakpoint further in time.
     */
    protected _currentHorizontalBreakpoint		:IBreakpoint;
    get currentHorizontalBreakpoint ():IBreakpoint { return this._currentHorizontalBreakpoint; }

    /**
     * Current vertical breakpoint.
     * Can be null if breakpoints are not registered correctly.
     * @important Please use verticalLessThan and verticalMoreThan instead of this
     * to check breakpoints when building views.
     * Those methods are stronger in case you add a breakpoint further in time.
     */
    protected _currentVerticalBreakpoint		:IBreakpoint;
    get currentVerticalBreakpoint ():IBreakpoint { return this._currentVerticalBreakpoint; }

    /**
     * Current screen aspect ratio.
     * Aspect ratio is defined by ratio between screen width and screen height.
     * No native rotation API used.
     */
    protected _currentAspectRatio				:EAspectRatio;
    get currentAspectRatio ():EAspectRatio { return this._currentAspectRatio; }


    // ------------------------------------------------------------------------- INIT

    /**
     * Responsive Manager constructor.
     */
    constructor ()
    {
        this.initEventsListening();
    }

    /**
     * Init events listening
     */
    protected initEventsListening ()
    {
        // Listen window size changing
        $(window).on( 'resize', this.windowResizeHandler.bind(this) );

        // Dispatch first resize to have breakpoints
        // without dispatching signals to avoid breakpoint the app
        this.windowResizeHandler( null );
    }


    // ------------------------------------------------------------------------- BREAKPOINTS CONFIG

    /**
     * Register a new set of breakpoints.
     * Can be unordered and have to contains either horizontal and vertical breakpoints.
     * @param pBreakpoints List of breakpoints as JSON formatted object.
     */
    public setBreakpoints (pBreakpoints:IBreakpoint[])
    {
        // Register breakpoints
        this._breakpoints = pBreakpoints;

        // Dispatch first resize to have breakpoints
        // without dispatching signals to avoid breaking the app
        this.windowResizeHandler( null );
    }

    /**
     * Auto set breakpoints from LESS.
     *
     * Note that breakpoints have to be named like so :
     * "breakpoints-%direction%-%breakpointName%"
     *
     * %direction% have to be camelCase version of EDirection
     * %breakpointName% have to be camelCase version of EBreakpointName.
     *
     * Values have to be as string in px.
     *
     * Ex, a valid breakpoint (in JSON :
     * "breakpoint-vertical-extraSmall" : "320px"
     *
     * @param pLessBreakpoints Key / value pair of breakpoints
     */
    public autoSetBreakpointsFromLess (pLessBreakpoints:{[index:string]:string})
    {
        // Reset breakpoints list
        this._breakpoints = [];

        // Browse directions
        let directionIndex = -1;
        while (++directionIndex in EDirection)
        {
            // Get direction name
            let directionEnumName = EDirection[ directionIndex ];
            let directionCamelName = StringUtils.dashToCamelCase(directionEnumName, '_');

            // Browse breakpoints for each direction
            let breakpointIndex = -1;
            while (++breakpointIndex in EBreakpointName)
            {
                // Get breakpoint name
                let breakpointEnumName = EBreakpointName[ breakpointIndex ];
                let breakpointCamelName = StringUtils.dashToCamelCase(breakpointEnumName, '_');

                // Name of this breakpoint and direction inside less file
                let lessVarName = 'breakpoint-' + directionCamelName + '-' + breakpointCamelName;

                // If this variable exists
                if ( lessVarName in pLessBreakpoints )
                {
                    // Add breakpoint inside registry
                    this._breakpoints.push({

                        // Direction back to enum format
                        direction: EDirection[ directionEnumName ],

                        // Name back to enum format
                        name : EBreakpointName[ breakpointEnumName ],

                        // Parse value and extract pixel value
                        from : DOMUtils.cssToNumber(
                            pLessBreakpoints[ lessVarName ]
                        )[0]
                    });
                }
            }
        }

        // Dispatch first resize to have breakpoints
        // without dispatching signals to avoid breaking the app
        this.windowResizeHandler( null );
    }

    // ------------------------------------------------------------------------- HANDLERS

    /**
     * When the app window is resized.
     * Will measure window and then update current breakpoints from those sizes.
     * @param pEvent Will dispatch signals if this event is not null
     */
    protected windowResizeHandler (pEvent:Event)
    {
        // Register window size
        this._currentWindowWidth = $(window).width();
        this._currentWindowHeight = $(window).height();

        // Update current breakpoints and aspect ratio from those sizes
        // And dispatch signals only if this method is dispatched from an event
        this.updateCurrentBreakpoints( pEvent != null );
        this.updateCurrentAspectRatio( pEvent != null );

        // Dispatch new window size if we have an event
        if (pEvent != null)
        {
            this._onWindowSizeChanged.dispatch(
                this._currentWindowWidth,
                this._currentWindowHeight
            );
        }

        // Zepto return
        return false;
    }


    // ------------------------------------------------------------------------- ASPECT RATIO DETECTION

    /**
     * Update current aspect ratio and dispatch signals if needed.
     * @param pDispatchSignal Dispatch signals if true
     */
    protected updateCurrentAspectRatio (pDispatchSignal:boolean )
    {
        // Compute new aspect ratio from window sizes
        let newAspectRatio = (
            (this._currentWindowWidth > this._currentWindowHeight)
                ? EAspectRatio.LANDSCAPE
                : EAspectRatio.PORTRAIT
        );

        // If aspect ratio changed
        if (newAspectRatio != this._currentAspectRatio)
        {
            // Registrer new aspect ratio
            this._currentAspectRatio = newAspectRatio;

            // Dispatch if needed
            pDispatchSignal && this._onAspectRatioChanged.dispatch( newAspectRatio );
        }
    }


    // ------------------------------------------------------------------------- BREAKPOINT DETECTION

    /**
     * Update current breakpoints and dispatch signals if needed.
     * @param pDispatchSignal Dispatch signals if true
     */
    protected updateCurrentBreakpoints ( pDispatchSignal:boolean )
    {
        // New breakpoints from new window size
        let newHorizontalBreakpoint	:IBreakpoint = null;
        let newVerticalBreakpoint	:IBreakpoint = null;

        // Browse all breakpoints
        this._breakpoints.map( (breakpoint) =>
        {
            // Get nearest horizontal breakpoint
            if (
                // Check direction
                breakpoint.direction == EDirection.HORIZONTAL

                // If this breakpoint si near to window size
                && this._currentWindowWidth >= breakpoint.from

                // And if this breakpoint is bigger than previous nearest one
                && (
                    newHorizontalBreakpoint == null
                    ||
                    breakpoint.from > newHorizontalBreakpoint.from
                )
            )
            {
                // We store this breakpoint as the nearest horizontal one for now
                newHorizontalBreakpoint = breakpoint;
            }

            // Get nearest vertical breakpoint
            if (
                // Check direction
                breakpoint.direction == EDirection.VERTICAL

                // If this breakpoint si near to window size
                && this._currentWindowHeight >= breakpoint.from

                // And if this breakpoint is bigger than previous nearest one
                && (
                    newVerticalBreakpoint == null
                    ||
                    breakpoint.from > newVerticalBreakpoint.from
                )
            )
            {
                // We store this breakpoint as the nearest vertical one for now
                newVerticalBreakpoint = breakpoint;
            }
        });

        // If horizontal breakpoint changed
        if (this._currentHorizontalBreakpoint != newHorizontalBreakpoint)
        {
            // Get old for signal and register new one
            let oldBreakpoint = this._currentHorizontalBreakpoint;
            this._currentHorizontalBreakpoint = newHorizontalBreakpoint;

            // Dispatch if needed
            if ( pDispatchSignal )
            {
                this._onHorizontalBreakpointChanged.dispatch(
                    newHorizontalBreakpoint,
                    oldBreakpoint
                );
            }
        }

        // If vertical breakpoint changed
        if (this._currentVerticalBreakpoint != newVerticalBreakpoint)
        {
            // Get old for signal and register new one
            let oldBreakpoint = this._currentVerticalBreakpoint;
            this._currentVerticalBreakpoint = newVerticalBreakpoint;

            // Dispatch if needed
            if ( pDispatchSignal )
            {
                this._onVerticalBreakpointChanged.dispatch(
                    newVerticalBreakpoint,
                    oldBreakpoint
                );
            }
        }
    }


    // ------------------------------------------------------------------------- BREAKPOINT HELPERS

    /**
     * Get a registered breakpoint as IBreakpoint from it's breakpoint name and direction.
     * IBreakpoint instance will be the same reference as the registered one.
     * Will returns null if not found.
     * @param pDirection Direction of the breakpoint we want to get
     * @param pBreakpointName Breakpoint's name
     * @returns {IBreakpoint} Reference of registered IBreakpoint. Can be null.
     */
    protected getBreakpointFromNameAndDirection (pDirection:EDirection, pBreakpointName:EBreakpointName):IBreakpoint
    {
        // Filter only matching breakpoints
        let matchingBreakpoints = this._breakpoints.filter( (breakpoint:IBreakpoint) =>
        {
            return (
                // Check direction
                breakpoint.direction == pDirection

                // Check name
                &&
                breakpoint.name == pBreakpointName
            )
        });

        // Return matching breakpoint or null
        return (matchingBreakpoints.length > 0 ? matchingBreakpoints[0] : null);
    }

    /**
     * Get the nearest breakpoint from a specific IBreakpoint.
     * We can search for the next or previous breakpoint (@see parameters)
     * Can be null if there is no bigger or smaller breakpoint on this direction.
     * Will check breakpoints only with the same direction of pBreakpoint.
     * @param pBreakpoint We want its sibling, next or previous
     * @param pSearchNext If true, will search for next, otherwise, will search for previous breakpoint.
     * @returns {IBreakpoint} The next or previous found breakpoint. Can be null.
     */
    protected getNearestBreakpointFrom (pBreakpoint:IBreakpoint, pSearchNext:boolean):IBreakpoint
    {
        // Selected breakpoint to compare with others
        // And to get the nearest (above or below) from our breakpoint parameter
        let selectedBreakpoint:IBreakpoint;

        // Browse all breakpoints
        this._breakpoints.map( (breakpoint:IBreakpoint) =>
        {
            // Select breakpoint if :
            if (
                // We have the good direction
                breakpoint.direction == pBreakpoint.direction

                // This is not the same breakpoint
                // We check the name to be compatible with non references IBreakpoints
                &&
                breakpoint.name != pBreakpoint.name

                // If this breakpoint is bigger or smaller
                // depending on pSearchNext parameters
                && (
                    pSearchNext
                        ? breakpoint.from > pBreakpoint.from
                        : breakpoint.from < pBreakpoint.from
                )

                &&
                (
                    // We select this one at this stage if we do not already have selected breakpoint
                    selectedBreakpoint == null

                    // Or we search for a breakpoint fitting in between
                    || (
                        pSearchNext
                            ? breakpoint.from < selectedBreakpoint.from
                            : breakpoint.from > selectedBreakpoint.from
                    )
                )
            )
            {
                selectedBreakpoint = breakpoint;
            }
        });

        // Return selected breakpoint
        return selectedBreakpoint;
    }

    /**
     * Get the next breakpoint from a specific IBreakpoint.
     * @see getBreakpointFromNameAndDirection to convert breakpoint from name and direction to IBreakpoint.
     * Can be null if there is no bigger or smaller breakpoint on this direction.
     * Will check breakpoints only with the same direction of pBreakpoint.
     * @param pBreakpoint We want its next sibling
     * @returns {IBreakpoint} The next found breakpoint. Can be null.
     */
    public getNextBreakpoint (pBreakpoint:IBreakpoint):IBreakpoint
    {
        return this.getNearestBreakpointFrom(pBreakpoint, true);
    }

    /**
     * Get the previous breakpoint from a specific IBreakpoint.
     * @see getBreakpointFromNameAndDirection to convert breakpoint from name and direction to IBreakpoint.
     * Can be null if there is no bigger or smaller breakpoint on this direction.
     * Will check breakpoints only with the same direction of pBreakpoint.
     * @param pBreakpoint We want its previous sibling
     * @returns {IBreakpoint} The previous found breakpoint. Can be null.
     */
    public getPreviousBreakpoint (pBreakpoint:IBreakpoint):IBreakpoint
    {
        return this.getNearestBreakpointFrom(pBreakpoint, false);
    }


    // ------------------------------------------------------------------------- BREAKPOINT API

    /**
     * Will check if current window size is less than a specific breakpoint.
     * Will NOT include the breakpoint very position by default.
     * Please use this method along with isMoreThan instead of currentHorizontalBreakpoint and currentVerticalBreakpoint.
     * If you add breakpoints when building your application, your code will still work with this approach.
     * @param pBreakpointName Breakpoint name we want to check.
     * @param pDirection Direction we want to check, horizontal by default.
     * @param pOrEqualTo Consider the very breakpoint position as less than. Default is false for isLessThan.
     * @returns {boolean} True if current breakpoint is less or equal to this breakpoint.
     */
    public isLessThan (pBreakpointName:EBreakpointName, pDirection:EDirection = EDirection.HORIZONTAL, pOrEqualTo = false):boolean
    {
        // Target IBreakpoint from name and direction
        let currentBreakpoint = this.getBreakpointFromNameAndDirection(pDirection, pBreakpointName);

        // Check if we found a registered breakpoint with those parameters
        if (currentBreakpoint == null)
        {
            throw new Error(`ResponsiveManager.isLessThan // Invalid breakpoint. ${EDirection[pDirection]} breakpoint named ${EBreakpointName[pBreakpointName]} is not registered.`);
        }

        // Check if our breakpoint fits
        return (
            // Horizontal breakpoint
            (
                pDirection == EDirection.HORIZONTAL
                &&
                (
                    pOrEqualTo
                        ? (this._currentWindowWidth <= currentBreakpoint.from)
                        : (this._currentWindowWidth < currentBreakpoint.from)
                )
            )

            // Vertical breakpoint
            || (
                pDirection == EDirection.VERTICAL
                &&
                (
                    pOrEqualTo
                        ? (this._currentWindowHeight <= currentBreakpoint.from)
                        : (this._currentWindowHeight < currentBreakpoint.from)
                )
            )
        );
    }

    /**
     * Will check if current window size is more than a specific breakpoint.
     * Will include the breakpoint very position by default.
     * Please use this method along with isLessThan instead of currentHorizontalBreakpoint and currentVerticalBreakpoint.
     * If you add breakpoints when building your application, your code will still work with this approach.
     * @param pBreakpointName Breakpoint name we want to check.
     * @param pDirection Direction we want to check, horizontal by default.
     * @param pOrEqualTo Consider the very breakpoint position as more than. Default is true for isMoreThan.
     * @returns {boolean} True if current window size is more or equal to this breakpoint.
     */
    public isMoreThan (pBreakpointName:EBreakpointName, pDirection:EDirection = EDirection.HORIZONTAL, pOrEqualTo = true):boolean
    {
        // Target IBreakpoint from name and direction
        let currentBreakpoint = this.getBreakpointFromNameAndDirection(pDirection, pBreakpointName);

        // Check if we found a registered breakpoint with those parameters
        if (currentBreakpoint == null)
        {
            throw new Error(`ResponsiveManager.isMoreThan // Invalid breakpoint. ${EDirection[pDirection]} breakpoint named ${EBreakpointName[pBreakpointName]} is not registered.`);
        }

        // Check if our breakpoint fits
        return (
            // Horizontal breakpoint
            (
                pDirection == EDirection.HORIZONTAL
                &&
                (
                    pOrEqualTo
                        ? (this._currentWindowWidth >= currentBreakpoint.from)
                        : (this._currentWindowWidth > currentBreakpoint.from)
                )

            )

            // Vertical breakpoint
            || (
                pDirection == EDirection.VERTICAL
                &&
                (
                    pOrEqualTo
                        ? (this._currentWindowHeight >= currentBreakpoint.from)
                        : (this._currentWindowHeight > currentBreakpoint.from)
                )
            )
        );
    }
}