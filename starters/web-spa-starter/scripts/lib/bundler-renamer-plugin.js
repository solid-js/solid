const path = require('path');

const staticPath = 'static';
const md5 = require('parcel-bundler/lib/utils/md5');

function parseBundle ( bundle )
{
    //console.log('>', bundle.type, bundle.name);

    if ( bundle.type !== 'html' )
    {
        const name = bundle.name + '';
        const baseName = path.basename( name );
        const dirName = path.dirname( name );

        bundle.name = path.join(dirName, staticPath, baseName);

        //bundle.entryAsset


        //console.log(bundle.name);
        if (bundle.entryAsset)
        {
            bundle.entryAsset.generateBundleName = function ()
            {
                return 'static/' + md5(bundle.entryAsset.relativeName) + '.' + bundle.entryAsset.type;
            };

            console.log(bundle.entryAsset.name);
            console.log(bundle.entryAsset.generateBundleName())

        }
    }

    for (let depAsset of bundle.assets.values())
    {
        //console.log('->', depAsset.relativeName);
    }

    for (let subBundle of bundle.childBundles.values())
    {
        parseBundle( subBundle );
    }
}

exports.connect = function ( bundler )
{
    // FIXME
    //bundler.on('bundled', parseBundle);
};