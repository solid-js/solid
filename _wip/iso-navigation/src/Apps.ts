import {ready} from "@solid-js/yadl";
import {render, ComponentChild} from 'preact';
const { isBrowser, isNode } = require('browser-or-node');

export class Apps
{
    protected static __registeredApps = [];

    static async register ( appName, appRoot:ComponentChild, domRoot = document.body )
    {
        this.__registeredApps[ appName ] = appRoot;

        if (!isBrowser || domRoot == null) return;

        await ready();

        render( appRoot, domRoot );
    }

    static getRoot ( appName:string )
    {
        return this.__registeredApps[ appName ];
    }
}