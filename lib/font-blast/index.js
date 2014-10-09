"use strict";

var path      = require('path'),
    fs        = require('graceful-fs'),
    mkdir     = require('mkdirp'),
    svg2ttf   = require('svg2ttf'),
    extractor = require('./glyph-extractor')
    ;

function generateTestCase(svgFont, iconSet, withPng, toFolder) {
    var htmlContent = fs.readFileSync(path.join(__dirname, '..', 'verify.html'), 'utf-8');

    var ttf = svg2ttf(svgFont, {});
    fs.writeFileSync(path.join(toFolder, 'source-font.ttf'), new Buffer(ttf.buffer));

    var iconContent = [], cssRules = [];

    iconContent.push('<div class="row">' +
    '<div class="col header">&nbsp;</div>' +
    '<div class="col header">Font Icon</div>' +
    '<div class="col header">SVG Image</div>' +
    (withPng ? '<div class="col col-header">PNG Image</div>' : '') +
    '</div>');

    iconSet.forEach(function (iconInfo) {
        cssRules.push('.blast-' + iconInfo.code + ':before { content: "\\' + iconInfo.code + '"} ');
        iconContent.push('<div class="row">' +
        '<div class="col icon-ref">' + iconInfo.ref + '</div>' +
        '<div class="col"><i class="fa blast-' + iconInfo.code + '"></i></div>' +
        '<div class="col"><img class="svg-icon" src="svg/' + iconInfo.ref + '.svg"/></div>' +
        (withPng ? '<div class="col"><img class="png-icon" src="png/' + iconInfo.ref + '.png"/></div>' : '') +
        '</div>');
    });
    htmlContent = htmlContent.replace('{height}', 188);
    htmlContent = htmlContent.replace('{height}', 188);
    htmlContent = htmlContent.replace('{height}', 188);
    htmlContent = htmlContent.replace('{height}', 188);
    htmlContent = htmlContent.replace('{iconRules}', cssRules.join(''));
    htmlContent = htmlContent.replace('{iconContent}', iconContent.join(''));
    //generate html test file
    fs.writeFile(path.join(toFolder, 'verify.html'), htmlContent);
}


module.exports = function (fontFile, destinationFolder, userConfig) {

    var config = {};
    //merge-in configuration from the user
    if (typeof userConfig == 'object') {
        Object.keys(userConfig).forEach(function (userKey) {
            config[userKey] = userConfig[userKey];
        });
    }

    var svgFontContent = fs.readFileSync(fontFile, 'utf-8');

    extractor(svgFontContent, config.filenames, function (characterSvgs) {

        console.info("Found " + characterSvgs.length + " available icons in the font");
        console.info("Generating SVG content for each character...");


        var svgDir = path.resolve(process.cwd(), path.join(destinationFolder, 'svg')),
            pngDir = path.resolve(process.cwd(), path.join(destinationFolder, 'png'));

        if (!fs.existsSync(svgDir)) mkdir.sync(svgDir);

        var savedIcons = [];
        characterSvgs.forEach(function (char) {

            var filename = char.name ? char.name : char.code;
            //If a subset of icons set was requested, ignore any others that are not within the subset
            if (config.icons && config.icons.length &&
                config.icons.indexOf(char.code) == -1 &&
                config.icons.indexOf(filename) == -1) {
                return;
            }
            savedIcons.push(char);
            fs.writeFileSync(path.join(svgDir, filename + '.svg'), char.svg);
        });
        console.log("Saved " + characterSvgs.length + " files to " + svgDir);

        if (config.png && !isNaN(config.png)) {
            var generator = require('./png-generator');
            console.log("Generating png images - this may take a while...");
            generator(svgDir, pngDir, config.png);
        }

        generateTestCase(svgFontContent, savedIcons, config.png, destinationFolder);
    });
}