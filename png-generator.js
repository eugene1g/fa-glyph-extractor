"use strict";

var path  = require('path'),
    spawn = require('child_process').spawn;

//rsvg
//batik
//GraphicsMagick
//ImageMagick

module.exports = function (sourceDir, targetDir, heights) {
    heights.forEach(function (size) {

        size = String(size).trim();
        var saveToDir = path(targetDir, size);
        //var ps = spawn('java', ['-jar', __dirname + '/batik-rasterizer.jar', "$@", '-d', targetDir, '-h', size, path.join(config.color, 'svg')]);
        //var ps = spawn('batik-rasterizer', ['-d', targetDir, '-h', size, path.join(folder, 'svg')]);
        var ps = spawn('batik-rasterizer', ['-d', saveToDir, '-h', size, sourceDir]);
        ps.stdout.on('data', function (data) {
            console.log(data.toString());
        });
        ps.stderr.on('data', function (data) {
            console.log(data.toString());
        });
    });
}