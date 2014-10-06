"use strict";

var path         = require('path'),
    fs           = require('graceful-fs'),
    mkdir        = require('mkdirp'),
    extractor    = require('./glyph-extractor'),
    pngGenerator = require('./png-generator'),
    config       = require('./defaultConfig');

//var sourceDir = path.join(folder, 'svg'),
//    targetDir = path.join(folder, 'png');
//ensureDir(sourceDir);
//ensureDir(targetDir);
//pngGenerator(sourceDir, targetDir, config.height);


function ensureDir(fullPath) {
    if (!fs.existsSync(fullPath)) mkdir.sync(fullPath);
}


module.exports = function (destinationFolder, svgFontContent, userConfig) {
    var svgDir = path.join(destinationFolder, 'svg');
    ensureDir(svgDir);
    //merge-in configuration from the user
    if (typeof userConfig == 'object') {
        Object.keys(userConfig).forEach(function (userKey) {
            config[userKey] = userConfig[userKey];
        });
    }

    extractor(svgFontContent, function (characterSvgs) {

        console.info("Found " + characterSvgs.length + " available icons in the font");
        console.info("Generating SVG content for each character...");

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
    });
}