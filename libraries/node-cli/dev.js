const { nicePrint, getCLIArguments, CLICommands, getProcessRoot } = require("./dist/_index")



/*
nicePrint(`
	{bold/red}Wrong usage
	{lite}Missing a parameter $param
	
		{bold}Usage{/} : {italic}npm run $bla $truc{/}
		{bold}Ex{/} : {italic}npm run bar baz{/} 
`)

nicePrint(`
	{B/R}Wrong usage
	{L}Missing a parameter $param
	
		{B}Usage{/} : {I}npm run $bla $truc{/}
		{B}Ex{/} : {I}npm run bar baz{/} 
`)*/


// CWD :
//console.log( getProcessRoot() );


const args = getCLIArguments();
console.log(args);


CLICommands.add(['main', 'dev'], {
	hot: false
}, (options) => {
	console.log('>', options);
})


CLICommands.start( (commandName) => {
	if (commandName !== '')
		console.log('Command not found');
});

