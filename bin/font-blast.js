#!/usr/bin/env node
"use strict";

var cliDefaults = require('../lib/defaultConfig'),
    fs          = require('graceful-fs'),
    npm         = require('../package.json');

//cliDefaults.height = cliDefaults.height.join(',');
//cliDefaults.icons = cliDefaults.icons.join('');


function csvToArray(val) {
    console.log(val);
    return val?val.split(','):[];
}

var program = require('commander');
program.
    version(npm.version).
    usage("[options] svg-font.svg outputDir").
    option('-i, --icons <icon-refs>', "Comma-separated list to limits icons to certain codes", csvToArray).
    option('-c, --color', "The default color for your icons").
    option('-p, --png <sizes>', "Include this to generate PNG files. Please note you will need to have an executable binary in your path for 'batik-rasterizer' or 'rsvg-convert'", csvToArray).
    parse(process.argv)
;

var svgFontFile = program.args[0], outputDir = program.args[1];
if (!svgFontFile || !outputDir) {
    program.help();
}

var config = {
    genPng: program.png,
    color:  program.color,
    icons:  program.icons
};
var svgContent = fs.readFileSync(svgFontFile);

require('../lib/index')(svgContent, outputDir, config);