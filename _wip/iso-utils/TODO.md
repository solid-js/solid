# Frameworks - @solid-js/utils

- Pour node & browser
- Tous les utils solidify compatible node et browser
- Attention au tree shaking !
   - `export * from ...` devrait suffir, à tester.
- Features :
    - ArrayUtils
    - ColorUtils
    - MathUtils
    - ObjectUtils
    - StringUtils
        - Englober un mot autour d'une balise
        - Garder x mots et ajouter [...]
    - FunctionUtils
    - TimeUtils
            
            
            


------------------- Utils to Helpers

- Patcher LoaderUtils et faire un vrai système de loader dans le framework
    - Le transformer en LoaderHelper

- Supprimer EnvUtils et le convertir en EnvHelper dans la lib

------------------- ArrayUtils

ArrayUtils.find / ArrayUtils.count
- Trouver un utils qui permettrait de faire ça plus facilement :
    - Compter le nombre de block de type COLUMN :
		remainingColumnBlocks = this._rawBlockStream.reduce(
			(p, c) => (c.type == ECompositionType.COLUMN ? p + 1 : p),
			0
		)


ArrayUtils.indexOrFirst / ObjectUtils.indexOrFirst
- Trouver un petit utils qui permettrait d'éviter ça :
let linkHref = (
	GlobalConfig.instance.locale in linksByLocale
	? linksByLocale[ GlobalConfig.instance.locale ]
	: linksByLocale[ Object.keys(linksByLocale)[0] ]
);

------------------- IsUtils

Faire une lib orientée fonctionnel "is"
- is(x, [a, b, c])
- isBetween(x, -1, 1)
- isFunction
- isInstanceOf
- ...


------------------- StringUtils

- Des trucs pour tronquer (avec ... ou par ex ne garder que max 2 mots ...)

- Un bout de script pour faire des template string avec les tabs patchées :

- tabTemplate`
		test bla bla
	`

Attention, si c'est cette implémentation, ça ira plutôt dans web-utils

/**
 * Retourner le contenu texte d'un bloc HTML
 */
static textFromHTMLFilter (pHTMLContent:string):string
{
	// On passe par une div non rattachée au document
	const tempDivElement = document.createElement("div");

	// On lui injecte le contenu HTML
	tempDivElement.innerHTML = pHTMLContent;

	// Et on en récupère le texte, sans les balises
	return tempDivElement.textContent || tempDivElement.innerText || '';
}
