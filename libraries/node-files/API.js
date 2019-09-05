
/**
 * DONE
 */

// Parcourir des fichiers et dossiers avec glob
Match('**/*.png').all( fileEntity => ... );

// Parcourir des fichiers
Match('**/*.png').files( file => ... );

// Parcourir des fichiers
Match('**/*.png').folders( folder => ... );


Match('**/*.png').glob -> '**/*.png'
Match('**/*.png').update() -> ['path', 'other-file' ...];




FileEntity.exists
FileEntity.isDir
FileEntity.isFile
FileEntity.copy
FileEntity.move

FileEntity.lastModified(relativeToNow):number
FileEntity.size(humanReadable?:):number|string


Match.generateFileListHash (lastModifier:boolean, size:boolean)





// Cibler un fichier
File('my-file.txt')

// Lire le contenu d'un fichier
const fileContent = File('my-file.txt').content();

// Changer le contenu d'un fichier
File('my-file.txt').content('New content').write();

// Ajouter une ligne
File('my-file.txt').content(r => r + "\nNew content").write();
File('my-file.txt').append("New content").write();

// Ajouter une ligne et enregistrer dans un autre fichier
File('my-file.txt').content(r => r + "\nNew content").write('other-file.txt');

File('my-file.txt').replace('Before', 'After').write();

File('my-template.quickMustache').template({ base: '/' }).write('.htaccess');


// Lire le contenu d'un json
File('package.json').content()

// Changer le contenu d'un json
File('package.json').content(r => {
	r.name = 'New name';
}).write();

File('package.json').content({
	emptyJson: true
}).write();

File('fichier').content().template().replace().write();
