import {h, hydrate, render} from 'preact';
import {Apps, Router} from "@solid-js/navigation";
import {AppView} from "./components/AppView";
import {ready} from "@solid-js/yadl";


Router.init( process.env.BASE );
Router.addRoutes([
    {
        url: '/',
        page: 'HomePage',
        importer: () => import('./components/HomePage')
    },
    {
        url: '/produts/{product}.html',
        page: 'ProductPage',
        importer: () => import('./components/ProductPage')
    },
]);

const { isBrowser, isNode } = require('browser-or-node');

if (isBrowser)
{
    ready().then( () =>
    {
        if (window['isStatic'])
            hydrate( <AppView />, document.body );
        else
            render( <AppView />, document.body );

        Router.start();
    });
}
else if (isNode)
{
    console.log('IS NODE');
}
else
{
    console.log('????');
}

//Apps.register( 'main', <AppView /> );