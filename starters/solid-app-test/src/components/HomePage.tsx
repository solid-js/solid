

import { h, Component } from 'preact';
import { useEffect, useMemo } from 'preact/hooks';





export const HomePage = props => {

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
        <ul></ul>
    </div>
};

