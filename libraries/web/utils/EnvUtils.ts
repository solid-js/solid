// TODO : Ajouter le test de l'autoplay : https://github.com/Modernizr/Modernizr/blob/master/feature-detects/video/autoplay.js
// TODO : A faire optionnel (ajouté avec un import depuis l'extérieur de ce fichier)
// TODO : Car la mini video embed dans le fichier pèse un minimum

import {StringUtils} from "../../core/utils/StringUtils";

// Si on est sur le vrai IE 11, et non pas la détection user agent qui ne marche plus ...
export const isRealIE11 = (
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

export class EnvUtils
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
        if (!EnvUtils.__NEED_DETECTION) return;

        // Get browser signature
        let browserSignature = navigator.userAgent.toLowerCase();

        // Detect device type and platform
        // !window['MSStream'] -> https://www.neowin.net/news/ie11-fakes-user-agent-to-fool-gmail-in-windows-phone-81-gdr1-update
        if (/ipad|iphone|ipod/gi.test(browserSignature) && !window['MSStream'])
        {
            EnvUtils.__DEVICE_TYPE = EDeviceType.HANDHELD;
            EnvUtils.__PLATFORM = EPlatform.IOS;
        }
        else if (/android/gi.test(browserSignature))
        {
            EnvUtils.__DEVICE_TYPE = EDeviceType.HANDHELD;
            EnvUtils.__PLATFORM = EPlatform.ANDROID;
        }
        else if (/mac/gi.test(browserSignature))
        {
            EnvUtils.__DEVICE_TYPE = EDeviceType.DESKTOP;
            EnvUtils.__PLATFORM = EPlatform.MAC;
        }
        else if (/windows phone/gi.test(browserSignature))
        {
            EnvUtils.__DEVICE_TYPE = EDeviceType.HANDHELD;
            EnvUtils.__PLATFORM = EPlatform.WINDOWS;
        }
        else if (/windows/gi.test(browserSignature))
        {
            EnvUtils.__DEVICE_TYPE = EDeviceType.DESKTOP;
            EnvUtils.__PLATFORM = EPlatform.WINDOWS;
        }
        else
        {
            EnvUtils.__DEVICE_TYPE = EDeviceType.DESKTOP;
            EnvUtils.__PLATFORM = EPlatform.UNKNOWN;
        }

        // Detect browser
        if (/edge/gi.test(browserSignature))
        {
            EnvUtils.__BROWSER = EBrowser.EDGE;
        }
        else if (/chrome/gi.test(browserSignature))
        {
            EnvUtils.__BROWSER = EBrowser.CHROME;
        }
        else if (/safari/gi.test(browserSignature))
        {
            EnvUtils.__BROWSER = EBrowser.SAFARI;
        }
        else if (/msie/gi.test(browserSignature) || ("ActiveXObject" in window))
        {
            EnvUtils.__BROWSER = EBrowser.IE;
        }
        else if (/mozilla/gi.test(browserSignature))
        {
            EnvUtils.__BROWSER = EBrowser.MOZILLA;
        }
        else if (/opera/gi.test(browserSignature))
        {
            EnvUtils.__BROWSER = EBrowser.OPERA;
        }
        else
        {
            EnvUtils.__BROWSER = EBrowser.UNKNOWN;
        }

        // Detect browser engine
        if (/webkit/gi.test(browserSignature))
        {
            EnvUtils.__BROWSER_ENGINE = EBrowserEngine.WEBKIT;
        }
        else if (/trident/gi.test(browserSignature))
        {
            EnvUtils.__BROWSER_ENGINE = EBrowserEngine.TRIDENT;
        }
        else if (/gecko/gi.test(browserSignature))
        {
            EnvUtils.__BROWSER_ENGINE = EBrowserEngine.GECKO;
        }
        else
        {
            EnvUtils.__BROWSER_ENGINE = EBrowserEngine.UNKNOWN;
        }

        // Detect client capabilities
        EnvUtils.__CAPABILITIES = {
            retina		:(("devicePixelRatio" in window) && window.devicePixelRatio >= 1.5),
            touch		:("ontouchstart" in document),
            audio		:("canPlayType" in document.createElement("audio")),
            video		:("canPlayType" in document.createElement("video")),
            pushState	:("history" in window && "pushState" in history),
            geolocation	:("geolocation" in navigator),
            webGL		:(EnvUtils.isWebglAvailable())
        };

        // Don't need detection anymore
        EnvUtils.__NEED_DETECTION = false;
    }

    /**
     * Detect WebGL capability
     */
    static isWebglAvailable ():boolean
    {
        try
        {
            let canvas = document.createElement("canvas");
            return !!(
                window["WebGLRenderingContext"] &&
                (canvas.getContext("webgl") ||
                    canvas.getContext("experimental-webgl"))
            );
        }
        catch(e)
        {
            return false;
        }
    }


    /**
     * Get the device type following enum EDeviceType
     */
    static getDeviceType ():EDeviceType
    {
        EnvUtils.initDetection();
        return EnvUtils.__DEVICE_TYPE;
    }

    /**
     * Check if we run in a specific device type.
     * See enum EDeviceType
     */
    static isDeviceType (pDeviceType:EDeviceType):boolean
    {
        EnvUtils.initDetection();
        return EnvUtils.getDeviceType() == pDeviceType;
    }


    /**
     * Get the platform following enum EPlatform
     */
    static getPlatform ():EPlatform
    {
        EnvUtils.initDetection();
        return EnvUtils.__PLATFORM;
    }

    /**
     * Check if we run in a specific platform.
     * See enum EPlatform
     */
    static isPlatform (pPlatform:EPlatform):boolean
    {
        EnvUtils.initDetection();
        return EnvUtils.getPlatform() == pPlatform;
    }


    /**
     * Get the browser following enum EBrowser
     */
    static getBrowser ():EBrowser
    {
        EnvUtils.initDetection();
        return EnvUtils.__BROWSER;
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
        EnvUtils.initDetection();

        if (EnvUtils.__PLATFORM == EPlatform.IOS)
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
        EnvUtils.initDetection();
        return EnvUtils.getBrowser() == pBrowser;
    }

    /**
     * Get the browser engine following enum EBrowserEngine
     */
    static getBrowserEngine ():EBrowserEngine
    {
        EnvUtils.initDetection();
        return EnvUtils.__BROWSER_ENGINE;
    }

    /**
     * Check if we run in a specific browser engine.
     * See enum EBrowserEngine
     */
    static isBrowserEngine (pBrowserEngine:EBrowserEngine):boolean
    {
        EnvUtils.initDetection();
        return EnvUtils.getBrowserEngine() == pBrowserEngine;
    }


    /**
     * Get environment capabilities like retina / touch / geolocation ...
     * See class ICapabilities.
     */
    static getCapabilities ():ICapabilities
    {
        EnvUtils.initDetection();
        return EnvUtils.__CAPABILITIES;
    }

    /**
     * Log stuff about your environment
     */
    static log ():void
    {
        console.group("EnvUtils.log");
        console.log("deviceType", EnvUtils.getDeviceType());
        console.log("platform", EnvUtils.getPlatform());
        console.log("browser", EnvUtils.getBrowser());
        console.log("browserEngine", EnvUtils.getBrowserEngine());
        console.log("capabilities", EnvUtils.getCapabilities());
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
    static addClasses (pToSelector:string = 'body', pPrefix = ''):void
    {
        // Get env properties
        EnvUtils.initDetection();

        // Wait DOM
        $( () =>
        {
            // Target selector
            let $domRoot = $(pToSelector);

            // Add env properties classes
            $domRoot.addClass(pPrefix + 'is-' + StringUtils.dashToCamelCase(EBrowser[EnvUtils.__BROWSER]				, '_'));
            $domRoot.addClass(pPrefix + 'is-' + StringUtils.dashToCamelCase(EBrowserEngine[EnvUtils.__BROWSER_ENGINE]	, '_'));
            $domRoot.addClass(pPrefix + 'is-' + StringUtils.dashToCamelCase(EDeviceType[EnvUtils.__DEVICE_TYPE]		, '_'));
            $domRoot.addClass(pPrefix + 'is-' + StringUtils.dashToCamelCase(EPlatform[EnvUtils.__PLATFORM]				, '_'));

            // Add capabilites
            for (let i in EnvUtils.__CAPABILITIES)
            {
                EnvUtils.__CAPABILITIES[i] && $domRoot.addClass(pPrefix + 'has-' + i);
            }
        });
    }
}
