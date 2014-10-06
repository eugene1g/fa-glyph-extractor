"use strict";

var svgo = new (require('svgo'));

/**
 * Callback recieves an array of characters with the format of
 * {
 * code: 'unicode ref',
 * svg:  'full svg content required to render'
 * path: 'just the path from the svg content'
 * }
 *
 * @param fontSvgDefinition SVG font definition containing all characters
 * @param callback
 */
function extractCharsFromFont(fontSvgDefinition, callback) {
    var fontGlyphs = fontSvgDefinition.match(/<glyph.*?d=.{10,}?>/g), //filter for glyphs where some paths are specified
        defaultCharWidth = fontSvgDefinition.match(/<font .*?horiz-adv-x="(\d+)"/)[1],
        defaultCharHeight = fontSvgDefinition.match(/<font-face .*?units-per-em="(\d+)"/)[1],
        defaultCharAscent = fontSvgDefinition.match(/<font-face .*?ascent="(\d+)"/)[1],
        iconSvg = [];

    fontGlyphs.forEach(function (glyph) {
        var iconCode = glyph.match(/unicode="(.*?);?"/)[1].replace("&#x", ""), //catch all references by replace unicode prefix
            pathData = glyph.match(/d="(.+?)"/)[1],
            customWidthMatch = glyph.match(/horiz-adv-x="(.*?)"/),
            contentWidth = customWidthMatch ? customWidthMatch[1] : defaultCharWidth;

        iconSvg.push({
            code: iconCode,
            path: pathData,
            svg: '<svg xmlns="http://www.w3.org/2000/svg" ' +
                 'viewBox="0 0 ' + contentWidth + ' ' + defaultCharHeight + '">' +
                 '<g transform="scale(1,-1) translate(0 -' + (defaultCharHeight) + ')">' +
                 '<path d="' + pathData + '"/>' +
            '</g></svg>'
        });
    });

    callback(iconSvg);
    return;

    var optimizedCount = 0;
    iconSvg.forEach(function (ic, idx) {
        svgo.optimize(ic.svg, function (result) {

            //override SVG and path details with the clean result
            iconSvg[idx].svg = result.data;
            iconSvg[idx].path = result.data.match(/path="(.*?)"/)[1];

            if (++optimizedCount == iconSvg.length) {
                callback(iconSvg);
            }
        });
    });
}
module.exports = extractCharsFromFont;