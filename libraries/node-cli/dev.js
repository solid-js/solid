const { nicePrint, getCLIArguments, CLICommands, getProcessRoot, askInput, askList, askMenu } = require("./dist/_index");
const { countStartingChars, untab } = require("../iso-core/dist/_index");


nicePrint(`
	{bold/red}Wrong usage
	{lite}Missing a parameter $param

		{bold}Usage{/} : {italic}npm run $bla $truc{/}
		{bold}Ex{/} : {italic}npm run bar baz{/}
`);

(function () {

	console.log( countStartingChars( `\n			test` ) );
	console.log( countStartingChars( `
		super
		génial
	` ) );
	const str = `
		{B/R}Wrong usage
		{L}Missing a parameter $param
		
			{B}Usage{/} : {I}npm run $bla $truc{/}
			{B}Ex{/} : {I}npm run bar baz{/}
	`
	const split = str.split("\n");

	console.log( (split[ split.length - 1 ]) );
	console.log( countStartingChars(split[ split.length - 1 ]) );

	nicePrint(`
		{B/R}Wrong usage
		{L}Missing a parameter $param

			{B}Usage{/} : {I}npm run $bla $truc{/}
			{B}Ex{/} : {I}npm run bar baz{/}
	`, {});

})();


// CWD :
//console.log( getProcessRoot() );

/*
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


*/


(async function () {
	/*
	const name = await askInput(`What's your name ?`, {
		notEmpty: true,
		argumentIndex: 1,
		shortcuts: ['n', 'name']
	})
	console.log( name );
*/
	/*
	let [index, value] = await askList('Which lib is better ?', {
		react: 'React',
		preact: 'Preact',
		_0: "---",
		vue: 'Vue',
		angular: 'Angular',
		_1: "---",
		other : 'other',
		long : 'Long Choice with big name'
	}, {
		argumentIndex: 1,
		defaultIndex: 'preact'
	})

	console.log('1 >', index, value);

	[index, value] = await askList('Which lib is better ? 2', [
		'Vue',
		'React',
		'---',
		'Preact',
		'Angular',
		'---',
		'other',
		'Long Choice with big name'
	], {
		defaultIndex: 2,
		shortcuts: ['lib']
	})

	console.log('2 >', index, value);

*/
	/*
	await askMenu('What kind of file to create ?', {}, [
		{
			title: 'page',
			handler: () => {

			}
		},
		'---'
	])*/
})();
