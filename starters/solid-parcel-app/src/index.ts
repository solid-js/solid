

console.log('Typescript !');


//trucIntrouvable()


import { testDirect } from './direct';
testDirect();

import('./indirect').then( module =>
{
    module.testIndirect();
});