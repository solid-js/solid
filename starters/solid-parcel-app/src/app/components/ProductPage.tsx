

import { h, Component } from 'preact';
import { useEffect, useMemo } from 'preact/hooks';





export const ProductPage = props => {

    const product = {
        name: 'TUTU'
    };

    return <div>
        <h1>{product.name}</h1>
    </div>
};

