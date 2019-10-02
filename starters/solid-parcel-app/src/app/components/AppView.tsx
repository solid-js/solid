import {h, Component} from 'preact';
import { useEffect, useMemo } from 'preact/hooks';
import {Router, ViewStack} from "@solid-js/navigation";





export const AppView = props => {

    return <div class="AppView">
        <header>
            <h3>Menu</h3>
            <a href={Router.generateURL({page: 'HomePage'})}>Home</a>
        </header>
        <ViewStack
            stackName="main"
            onNotFound={ () => console.log('stack page not found ') }
            onPageMounted={ () => console.log('page mounted') }
        />
    </div>
};

