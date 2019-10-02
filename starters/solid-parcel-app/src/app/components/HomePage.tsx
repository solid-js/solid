import { h, Component } from 'preact';
import { useEffect, useMemo } from 'preact/hooks';
import {Router} from "@solid-js/navigation";
import {StringUtils} from "@solid-js/utils";


HomePage.prepare = async function ()
{
    return {
        title: 'Home page title',
        custom: {
            products: [
                'Gyro Noddle',
                'Space Dumper',
                'Hydro Dancer'
            ]
        }
    }
};

export function HomePage (props) {

    console.log( props.data );

    useMemo(() => {
        console.log('MEMOIZED')
    });

    useEffect(() => {
       console.log('HomePage effect A');
       return () => {
           console.log('HomePage effect B');
       }
    });

    return <div>
        <h1>Welcome on my Home Page !</h1>
        <p>Here are my products from app data</p>
        <ul>
            {props.data.custom.products.map( product =>
                <li>
                    <a href={Router.generateURL({
                        page: 'ProductPage',
                        parameters: { product }
                    })}>{ product }</a>
                </li>
            )}
        </ul>
    </div>
}