
// Optional, set cwd for all next List, File and Directory commands
setFilesCWD( __dirname );

// ----------------------------------------------------------------------------- FIND API

// Find files, sync
const allTxtFiles:File[] = File.find('base/**/*.txt', globOptions)
const allTxtFilesPaths:string[] = File.list('base/**/*.txt', globOptions)

// List directories, sync
const allCacheFolders:Directory[] = Directory.find('base/**/.cache', globOptions)
const allCacheFoldersPaths:string[] = Directory.list('base/**/.cache', globOptions)

// ----------------------------------------------------------------------------- FILE ENTITY API

/** PROPS **/

// get loaded file stats
fileEntity.stats

// path from constructor
fileEntity.path

// base of file or directory (if path is "/directory/test/index.html", base is "/directory/test/")
fileEntity.base

// file name, without extensions
// if file is "/directory/index.html.twig", file name is "index"
fileEntity.name

// file is "index.html.twig"
fileEntity.fullName

// ["html", "twig"]
fileEntity.extensions:string[]

// last extension "twig"
fileEntity.extension:string

/** METHODS **/

// get file or directory last modified date
fileEntity.lastModfied()

// get file size or full directory size
fileEntity.size()

// will create file or directory, will also all parents needed
fileEntity.create()

// will create all parents needed for this non existinfile or folder
// TODO - méthode ensure() -> faire en sorte que ça marche pour folder et files (ça créé les parents et / ou le dernier dir)
fileEntity.ensure();

// if targeted file or directory exists
// TODO - exists qui marche
fileEntity.exists()

// check if targeted file or directory is not a symlink
fileEntity.isReal()

// update stats but not content (for file use load() to get back content from disk)
fileEntity.update();

// copy file or directory to (with safe to)
fileEntity.copyTo( path );

// move file or directory to (with safe to)
fileEntity.moveTo( path );
fileEntity.rename( path );

// create symlink to this file or directory
fileEntity.linkTo( path );

// delete file or directory recursively without warning
// fixme : check if file or folder is outside project's cwd ? and warn or halt
fileEntity.delete();
//fileEntity.remove(); // ?

FileEntity.fromStats( fileStats ); // returns a file or a directory

// ----------------------------------------------------------------------------- DIRECTORY API

const directory = new Directory();

const results:(File|Directory)[] = directory.children(showDotFiles); // uses FileEntity.fromStat

// ----------------------------------------------------------------------------- FILE API

// File is NOT loaded BUT is stated
const myTestFile = new File('base/test.txt', 'utf8')

// Get raw text content
myTestFile.raw() // "coucou"
myTestFile.raw( r => {
	// r == "coucou"
	return "salut" // file content is now "salut" but not saved
})
myTestFile.raw('salut') // same but without having access to previous value
myTestFile.raw() // "salut"

// Save memory content to disk
// If path is defined, will save to a new path, without overriding
myTestFile.save( path );

// Change content but discard data and reload from disk
// Will discard "change" and revert to "salut" from disk
myTestFile.raw('change')
myTestFile.load();

// This method reload content only, not stats
myTestFile.load();


myTestFile.append( content, newLine )


myTestFile.json();
myTestFile.json( r => r, spaces = 2, replacers = null );
myTestFile.json( r, spaces = 2, replacers = null );


myTestFile.yaml();
myTestFile.yaml( r => r );
myTestFile.yaml( r );

// - Faire des helpers pour remplacer des lignes
// - Faire des helpers pour chercher des lignes
myTestFile.lines(); // TODO FIXME

myTestFile.lines(); // get all lines as array

// Override each lines
myTestFile.lines( line => {
	// null deletes line !
	return line
});

myTestFile.lineSearch( '(\w*)start-(.*)(\w*)', (match, line, index) => {
	// match -> [
	//		"   ", 	// first \w+ trimmed spaces
	// 		"text",	// .* (ex is from line "	start-text	"
	//		"	", 	// last \w+, trimmed spaces
	// ]

	// null deletes line !
	return line
})


myTestFile.replace(); // FIXME

myTestFile.template(); // FIXME


myTestFile.dispose();

// TODO - Gérer les fichiers avec syntaxe .env
myTestFile.dotEnv();
myTestFile.dotEnv( r => r );
myTestFile.dotEnv( r );
