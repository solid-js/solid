import { h } from 'preact';
export var ProductPage = function (props) {
    var product = {
        name: 'TUTU'
    };
    return h("div", null,
        h("h1", null, product.name));
};
