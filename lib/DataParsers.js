'use strict';

var Cesium = require('cesium');

var defined = Cesium.defined;

module.exports = {
    affiliate: parseInt,
    height: parseHeight,
    region: parseInt,
    weight: parseWeight
};

// Returns meters
function parseHeight(str) {
    if (!defined(str) || str.length === 0) {
        return 0;
    }

    var result = 0;
    if (str.indexOf('cm') !== -1) {
        // 123 cm
        result = parseInt(str) * 0.01;
    } else {
        // 5'3"
        var res = /^(\d+)\'(-?\d+)?\"?$/.exec(str);
        if (defined(res)) {
            var length = res.length;

            // Feet
            if (length > 1) {
                result += parseInt(res[1]) * 0.3048;
            }

            // Inches
            if (length > 2) {
                result += parseInt(res[1]) * 0.0254;
            }
        } else {
            console.log('Unparsable Height: "' + str + '"');
        }
    }

    return Math.max(result, 0);
}

// Returns kilograms
function parseWeight(str) {
    if (!defined(str) || str.length === 0) {
        return 0;
    }

    var result = 0;
    if (str.indexOf('kg') !== -1) {
        // 123 kg
        result = parseInt(str);
    } else if (str.indexOf('lb') !== -1) {
        // 123 lb
        result = parseInt(str) * 0.453592;
    }

    return result;
}
