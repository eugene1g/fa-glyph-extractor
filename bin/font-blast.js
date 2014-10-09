#!/usr/bin/env node
"use strict";

var fs      = require('graceful-fs'),
    pckg    = require('../package.json'),
    program = require('commander');

program.
    version(pckg.version).
    usage("[options] svg-font.svg outputDir").
    option('-i, --icons <icon-refs>', "Limit the output to the selected icons. Icons can be provided with their unicode value or the full reference", function (val) {
        return val ? val.split(',') : [];
    }).
    option('-p, --png', "Include this to generate PNG files. Please note you will need to have an executable binary in your path for 'batik-rasterizer'").
    option('-c, --color', "Set the color of icons in the output (relevant mainly for PNG files)").
    parse(process.argv)
;

var svgFontFile = program.args[0], outputDir = program.args[1];
if (!svgFontFile || !outputDir) {
    program.help();
}

var config    = {
    icons: program.icons,
    png:   program.png,
    color: program.color
}, svgContent = fs.readFileSync(svgFontFile, 'utf8');

require('../lib/index')(svgContent, outputDir, config);