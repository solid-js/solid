import { StringUtils } from "@solid-js/utils";
import {find, ready} from "@solid-js/yadl";

// TODO : Ajouter le test de l'autoplay : https://github.com/Modernizr/Modernizr/blob/master/feature-detects/video/autoplay.js
// TODO : A faire optionnel (ajouté avec un import depuis l'extérieur de ce fichier)
// TODO : Car la mini video embed dans le fichier pèse un minimum


/**
 * Detect latest IE 11 which can get false results by user agent sniffing.
 * What a joke.
 */
export const isRealIE = (
    !(window['ActiveXObject']) && "ActiveXObject" in window
);

/**
 * Listing of devices types available.
 * Just handheld or desktop, no mobile / phone / laptop because we manage this via mediaQueries.
 * If not found, will be desktop by default
 */
export enum EDeviceType
{
    HANDHELD,
    DESKTOP
}

/**
 * Available platforms.
 * Only the most common.
 */
export enum EPlatform
{
    IOS,
    ANDROID,
    WINDOWS,
    MAC,
    UNKNOWN
}

/**
 * Available browsers
 * Only the most common.
 */
export enum EBrowser
{
    CHROME,
    SAFARI,
    IE,
    EDGE,
    MOZILLA,
    OPERA,
    UNKNOWN
}
/**
 * Available browsers engines
 * Only the most common.
 */
export enum EBrowserEngine
{
    WEBKIT,
    TRIDENT,
    GECKO,
    UNKNOWN
}

/**
 * Interface for the environment capabilities
 */
export interface ICapabilities
{
    retina		:boolean;
    touch		:boolean;
    audio		:boolean;
    video		:boolean;
    pushState	:boolean;
    geolocation	:boolean;
    webGL		:boolean;
}

export class EnvHelper
{
    /**
     * If we need a detection
     */
    private static __NEED_DETECTION		:boolean			= true;

    /**
     * Client informations
     */
    private static __DEVICE_TYPE		:EDeviceType;
    private static __PLATFORM			:EPlatform;
    private static __BROWSER			:EBrowser;
    private static __BROWSER_ENGINE		:EBrowserEngine;
    private static __CAPABILITIES		:ICapabilities;

    /**
     * Init detection once and on demand.
     * Will collect all needed informations.
     */
    private static initDetection ():void
    {
        if (!EnvHelper.__NEED_DETECTION) return;

        // Get browser signature
        let browserSignature = navigator.userAgent.toLowerCase();

        // Detect device type and platform
        // !window['MSStream'] -> https://www.neowin.net/news/ie11-fakes-user-agent-to-fool-gmail-in-windows-phone-81-gdr1-update
        if (/ipad|iphone|ipod/gi.test(browserSignature) && !window['MSStream'])
        {
            EnvHelper.__DEVICE_TYPE = EDeviceType.HANDHELD;
            EnvHelper.__PLATFORM = EPlatform.IOS;
        }
        else if (/android/gi.test(browserSignature))
        {
            EnvHelper.__DEVICE_TYPE = EDeviceType.HANDHELD;
            EnvHelper.__PLATFORM = EPlatform.ANDROID;
        }
        else if (/mac/gi.test(browserSignature))
        {
            EnvHelper.__DEVICE_TYPE = EDeviceType.DESKTOP;
            EnvHelper.__PLATFORM = EPlatform.MAC;
        }
        else if (/windows phone/gi.test(browserSignature))
        {
            EnvHelper.__DEVICE_TYPE = EDeviceType.HANDHELD;
            EnvHelper.__PLATFORM = EPlatform.WINDOWS;
        }
        else if (/windows/gi.test(browserSignature))
        {
            EnvHelper.__DEVICE_TYPE = EDeviceType.DESKTOP;
            EnvHelper.__PLATFORM = EPlatform.WINDOWS;
        }
        else
        {
            EnvHelper.__DEVICE_TYPE = EDeviceType.DESKTOP;
            EnvHelper.__PLATFORM = EPlatform.UNKNOWN;
        }

        // Detect browser
        if (/edge/gi.test(browserSignature))
        {
            EnvHelper.__BROWSER = EBrowser.EDGE;
        }
        else if (/chrome/gi.test(browserSignature))
        {
            EnvHelper.__BROWSER = EBrowser.CHROME;
        }
        else if (/safari/gi.test(browserSignature))
        {
            EnvHelper.__BROWSER = EBrowser.SAFARI;
        }
        else if (/msie/gi.test(browserSignature) || ("ActiveXObject" in window))
        {
            EnvHelper.__BROWSER = EBrowser.IE;
        }
        else if (/mozilla/gi.test(browserSignature))
        {
            EnvHelper.__BROWSER = EBrowser.MOZILLA;
        }
        else if (/opera/gi.test(browserSignature))
        {
            EnvHelper.__BROWSER = EBrowser.OPERA;
        }
        else
        {
            EnvHelper.__BROWSER = EBrowser.UNKNOWN;
        }

        // Detect browser engine
        if (/webkit/gi.test(browserSignature))
        {
            EnvHelper.__BROWSER_ENGINE = EBrowserEngine.WEBKIT;
        }
        else if (/trident/gi.test(browserSignature))
        {
            EnvHelper.__BROWSER_ENGINE = EBrowserEngine.TRIDENT;
        }
        else if (/gecko/gi.test(browserSignature))
        {
            EnvHelper.__BROWSER_ENGINE = EBrowserEngine.GECKO;
        }
        else
        {
            EnvHelper.__BROWSER_ENGINE = EBrowserEngine.UNKNOWN;
        }

        // Detect client capabilities
        EnvHelper.__CAPABILITIES = {
            retina		:(("devicePixelRatio" in window) && window.devicePixelRatio >= 1.5),
            touch		:("ontouchstart" in document),
            audio		:("canPlayType" in document.createElement("audio")),
            video		:("canPlayType" in document.createElement("video")),
            pushState	:("history" in window && "pushState" in history),
            geolocation	:("geolocation" in navigator),
            webGL		:(EnvHelper.isWebglAvailable())
        };

        // Don't need detection anymore
        EnvHelper.__NEED_DETECTION = false;
    }

    /**
     * Detect WebGL capability
     */
    static isWebglAvailable ():boolean
    {
        try
        {
            const canvas = document.createElement("canvas");
            return !!(
                window["WebGLRenderingContext"] &&
                (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
            );
        }
        catch (e) { return false; }
    }

    /**
     * Check asynchronously if this device can play video with autoplay.
     * Will load a small empty video to test this.
     */
    static async hasVideoAutoPlay ()
    {
        const { hasVideoAutoplay } = await import('./EnvHelper_autoplay');
        return await hasVideoAutoplay();
    }

    /**
     * Get the device type following enum EDeviceType
     */
    static getDeviceType ():EDeviceType
    {
        EnvHelper.initDetection();
        return EnvHelper.__DEVICE_TYPE;
    }

    /**
     * Check if we run in a specific device type.
     * See enum EDeviceType
     */
    static isDeviceType (pDeviceType:EDeviceType):boolean
    {
        EnvHelper.initDetection();
        return EnvHelper.getDeviceType() == pDeviceType;
    }


    /**
     * Get the platform following enum EPlatform
     */
    static getPlatform ():EPlatform
    {
        EnvHelper.initDetection();
        return EnvHelper.__PLATFORM;
    }

    /**
     * Check if we run in a specific platform.
     * See enum EPlatform
     */
    static isPlatform (pPlatform:EPlatform):boolean
    {
        EnvHelper.initDetection();
        return EnvHelper.getPlatform() == pPlatform;
    }


    /**
     * Get the browser following enum EBrowser
     */
    static getBrowser ():EBrowser
    {
        EnvHelper.initDetection();
        return EnvHelper.__BROWSER;
    }

    /**
     * Get IE Version
     * Returns Number.POSITIVE_INFINITY if not IE, so you can test if version <= 9 for ex
     */
    static getIEVersion ():number
    {
        let myNav = navigator.userAgent.toLowerCase();
        return (myNav.indexOf('msie') != -1) ? parseInt(myNav.split('msie')[1], 10) : Number.POSITIVE_INFINITY;
    }

    /**
     * Get iOS Version
     * Returns Number.POSITIVE_INFINITY if not iOS, so you can test if version <= 9 for ex
     */
    static getIOSVersion ():number[]
    {
        EnvHelper.initDetection();

        if (EnvHelper.__PLATFORM == EPlatform.IOS)
        {
            // http://stackoverflow.com/questions/8348139/detect-ios-version-less-than-5-with-javascript/11129615#11129615
            let v = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
            if (v == null || v.length < 3) return [Number.POSITIVE_INFINITY];
            return [
                parseInt(v[1], 10),
                parseInt(v[2], 10),
                parseInt(v[3] || '0', 10)
            ];
        }
        else return [Number.POSITIVE_INFINITY];
    }

    /**
     * Check if we run in a specific browser.
     * See enum EBrowser
     */
    static isBrowser (pBrowser:EBrowser):boolean
    {
        EnvHelper.initDetection();
        return EnvHelper.getBrowser() == pBrowser;
    }

    /**
     * Get the browser engine following enum EBrowserEngine
     */
    static getBrowserEngine ():EBrowserEngine
    {
        EnvHelper.initDetection();
        return EnvHelper.__BROWSER_ENGINE;
    }

    /**
     * Check if we run in a specific browser engine.
     * See enum EBrowserEngine
     */
    static isBrowserEngine (pBrowserEngine:EBrowserEngine):boolean
    {
        EnvHelper.initDetection();
        return EnvHelper.getBrowserEngine() == pBrowserEngine;
    }


    /**
     * Get environment capabilities like retina / touch / geolocation ...
     * See class ICapabilities.
     */
    static getCapabilities ():ICapabilities
    {
        EnvHelper.initDetection();
        return EnvHelper.__CAPABILITIES;
    }

    /**
     * Log stuff about your environment
     */
    static log ():void
    {
        console.group('EnvHelper.log');
        console.log('deviceType', EnvHelper.getDeviceType());
        console.log('platform', EnvHelper.getPlatform());
        console.log('browser', EnvHelper.getBrowser());
        console.log('browserEngine', EnvHelper.getBrowserEngine());
        console.log('capabilities', EnvHelper.getCapabilities());
        console.groupEnd();
    }

    /**
     * Will add capabilities classes to DOM Element via selector.
     * Can add for ex :
     * is-chrome
     * is-webkit
     * is-windows
     * And also capabilities like :
     * has-video
     * has-geolocation
     */
    static async addClasses ( pToSelector:string = 'body' )
    {
        // Get env properties
        EnvHelper.initDetection();

        // Wait DOM to be ready
        await ready();

        // Convert to class names
        const classNames = [];
        const addIs = ( property ) => classNames.push( 'is-' + property );
        const addHas = ( feature ) => classNames.push( 'is-' + feature );

        // Add properties
        addIs( StringUtils.dashToCamelCase( EBrowser[EnvHelper.__BROWSER], '_' ) );
        addIs( StringUtils.dashToCamelCase( EBrowserEngine[EnvHelper.__BROWSER_ENGINE], '_' ) );
        addIs( StringUtils.dashToCamelCase( EDeviceType[EnvHelper.__DEVICE_TYPE], '_' ) );
        addIs( StringUtils.dashToCamelCase( EPlatform[EnvHelper.__PLATFORM], '_' ) );

        // Add capabilities
        for ( let i in EnvHelper.__CAPABILITIES )
        {
            EnvHelper.__CAPABILITIES[ i ] && addHas( i );
        }

        // Add env properties classes to element to find (default is body)
        find( pToSelector ).first().classList.add( ...classNames );
    }
}
