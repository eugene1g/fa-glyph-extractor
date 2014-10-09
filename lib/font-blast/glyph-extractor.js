"use strict";

var svgo = new (require('svgo')), xml2js = require('xml2js');

/**
 * Callback recieves an array of characters with the format of
 * {
 * code: 'unicode',
 * name: 'special name, if provided',
 * ref: name or code
 * svg:  'full svg content required to render'
 * path: 'just the path from the svg content'
 * }
 *
 * @param fontSvgText SVG font definition containing all characters
 * @param charNameMap
 * @param callback
 */
function extractCharsFromFont(fontSvgText, charNameMap, callback) {

    var parser = new xml2js.Parser(),
        charMap = charNameMap || {};
    parser.parseString(fontSvgText, function (err, result) {
        var fontSpec = result.svg.defs[0].font[0],
            defaultCharWidth = fontSpec['$']['horiz-adv-x'],
            fontFace = fontSpec['font-face'][0]['$'],
            defaultCharHeight = fontFace['units-per-em'],
            defaultCharAscent = fontFace['ascent'],

            //"square" fonts tend to be based at the center (like glyphicon)
            //white other fonts tend to be based around the charAscent mark
            //so wen need to flip them with different adjustments
            translateOffset = defaultCharAscent,//(defaultCharWidth == defaultCharHeight ? defaultCharHeight : defaultCharAscent),
            iconSvg = [];

        console.log(defaultCharWidth,defaultCharHeight,defaultCharAscent);

        fontSpec.glyph.forEach(function (glyph) {
            //some strange fonts put empty glyphs in them
            if (!glyph) return;
            var iconCode = glyph['$']['unicode'],
                pathData = glyph['$']['d'],
                customWidthMatch = glyph['$']['horiz-adv-x'],
                contentWidth = customWidthMatch? customWidthMatch : defaultCharWidth;

            //some glyphs matched without a unicode value so we should ignore them
            if(!iconCode) return;

            if (iconCode.indexOf('&#') != -1) {
                iconCode = iconCode.replace("&#x", "");
            }

            if (iconCode.length == 1) {
                iconCode = iconCode.charCodeAt(0).toString(16);
            }

            //Skip empty-looking glyphs
            if (!iconCode.length || !pathData || pathData.length < 10) return;

            iconSvg.push({
                code: iconCode,
                name: charMap[iconCode],
                ref: charMap[iconCode]?charMap[iconCode]:iconCode,
                path: pathData,
                svg: '<svg xmlns="http://www.w3.org/2000/svg" ' +
                     'viewBox="0 0 ' + contentWidth + ' ' + defaultCharHeight + '">' +
                     '<g transform="scale(1,-1) translate(0 -' + (translateOffset) + ')">' +
                     '<path d="' + pathData + '"/>' +
                '</g></svg>'
            });
        });

        //Optimize all SVG to remove viewBox and compress the data path
        var optimizedCount = 0;
        iconSvg.forEach(function (ic, idx) {
            svgo.optimize(ic.svg, function (result) {

                //override SVG and path details with the clean result
                iconSvg[idx].svg = result.data;
                iconSvg[idx].path = result.data.match(/d="(.*?)"/)[1];

                if (++optimizedCount == iconSvg.length) {
                    callback(iconSvg);
                }
            });
        });
    });
}
module.exports = extractCharsFromFont;