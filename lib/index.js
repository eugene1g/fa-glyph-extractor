"use strict";

var path           = require('path'),
    fs             = require('graceful-fs'),
    mkdir          = require('mkdirp'),
    extractor      = require('./glyph-extractor'),
    configTemplate = require('./defaultConfig'),
    config         = JSON.parse(JSON.stringify(configTemplate));


function generateTestCase(svgFont, iconSet, toFolder)
{
    fs.writeFileSync(path.join(toFolder, 'source-font.svg'), svgFont);

    var htmlContent = fs.readFileSync(__dirname + '/verify.html', 'utf-8');

    var iconContent = [], cssRules=[];

    iconSet.forEach(function(iconInfo){
        cssRules.push('.blast-'+iconInfo.code+':before { content: "\\'+iconInfo.code+'"} ');
        iconContent.push('<div><i class="fa blast-'+iconInfo.code+'"></i> <img class="svg-icon" src="svg/'+iconInfo.code+'.svg"/></div>');
    });
    htmlContent = htmlContent.replace('{iconRules}', cssRules.join(''));
    htmlContent = htmlContent.replace('{iconContent}', iconContent.join(''));
    //generate html test file
    fs.writeFile(path.join(toFolder, 'verify.html'), htmlContent);
}
module.exports = function (svgFontContent, destinationFolder, userConfig) {
    //merge-in configuration from the user
    if (typeof userConfig == 'object') {
        Object.keys(userConfig).forEach(function (userKey) {
            config[userKey] = userConfig[userKey];
        });
    }

    extractor(svgFontContent, config.filenames, function (characterSvgs) {

        console.info("Found " + characterSvgs.length + " available icons in the font");
        console.info("Generating SVG content for each character...");


        var svgDir = path.join(destinationFolder, 'svg');
        if (!fs.existsSync(svgDir)) mkdir.sync(svgDir);

        var savedIcons = [];
        characterSvgs.forEach(function (char) {

            var filename = char.name? char.name : char.code;
            //If a subset of icons set was requested, ignore any others that are not within the subset
            if (config.icons.length &&
                config.icons.indexOf(char.code) == -1 &&
                config.icons.indexOf(filename) == -1) {
                return;
            }
            savedIcons.push(char);
            fs.writeFileSync(path.join(svgDir, filename + '.svg'), char.svg);
        });
        console.log("Saved " + characterSvgs.length + " files to " + svgDir);

        if (config.genPng.length) {
            var generator = require('./png-generator'),
                pngDir = path.join(destinationFolder, 'png');
            console.log("Generating png images - this may take a while...");
            generator(svgDir, pngDir, config.genPng);
        }

        generateTestCase(svgFontContent, savedIcons, destinationFolder);
    });
}