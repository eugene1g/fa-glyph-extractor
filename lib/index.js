"use strict";

var path           = require('path'),
    fs             = require('graceful-fs'),
    mkdir          = require('mkdirp'),
    extractor      = require('./glyph-extractor'),
    configTemplate = require('./defaultConfig'),
    config         = JSON.parse(JSON.stringify(configTemplate));


module.exports = function (destinationFolder, svgFontContent, userConfig) {
    //merge-in configuration from the user
    if (typeof userConfig == 'object') {
        Object.keys(userConfig).forEach(function (userKey) {
            config[userKey] = userConfig[userKey];
        });
    }

    extractor(svgFontContent, function (characterSvgs) {

        console.info("Found " + characterSvgs.length + " available icons in the font");
        console.info("Generating SVG content for each character...");

        var svgDir = path.join(destinationFolder, 'svg');
        if (!fs.existsSync(svgDir)) mkdir.sync(svgDir);

        characterSvgs.forEach(function (char) {

            var filename = char.code;
            if (config.filenames[char.code]) {
                filename = config.filenames[char.code];
            }

            //If a specific set was requested, ignore anything not within that set
            if (config.icons.length &&
                config.icons.indexOf(char.code) == -1 &&
                config.icons.indexOf(filename) == -1) {
                return;
            }

            fs.writeFileSync(path.join(svgDir, filename + '.svg'), char.svg);
        });
        console.log("Saved " + characterSvgs.length + " SVG files");

        //return;
        if (config.genPng.length) {
            var generator = require('./png-generator');
            console.log("Generating png images - this may take a while...");
            generator(svgDir, destinationFolder, config.genPng);
        }
    });
}