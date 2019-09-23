

let _prefix = '';
let _prefixSeparator = '/';
let _elementSeparator = '_';
let _modifierSeparator = '-';


export function configureClasses ( prefix:string, prefixSeparator = '/', elementSeparator = '_', modifierSeparator = '-' )
{
   _prefix = prefix;
   _prefixSeparator = prefixSeparator;
   _elementSeparator = elementSeparator;
   _modifierSeparator = modifierSeparator;
}


export function className ( block:string, element?:string, modifier?:string )
{
    return `${ _prefix ? _prefix + _prefixSeparator : '' }${ block }${ element ? _elementSeparator + element : '' }${ modifier ? _modifierSeparator + modifier : '' }`;
}

// TODO : Réfléchir à une API utile pour toute la gestion des class names