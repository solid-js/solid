
// Install node modules if needed
if ( !require('fs').existsSync('node_modules') )
{
    console.log(' 🕓  Installing node modules ...');
    require('child_process').execSync('npm install', {
        stdio: [null, null, 2]
    });
}