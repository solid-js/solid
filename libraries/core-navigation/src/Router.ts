import {StringUtils} from "@solid-js/utils";
import {Signal} from "@solid-js/signal";
import {IPageStack} from "./IPageStack";

// ----------------------------------------------------------------------------- STRUCT

/**
 * Interface for action parameters.
 * This is an associative array.
 * Value can be either string or number.
 */
export interface IActionParameters
{
    [index:string] : string|number;
}

/**
 * Interface for route matching with URLs.
 * This is created by the router.
 * It contains every info to run an action on a page with parameters.
 */
export interface IRouteMatch
{
    /**
     * Page name.
     * Can be a page to show in stack or any name that is fine to you.
     */
    page				:string;

    /**
     * Page importer, to get page class.
     */
    importer			?:() => Promise<any>;

    /**
     * Action to execute on page.
     * Default is "index"
     */
    action				?:string;

    /**
     * Stack name which have to show page.
     * Default is "main"
     */
    stack				?:string;

    /**
     * Parameters matching with this route.
     */
    parameters			?:IActionParameters;

    /**
     * Original route triggering this route match.
     * Will be created by router when matchin. Do not touch :)
     */
    _fromRoute			?:IRoute;
}

/**
 * Interface for a declared route listening.
 * This is created by dev using the router.
 * It contains every info to link a dynamic URL with a page / action.
 */
export interface IRoute
{
    /**
     * Link to trigger this route, without base and with leading slash.
     * Parameters are delimited with { }
     * Prepend parameter with a # to force it as a number
     *
     * ex : my-route-{#id}-{slug}.html
     */
    url					:string;

    /**
     * Page name.
     * Can be a page to show in stack or any name that is fine to you.
     */
    page				:string;

    /**
     * Page importer, to get page class.
     * Will use dynamic page importer if null.
     */
    importer			?:() => Promise<any>;

    /**
     * Action to execute on page.
     * Default is "index"
     */
    action				?:string;

    /**
     * Optional, called when route is triggered.
     * @param pRouteMatch Matching route with action and parameters
     */
    handler				?:( pRouteMatch:IRouteMatch ) => void;

    /**
     * Stack name which have to show page.
     * Default is "main"
     */
    stack				?:string;

    /**
     * Route regex for matching.
     * Will be created by router when adding. Do not touch :)
     */
    _matchingRegex		?:RegExp;

    /**
     * Params name for matching.
     * Will be created by router when adding. Do not touch :)
     */
    _matchingParameter	?:string[];
}

/**
 * Object to allow dynamic page importers.
 * Will map a page name to an importer.
 */
export interface IDynamicPageImporter
{
    /**
     * Page name to associate with importer
     */
    page		:string;

    /**
     * Page importer, to get page class.
     */
    importer	?:() => Promise<any>;
}

/**
 * This router uses pushState.
 * See coverage at http://caniuse.com/#search=pushstate
 * IE 10+
 */
export class Router
{
    // ------------------------------------------------------------------------- STATICS

    /**
     * Left delimiter for URL parameters templating
     */
    static LEFT_PARAMETERS_DELIMITER 		= '{';

    /**
     * Right delimiter for URL parameters templating
     */
    static RIGHT_PARAMETER_DELIMITER 		= '}';

    /**
     * Regex rule to detect slugified parameters.
     * As string because we'll create one dynamic regex by route.
     */
    static PARAMETER_RULE 					= '([0-9a-zA-Z\_\%\+\-]+)';

    /**
     * Regex rule to detect numeric parameters.
     * As string because we'll create one dynamic regex by route.
     */
    static NUMBER_PARAMETER_RULE 			= '([0-9]+)';

    /**
     * Regex to replace parameters in URLs.
     */
    static PARAMETER_REPLACE_RULE 			= /\{(.*?)\}/g;


    // ------------------------------------------------------------------------- LOCALS

    // If our router is started and is listening to route changes
    protected static _isStarted = false;


    // ------------------------------------------------------------------------- PROPERTIES

    /**
     * Application base.
     *
     * - Let empty to work in relative mode.
     * - No sub folders will be allowed in URLs after base.
     * - ex :
     * 		If application is installed here : http://domain.com/my-sub-folder/my-app/
     * 		Pages with URLs like http://domain.com/my-sub-folder/my-app/another-sub/my-page.html will not work.
     *
     * OR
     *
     * - Set path from domain name to application. Starting and ending with slash.
     * - ex :
     * 		If application is installed here : http://domain.com/my-sub-folder/my-app/
     * 		Base should be : "/my-sub-folder/my-app/"
     * - ex :
     * 		If application is installed here : http://domain.com/
     * 		Base should be : "/"
     */
    protected static _base					:string;
    static get base ():string { return this._base }
    static set base (value:string)
    {
        // Auto base if empty
        if (value == '')
        {
            value = StringUtils.getBaseFromPath( window.location.pathname );
        }

        // Add leading and trailing slash
        value = StringUtils.leading(value, true);
        value = StringUtils.trailing(value, true);

        // Set
        this._base = value;
    }

    /**
     * List of declared routes
     */
    protected static _routes				:IRoute[] 			= [];
    static get routes ():IRoute[] { return this._routes; }

    /**
     * With dry mode, Router is working without address bar.
     * Useful when embedded inside a web view for example.
     */
    protected static _dryMode				:boolean;
    static get dryMode ():boolean { return this._dryMode; }

    /**
     * Current path, including base.
     */
    protected static _currentPath			:string;
    static get currentPath ():string { return this._currentPath; }

    /**
     * Current route matching with current URL
     */
    protected static _currentRouteMatch 	:IRouteMatch;
    static get currentRouteMatch ():IRouteMatch { return this._currentRouteMatch; }

    protected static _onBeforeRouteChanged  :Signal             = new Signal();

    /**
     * When current route is changing
     */
    protected static _onRouteChanged		:Signal				= new Signal();
    static get onRouteChanged ():Signal { return this._onRouteChanged; }

    /**
     * When route is not found
     */
    protected static _onNotFound			:Signal				= new Signal();
    static get onNotFound ():Signal { return this._onNotFound; }

    /**
     * If this is our first routed page.
     * Will be null if first page has not fired yet.
     */
    protected static _isFirstPage = null;
    static get isFirstPage ():boolean|null
    {
        return Router._isFirstPage;
    }

    /**
     * Get declared dynamic pages importers.
     */
    protected static _dynamicPageImporters:IDynamicPageImporter[] = [];
    static get dynamicPageImporters ():IDynamicPageImporter[]
    {
        return Router._dynamicPageImporters;
    }


    // ------------------------------------------------------------------------- INIT

    /**
     * Router constructor.
     * Please use before accessing with singleton static methods.
     * @param base The base of the app from the server. @see Router.base
     * @param fakeMode With fake mode, Router is working without address bar. Usefull when embedded inside a web view for example.
     */
    static init (base = '', fakeMode = false)
    {
        // Set base
        this.base = base;

        // In fake mode, init current path
        this._dryMode = fakeMode;
        if ( this._dryMode )
            this._currentPath = '';

        // Listen to popstate
        else
            window.addEventListener('popstate', this.popStateHandler );
    }

    /**
     * Add a set of dynamic page importers to the Router.
     * It will help to know which page to import if there is no importer in declared routes.
     */
    static addDynamicPageImporters (pImporters:IDynamicPageImporter[])
    {
        pImporters.map( importer =>
        {
            Router._dynamicPageImporters.push( importer );
        });
    }


    // ------------------------------------------------------------------------- LINKS LISTENING

    /**
     * TODO : Faire balise link sans YADL
     */

    /**
     * Listen links to fire internal router.
     * Default signature is a[data-internal-link]
     * @param pLinkSignature Signature to listen.
     */
    // TODO : Avec Yadl
    /*static listenLinks (pLinkSignature = 'a[data-internal-link]')
    {
        $( document ).on( 'click', pLinkSignature, this.linkClickedHandler );
    }
     */

    /**
     * When an internal link is clicked.
     * @param pEvent
     */
    /*
    protected static linkClickedHandler = (pEvent:Event) =>
    {
        // Do not follow link
        pEvent.preventDefault();

        // Cibler le lien dans la DOM
        let $target = $( pEvent.currentTarget );

        // Get href
        let fullPath = $target.attr('href');

        // Do not go further if link does exists
        if (fullPath == null) return;

        // FIXME : Faire une fonction pour faire un replaceState ? Utile ?

        // Follow link
        Router.openURL( fullPath );
        return true;
    };*/


    // ------------------------------------------------------------------------- ANALYTICS

    // GTAG id from dataLayer
    protected static _gtagId		:string;

    /**
     * Track current page for google analytics
     */
    protected static trackCurrentPage ()
    {
        // Page path, starting with a /
        // @see : https://developers.google.com/analytics/devguides/collection/gtagjs/pages
        const path = StringUtils.leading(this._currentPath, true);

        // If old GA lib is loaded
        if ('ga' in window)
        {
            // Track page view
            window['ga']('send', 'pageview', path);
        }

        // If GTAG library is loaded
        if ( typeof window['gtag'] == 'function' && 'dataLayer' in window )
        {
            // Target dataLayer object
            const dataLayer = (window['dataLayer'] as any[]);

            // If gtag id is not gathered yet
            if (this._gtagId == null)
            {
                // Browse dataLayer infos until we found it
                for (var i in dataLayer)
                {
                    if (dataLayer[i][0] == 'config')
                    {
                        // Registrer the gtag id
                        this._gtagId = dataLayer[i][1];
                        break;
                    }
                }
            }

            // Track page view
            window['gtag']('config', this._gtagId, {
                page_title : document.getElementsByTagName('title')[0].text,
                page_path: path
            });
        }
    }

    /**
     * Track a GTAG event.
     * @see : https://developers.google.com/analytics/devguides/collection/gtagjs/events
     * @param {string} pAction Action sent with the event. Mandatory.
     * @param {string} pCategory Category of event. Default is 'general'.
     * @param {string} pLabel Additionnal label. Optionnal.
     * @param {number} pValue Non negative integer. Optionnal.
     * @param {number} pNonInteraction @see https://support.google.com/analytics/answer/1033068#NonInteractionEvents
     */
    static trackEvent (pAction:string, pCategory?:string, pLabel?:string, pValue?:number, pNonInteraction:boolean = false)
    {
        if ( typeof window['gtag'] != 'function' ) return;

        // Data associated with event
        const eventData = {
            event_category: pCategory,
            event_label: pLabel,
            value: pValue
        };

        // Only add non interaction data if true
        if ( pNonInteraction )
        {
            eventData['non_interaction'] = true;
        }

        // Track event
        window['gtag']('event', pAction, eventData);
    }


    // ------------------------------------------------------------------------- ROUTE INIT

    /**
     * Register new set of routes.
     * Will be added to previously registered routes.
     * @param pRoutes
     */
    static addRoutes (pRoutes:IRoute[])
    {
        // Do nothing if no routes
        if (pRoutes == null) return;

        // Add all routes
        pRoutes.map((route:IRoute) =>
        {
            // Prepare route
            this.prepareRoute( route );

            // Add route
            this._routes.push( route );
        });
    }

    /**
     * Prepare route regex to optimise route matching phase.
     * @param pRoute Route to prepare.
     */
    protected static prepareRoute (pRoute:IRoute)
    {
        // Check route config
        if (pRoute.page == null || pRoute.page == '')
        {
            throw new Error(`Router.prepareRoute // Invalid route "${pRoute.url}", property "page" have to be not null ans not empty.`);
        }

        // Default action to "index"
        if (pRoute.action == null || pRoute.action == '')
        {
            pRoute.action = 'index';
        }

        // Default stack to "main"
        if (pRoute.stack == null || pRoute.stack == '')
        {
            pRoute.stack = 'main';
        }

        // Get url shortcut
        let url = pRoute.url;

        // Index to detect params boundaries
        let start = url.indexOf( Router.LEFT_PARAMETERS_DELIMITER );
        let end = 0;

        // Initialize the new pattern for quick detection
        let pattern = '';

        // Setup route parameters name for matching
        pRoute._matchingParameter = [];

        // Check if we have another incomming parameter on the route pattern declaration
        while (start != -1 && end != -1)
        {
            // Get boundaries for this param
            start = url.indexOf( Router.LEFT_PARAMETERS_DELIMITER );
            end = url.indexOf( Router.RIGHT_PARAMETER_DELIMITER );

            // Check if parameter starts with a #
            // This is a numeric parameter
            let isNumeric = ( url.charAt( start + 1) == '#' );

            // Get parameter name and store it inside route for matching
            pRoute._matchingParameter.push(
                url.substring(start + (isNumeric ? 2 : 1), end)
            );

            // Add parameter flag to replace with regex down bellow
            pattern += url.substring(0, start);
            pattern += '%%' + (isNumeric ? 'NUMBER_PARAMETER' : 'PARAMETER') + '%%';

            // Cut the hash for the next param detection iteration
            url = url.substring(end + 1, url.length);
            start = url.indexOf( Router.LEFT_PARAMETERS_DELIMITER );
        }

        // Add the end of pattern to the detect pattern
        pattern += url.substring(0, url.length);

        // Replace regex reserved chars on pattern
        // We do it before parameter flag this is important, to avoid doubling escaping
        pattern = pattern
            .replace(/\./g, '\\.')
            .replace(/\+/g, '\\+')
            .replace(/\*/g, '\\*')
            .replace(/\$/g, '\\$')
            .replace(/\/$/, '/?'); // Optional last slash

        // Remplace all parameter flag to corresponding regex for parameter detection
        pattern = pattern.replace(new RegExp("(\%\%PARAMETER\%\%)", 'g'), Router.PARAMETER_RULE);
        pattern = pattern.replace(new RegExp("(\%\%NUMBER_PARAMETER\%\%)", 'g'), Router.NUMBER_PARAMETER_RULE);

        // Convert it to regex and store it inside route
        pRoute._matchingRegex = new RegExp(`^${pattern}$`);
    }

    // ------------------------------------------------------------------------- STACK MANAGEMENT

    // Stacks by names
    protected static _stacks		:{ [index:string] : IPageStack } 	= {};

    /**
     * Register a pageStack by name to manage pages with declared routes.
     * @param pStackName Name of the stack.
     * @param pStack Instance of the stack.
     */
    static registerStack (pStackName:string, pStack:IPageStack)
    {
        // Check errors
        if (pStack == null)
        {
            throw new Error(`Router.registerStack // Can't register a null stack.`);
        }

        // Record instance by name
        this._stacks[ pStackName ] = pStack;
    }

    /**
     * Return stack instance by its name.
     * Will not throw anything but can return null
     * @param pStackName Name of the stack we need
     * @returns {IPageStack} Can return null if pageStack not found
     */
    static getStackByName (pStackName:string):IPageStack
    {
        return (
            (pStackName in this._stacks)
                ? this._stacks[ pStackName ]
                : null
        );
    }

    // ------------------------------------------------------------------------- ROUTE IS CHANGING

    /**
     * When state is popped.
     * @param pEvent
     */
    static popStateHandler = (pEvent:Event) =>
    {
        // Update route
        Router.updateCurrentRoute();
    };

    /**
     * State is changed, update current route.
     */
    static updateCurrentRoute ()
    {
        // If router is running
        if (this._isStarted)
        {
            // Record path from address bar if we are not in fake mode
            if (!this._dryMode)
            {
                this._currentPath = location.pathname;
            }

            // If we are on the first page
            if ( this._isFirstPage === null )
            {
                this._isFirstPage = true;
            }

            // If we are beyond the first page
            else if ( this._isFirstPage == true )
            {
                this._isFirstPage = false;
            }

            // Do not track first page view because we already fired it from DOM
            if ( !this._isFirstPage )
            {
                // Track analytics
                this.trackCurrentPage();
            }

            console.info('Router.updateCurrentRoute // Route', this._currentPath);

            // Convert URL to route and store it
            this._currentRouteMatch = this.URLToRoute( this._currentPath );

            // If our route is not found
            if (this._currentRouteMatch == null)
            {
                // Dispatch not found
                this._onNotFound.dispatch();
            }

            // Route is found
            else
            {
                // Dispatch and give route
                this._onRouteChanged.dispatch( this._currentRouteMatch );

                // Check if we have original route hidden
                if (this._currentRouteMatch._fromRoute != null)
                {
                    // Check if we have an handler
                    if (this._currentRouteMatch._fromRoute.handler != null)
                    {
                        // Call handler with route match
                        this._currentRouteMatch._fromRoute.handler( this._currentRouteMatch );
                    }
                }

                // Get stack from route match
                let stack = this.getStackByName( this._currentRouteMatch.stack );

                // Check if stack exists if this is not the main stack
                if (this._currentRouteMatch.stack != 'main' && stack == null)
                {
                    throw new Error(`Router.updateCurrentRoute // Stack ${this._currentRouteMatch.stack} is not registered.`);
                }

                // Get page importer from route declaration
                let currentRoutePageImporter = this._currentRouteMatch.importer;

                // If there is no page importer
                if (currentRoutePageImporter == null)
                {
                    // Check if we have one inside dynamic page importers
                    this._dynamicPageImporters.map( pageImporter =>
                    {
                        if (pageImporter.page == this._currentRouteMatch.page)
                        {
                            currentRoutePageImporter = pageImporter.importer;
                        }
                    });
                }

                // Show page on stack
                (stack != null) && stack.showPage(
                    this._currentRouteMatch.page,
                    currentRoutePageImporter,
                    this._currentRouteMatch.action,
                    this._currentRouteMatch.parameters
                );
            }
        }
    }


    // ------------------------------------------------------------------------- URL / ROUTE CONVERTING

    /**
     * Prepare URL to be compatible with router from several formats :
     * - With or without base
     * - With or without leading slash
     * - Relative or absolute link
     * - With or without protocol
     * @param pURL : URL to be prepared for router.
     * @returns {string} Prepared URL for router.
     */
    static prepareURL (pURL:string):string
    {
        // Detect if link is absolute
        let doubleSlashIndex = pURL.indexOf('//');
        if (doubleSlashIndex >= 0 && doubleSlashIndex < 7)
        {
            // Remove protocol and domain from URL
            let firstSlashIndex = pURL.indexOf('/', doubleSlashIndex + 2);
            pURL = pURL.substr(firstSlashIndex, pURL.length);
        }

        // Force leading slash on URL
        pURL = StringUtils.leading(pURL, true);

        // If our URL doesn't include base
        if (pURL.indexOf(this._base) != 0)
        {
            // Add base to URL
            pURL = this._base + StringUtils.leading(pURL, false);
        }

        // Return prepared URL
        return pURL;
    }

    /**
     * Convert an URL to a route match.
     * URL will be prepared to be compatible. @see Router.prepareURL
     */
    static URLToRoute (pURL:string):IRouteMatch
    {
        // Convert URL
        pURL = this.prepareURL( pURL );

        // Remove base and add leading slash
        let pathWithoutBase = StringUtils.leading(
            StringUtils.extractPathFromBase(pURL, this._base),
            true
        );

        // The found route to return
        let foundRoute:IRouteMatch;

        // Browse routes
        this._routes.every( (route) =>
        {
            // Exec route prepared regex with current path
            let routeExec = route._matchingRegex.exec( pathWithoutBase );

            // If route can be compatible
            if (routeExec != null)
            {
                // Remove url and other stuff from result to get only parameters values
                routeExec.shift();
                delete routeExec.input;
                delete routeExec.index;

                // Map params indexed array to named object
                let parameters:IActionParameters = {};
                for (let k in routeExec)
                {
                    parameters[route._matchingParameter[k]] = routeExec[k];
                }

                // Create route match object and configure it from route
                foundRoute = {
                    page		: route.page,
                    importer	: route.importer,
                    action		: route.action,
                    stack		: route.stack,
                    parameters	: parameters
                };

                // Hide from route to have access to handler
                foundRoute._fromRoute = route;

                // We found our route, do not continue
                return false;
            }

            // Not the good route, continue...
            else return true;
        });

        // Return found route
        return foundRoute;
    }

    /**
     * Convert a matching route to its triggering URL.
     * @param pRouteMatch Matching route to satisfy. Parameters will be slugified.
     * @param pPrependBase If we have to prepend base before generated URL. Default is true.
     * @returns {any} Can be null if route not found.
     */
    static generateURL (pRouteMatch:IRouteMatch, pPrependBase = true):string
    {
        // Default properties for route match
        // Default action to "index"
        if (pRouteMatch.action == null || pRouteMatch.action == '')
        {
            pRouteMatch.action = 'index';
        }

        // Default stack to "main"
        if (pRouteMatch.stack == null || pRouteMatch.stack == '')
        {
            pRouteMatch.stack = 'main';
        }

        // Default parameters to empty object
        if (pRouteMatch.parameters == null)
        {
            pRouteMatch.parameters = {};
        }

        // Returned found URL
        let foundURL:string;

        // Browse routes
        this._routes.every( (route) =>
        {
            // Check if this route is ok with this match
            if (
                route.page == pRouteMatch.page
                && route.action == pRouteMatch.action
                && route.stack == pRouteMatch.stack
            ) {
                // Check if given parameters exists in this route
                for (let i in pRouteMatch.parameters)
                {
                    if (route._matchingParameter.indexOf(i) === -1)
                        return true;
                }

                // And check if this route have a value for all needed parameters
                for (let i in route._matchingParameter)
                {
                    if (!(route._matchingParameter[i] in pRouteMatch.parameters))
                        return true;
                }

                // Replace parameters and slugify them
                foundURL = route.url.replace(
                    Router.PARAMETER_REPLACE_RULE, function (i, pMatch)
                    {
                        // Check if this is a numeric parameter
                        const numericParameter = (pMatch.charAt(0) == '#');

                        // Remove starting #
                        if (numericParameter)
                        {
                            pMatch = pMatch.substr(1, pMatch.length);
                        }

                        // Target matched param
                        let matchedParam = pRouteMatch.parameters[ pMatch ];

                        // Slugify it if this is a string only
                        return (
                            ( typeof matchedParam === 'number' )
                                ? matchedParam.toString( 10 )
                                : StringUtils.slugify( matchedParam as string )
                        );
                    }
                );

                // Search is finished
                return false;
            }

            // Continue searching
            else return true;
        });

        // Not found, return null
        if (foundURL == null) return null;

        // Return found URL
        return (
            pPrependBase
            ? this._base + StringUtils.leading(foundURL, false)
            : foundURL
        );
    }


    // ------------------------------------------------------------------------- CHANGE ROUTE

    /**
     * Open an URL with pushState or replaceState methods.
     * Will trigger popState event.
     * Only for application internal links.
     * URL will be prepared to be compatible. @see Router.prepareURL
     * @param pURL Link to open, from server base or absolute.
     * @param pAddToHistory If we have to add this link to users history (default is yes)
     * @param pForce Force update if URL is the same
     */
    static openURL (pURL:string, pAddToHistory = true, pForce = false)
    {
        // Prepare URL to be compatible
        pURL = this.prepareURL( pURL );

        // Prevent route changing if this is the same URL
        if (this._currentPath == pURL && !pForce) return;

        // In fake mode
        if (this._dryMode)
        {
            // Set fake URL
            this._currentPath = pURL;
        }
        else
        {
            // Change URL and add to history or replace
            pAddToHistory
            ? window.history.pushState(null, null, pURL)
            : window.history.replaceState(null, null, pURL);
        }

        // Update route
        this.updateCurrentRoute();
    }

    /**
     * Open a page with pushState or replaceState methods.
     * Will trigger popState event.
     * @param pRouteMatch Route to satisfy
     * @param pAddToHistory If we have to add this link to users history (default is yes)
     * @throws Error if route not found.
     */
    static openPage (pRouteMatch:IRouteMatch, pAddToHistory = true)
    {
        // Get URL from this route
        let url = this.generateURL( pRouteMatch );

        // Throw error if URL is not found for this route
        if (url == null)
        {
            // TODO : Doit-on déclancher une erreur / balancer un notFound / console.error / ignorer ?
            throw new Error(`Router.openPage // Route not found.`);
        }

        // Open URL
        this.openURL( url, pAddToHistory );
    }


    // ------------------------------------------------------------------------- ENGINE

    /**
     * Start route changes listening.
     */
    static start ()
    {
        this._isStarted = true;
        this.updateCurrentRoute();
    }

    /**
     * Stop router from listening route changes.
     */
    static stop ()
    {
        this._isStarted = false;
    }
}