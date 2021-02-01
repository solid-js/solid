# Files

Every method is Synchronous. I tried an all Async paradigm but API were too complicated.
The goal of this package is to simplify and make file operations **readable** and **easy**.
It is mainly used in Node scripts for CI / CD, so blocking script is not an issue.
If you really need Async for heavy file operations, consider running your file operations in another thread.

## Config
```typescript

// Optional, set cwd for all next List, File and Directory commands
setFilesCWD( __dirname );

```

## Find API
```typescript
// Find files, sync
const allTxtFiles:File[] = File.find('base/**/*.txt', globOptions)
const allTxtFilesPaths:string[] = File.list('base/**/*.txt', globOptions)

// List directories, sync
const allCacheFolders:Directory[] = Directory.find('base/**/.cache', globOptions)
const allCacheFoldersPaths:string[] = Directory.list('base/**/.cache', globOptions)
```

## File entity API

### File Entity Props
```typescript
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

// returns reversed extensions in an array
// ["twig", "html"]
fileEntity.extensions

// main extension "twig"
fileEntity.extension
```

### File Entity Methods
```typescript
/** METHODS **/

fileEntity.lastModified();
fileEntity.lastModifiedAsync();

// will create all parents needed for this non existinfile or folder
fileEntity.ensure();

// if targeted file or directory exists
fileEntity.exists()

// check if targeted file or directory is not a symlink
fileEntity.isReal()
fileEntity.isSymbolicLink()

// update stats but not content (for file use load() to get back content from disk)
fileEntity.update();

// copy file or directory to (with safe to)
// Async onlt
fileEntity.copyToAsync( path );

// move file or directory to (with safe to)
// Async onlt
fileEntity.moveToAsync( path );
fileEntity.renameAsync( path );

// create symlink to this file or directory
fileEntity.linkTo( path );

// delete file or directory recursively without warning
// fixme : check if file or folder is outside project's cwd ? and warn or halt
fileEntity.delete();
fileEntity.remove();
```

## Directory API
```typescript

// will create file or directory, will also create all parents needed (@see ensure())
fileEntity.create()

// get file size or full directory size
// Async only
fileEntity.sizeAsync()

// Create a new directory object, with existing or not existing path
const directory = new Directory('path/to/directory');

// Get all directory children
// Throws error if directory does not exists
// uses FileEntity.fromStat
const results:(File|Directory)[] = directory.children(showDotFiles);

// Clean, remove all children
directory.clean();
```

## File API
```typescript
// File is NOT loaded, stated if stats from arguments
const myTestFile = new File('base/test.txt', stats)

// Set file encoding, used to read and write file
myTestFile.encoding = 'utf8'

// This method reload content only, not stats
myTestFile.load();
myTestFile.loadasync();

myTestFile.size();
myTestFile.sizeAsync();

// Create empty file
myTestFile.create( force );

// Save memory content to disk
// If path is defined, will save to a new path, without overriding
myTestFile.save( newPath );
myTestFile.saveAsync( newPath );

// Get raw text content
myTestFile.content() // "coucou"
myTestFile.content( r => {
	// r == "coucou"
	return "salut" // file content is now "salut" but not saved
})
myTestFile.content('salut') // same but without having access to previous value
myTestFile.content() // "salut"

// Change content but discard data and reload from disk
// Will discard "change" and revert to "salut" from disk
myTestFile.content('change')
myTestFile.load();

// Append content to end of file
myTestFile.append( content, newLine = "\n\r")

// Read / write JSON
myTestFile.json();
myTestFile.json( r => r, spaces = 2, replacers = null );
myTestFile.json( r, spaces = 2, replacers = null );

// Read / write YAML
myTestFile.yaml();
myTestFile.yaml( r => r );
myTestFile.yaml( r );

// Read / write dot env 
myTestFile.dotEnv();
myTestFile.dotEnv( r => r );
myTestFile.dotEnv( r );

// Replace content hardly with a regex
myTestFile.replace();

// Template content with Nanostache
myTestFile.template(); // FIXME

// Destruct object
myTestFile.dispose();



// TODO : Implement
// - Faire des helpers pour remplacer des lignes
// - Faire des helpers pour chercher des lignes
myTestFile.lines();

// TODO : Implement
// Override each lines
myTestFile.lines( line => {
	// null deletes line !
	return line
});

// TODO : Implement
myTestFile.lineSearch( '(\w*)start-(.*)(\w*)', (match, line, index) => {
	// match -> [
	//		"   ", 	// first \w+ trimmed spaces
	// 		"text",	// .* (ex is from line "	start-text	"
	//		"	", 	// last \w+, trimmed spaces
	// ]

	// null deletes line !
	return line
})
```