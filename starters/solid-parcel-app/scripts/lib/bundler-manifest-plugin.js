/**
 * FORKED FROM
 * https://github.com/mugi-uno/parcel-plugin-bundle-manifest/blob/master/plugins/BundleManifestPlugin.js
 */


const path = require('path');
const fs = require('fs');

exports.connect = function (bundler) {

    /**
     * Read the paths already registered within the manifest.json
     * @param {string} path
     * @returns {Object}
     */
    const readManifestJson = (path) => {
        if (!fs.existsSync(path)) {
            return {};
        };


        try {
            return JSON.parse(fs.readFileSync(path, 'utf8'));
        } catch(e) {
            throw e;
        }
    };

    /**
     * Feed the manifest exploring childBundles recursively
     * @param {Bundle} bundle
     * @param {Object} manifestValue
     * @param {string} publicURL
     */
    const feedManifestValue = (bundle, manifestValue, publicURL) => {
        let output = path.join(publicURL, path.basename(bundle.name));

        if(isServiceWorkerFile(output)) {
            return;
        }

        const input =
            bundle.entryAsset ? bundle.entryAsset.relativeName :
                bundle.assets.size ? bundle.assets.values().next().value.relativeName :
                    null;
        if(input && !manifestValue[input]) {
            manifestValue[input] = output;
        }
        bundle.childBundles.forEach(function (bundle) {
            feedManifestValue(bundle, manifestValue, publicURL);
        });
    }

    bundler.on('bundled', (bundle) => {
        bundler.options.entryFiles.length > 1
            ? bundle.childBundles.forEach(entryPointHandler)
            : entryPointHandler(bundle);
    });

    function entryPointHandler(bundle) {
        const dir = bundler.options.outDir;
        const publicURL = bundler.options.publicURL;

        const manifestPath = path.resolve(dir, 'manifest.json');
        const manifestValue = {}

        feedManifestValue(bundle, manifestValue, publicURL);

        const oldManifestValue = readManifestJson(manifestPath);
        const combinedManifest = Object.assign(oldManifestValue, manifestValue)
        fs.writeFileSync(manifestPath, JSON.stringify(combinedManifest, null, 2));
    }
};

function isServiceWorkerFile(output) {
    const commonServiceWorkerFilenames = ["service-worker.js", "serviceWorker.js", "sw.js"];

    return commonServiceWorkerFilenames
        .some(serviceWorkerName => output.endsWith(serviceWorkerName))
}