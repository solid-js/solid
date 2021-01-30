// @ts-ignore










// Sync
import { File } from "./src/File";

const allTxtFiles:File[] = List('base/**/*.txt', {
	cwd: '../',
	type: 'file'|'directory'|'all',
	...globOptions
})

