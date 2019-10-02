
exports.config = {
    // TODO : Dynamic selon dotenv
    publicUrl : './', // = base
    logLevel : 3,

    // TODO
    deploy: {
        'src/.htaccess' : true,
    },

    // TODO
    organize: {
        scripts: {
            match: "*.{js,js.map}",
            folder: "js/"
        },
        styles: {
            match: "*.{css,css.map}",
            folder: "css/"
        },
        assets: {
            match: "*",
            folder: "assets/"
        }
    }
};