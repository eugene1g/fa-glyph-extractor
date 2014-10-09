"use strict";

var path  = require('path'),
    fs    = require('fs'),
    mkdir = require('mkdirp'),
    spawn = require('child_process').spawn;


var converterExec = 'batik-rasterizer';
//Currently converts svg with apache batik
//Add handlers for more processors, like rsvg or GraphicsMagick

//Add an option to trim images on output
//through GM or IM
//gm mogrify -trim *
//Perhaps trim SVGs as well? no need, they can be imported into any SVG tool already

//add an option to optimize PNGs
//add an option to generate sprits from PNGs or SVGs


function getRasterizerParams(resizerName, ops) {
    var params = [];

    if (resizerName == 'batik-rasterizer') {
        params = ['-d', ops.toDir, '-maxh', ops.maxHeight, ops.sourceDir];
    }

    return params;
}
module.exports = function (sourceDir, targetDir, heights) {

    heights.forEach(function (size) {

        size = String(size).trim();
        var saveToDir = heights.length == 1 ? targetDir : path.join(targetDir, size);

        if (!fs.existsSync(saveToDir)) mkdir.sync(saveToDir);


        var converterParams = getRasterizerParams(converterExec, {
            toDir:     saveToDir,
            maxHeight: size,
            sourceDir: sourceDir
        });

        var coverter = spawn(converterExec, converterParams);
        coverter.stdout.on('data', function (data) {
            //console.log(data.toString());
        });
        coverter.stderr.on('data', function (data) {
            //console.log(data.toString());
        });
    });
}