import { h } from 'preact';
import { useEffect, useMemo } from 'preact/hooks';
export var HomePage = function (props) {
    useMemo(function () {
        console.log('MEMOIZED');
    });
    useEffect(function () {
        console.log('HomePage effect A');
        return function () {
            console.log('HomePage effect B');
        };
    });
    return h("div", null,
        h("h1", null, "Welcome on my Home Page !"),
        h("p", null, "Here are my products from app data"),
        h("ul", null));
};
