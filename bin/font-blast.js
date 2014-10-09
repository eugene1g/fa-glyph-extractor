#!/usr/bin/env node
"use strict";

var cliDefaults = require('../lib/defaultConfig'),
    fs          = require('graceful-fs'),
    npm         = require('../package.json');

//cliDefaults.height = cliDefaults.height.join(',');
//cliDefaults.icons = cliDefaults.icons.join('');


var program = require('commander');
program.
    version(npm.version).
    usage("[options] svg-font.svg outputDir").
    option('-i, --icons <icon-refs>', "Comma-separated list to limits icons to certain codes", function csvToArray(val) {
        return val.split(',');
    }).
    option('-c, --color', "The default color for your icons").
    option('-p, --png', "Include this to generate PNG files. Please note you will need to have an executable binary in your path for 'batik-rasterizer' or 'rsvg-convert'").
    parse(process.argv)
;

var svgFontFile = program.args[0], outputDir = program.args[1];
if (!svgFontFile || !outputDir) {
    program.help();
}

//argv.height = argv.height.split(',').map(function (el) {
//    return el.trim();
//});


//if (!argv.icons) argv.icons = [];
//else argv.icons = argv.icons.split(',').map(function (el) {
//    return el.trim();
//});

var config = {};
var svgContent = fs.readFileSync(svgFontFile);

require('../lib/index')(svgContent, outputDir, config);