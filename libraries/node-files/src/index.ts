
export * from './Match';
export * from './File';
export * from './Folder';

// TODO

export let defaultTemplateMarkers = ['{{', '}}'];

export function setDefaultTemplateMarkers (open:string, close:string)
{
	defaultTemplateMarkers = [open, close];
}


// https://github.com/solid-js/files/issues/1
// https://github.com/solid-js/files/issues/2

// V1 : Async promise with option for sync mode

// V2 : table()
// V2 : setupRelativeDates() -> array of templates
// V2 : F$.setupHumanReadableSizes() -> template (small mustache) + array to name Bytes / KB / MB / GB / TB
// V2 : F$.setupVerbose() -> true / false / handler


// V3 : watch()
// V3 : streams / buffers


