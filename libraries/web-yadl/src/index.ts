/**
 *
 * http://youmightnotneedjquery.com/
 *
 *
 * Sélection
 * TEST -> $( selector:string )						Sélectionner un ou plusieurs éléments dans le document entier
 * TEST -> $( from|Element, selector )				Sélectionner un ou plusieurs éléments depuis un noeud DOM
 * TEST -> $( element|Element )						Convertir un élément en collection
 * TEST -> $( [Element, Element] )					Convertir plusieurs éléments en collection
 *
 * Collection -- FIXME : Sûr de ça ? peut-être que all suffit et ensuite on re $( el )
 * -> $.children as $[]							Passer le NodeList children en tant que tableau de $
 * -> $.eq as $									Target un element en tant que collection depuis la collection
 * -> $[0] as Element							Target un Element natif depuis la collection
 * -> $.length									Le nombre d'éléments dans la collection
 * -> $.all										Tous les éléments en array natif
 *
 * Evènements
 * -> $.ready()									Lorsque la DOM est prête
 * -> $.load()									Lorsque le document est chargé
 * -> $.on / $.off								Ajouter / Supprimer un évènement
 * -> $.trigger( event )						Dispatcher un évènement custom
 *
 * Récupération de la position uniformisée
 * -> $.viewportPosition() -> {top, left}		Récupérer la position relative au viewport
 * -> $.documentPosition() -> {top, left}		Récupérer la position relative au document
 * -> $.relativePosition() -> {top, left}		Récupérer la position relative au premier parent en position: relative|absolute
 *
 * Gestion de la display list
 * -> $.remove()								Supprimer un noeud de son parent
 * -> $.appendTo( $|Element, after?:$|Element )	Ajouter un Element ou une collection dans un autre element
 * -> $.parents( selector )						Cibler les parents répondant au sélecteur
 * -> $.parent()								Retourner une collection ciblant le parent						FIXME : Sûr de ça ?
 *
 *
 * Pas besoin :
 * -> $.classes -> A voir si besoin de polyfiller en lisant classes en string ou en utilisant le clasList ES6
 * -> $.classes.add / $.classes.has / $.classes.remove / $.classes.toggle
 * -> Read style (height with outer margin par ex) ?
 * -> Write style ?
 */

/**
 * UTILISATION
 *
```typescript

YADL.find( $container, '.Grid_element' ).first( e => {
	YADL.width( e );
	YADL.height( e );
	e.parent;
	YADL.findParent( e, '.FirstParent' ).first( parent => {

	});


});

```
*/


// TODO
type ContainerOrElementsOrSelector = string|Element|Element[];

type ElementHandler = ( handler:(element:Element) => any|void ) => any|void;

type FindReturnType = {
	[key:number] : Element
	first	: ElementHandler
	all		: ElementHandler
}

export module YADL
{

	export function find ( containerOrSelector:ContainerOrElementsOrSelector, selector:string ):FindReturnType
	{
		// Check if container is an array of element
		// Throw if we got incompatible arguments (like list of elements and selector)
		const containerIsArray = Array.isArray( containerOrSelector );
		if ( containerIsArray && selector != null )
			throw new Error(`YADL.$ // Cannot have multiple elements as container, and cannot have a selector when targeting multiple elements.`);

		// Target container as first argument and create elements list
		let container:Element|Document = containerOrSelector as Element;
		let list:Element[] = [];

		// Directly convert if we have a list of elements as arguments
		if ( containerIsArray )
		{
			list = containerOrSelector as Element[];
		}
		// Set container as document and get selector from arguments if there is no selector argument
		else if ( selector == null )
		{
			selector = containerOrSelector as string;
			container = document;
		}

		// Target selector from element container and convert NodeList to static list
		container.querySelectorAll( selector ).forEach( (node, i) => list[i] = node );

		// Return list of elements
		return {
			// Add all found elements as list
			...list,
			// Get first element through an handler
			first	: handler => handler( list[0] ),
			// Loop through all elements through an handler
			all		: handler => list.map( el => handler( el ) )
		};
	}

	// TODO : Trouver les parents qui correspondent à ce selector
	export function findParents ( element:Element, selector:string ) {} //:FindReturnType { }
	// TODO
	export function width ( element:Element ) { }
	export function height ( element:Element ) { }
	// TODO
	export function on ( element:Element ) { }
	export function off ( element:Element ) { }
	// TODO ? useful ?
	export function parent ( element:Element ) { }
	// TODO ? useful ?
	export function children ( element:Element ) { }
	// TODO ? useful ?
	export function getStyle ( element:Element ) {}
	export function getStyles ( element:Element ) { }
	// TODO ? useful ?
	export function classeNames () { }
}


