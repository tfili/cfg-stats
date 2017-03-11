'use strict';

var Cesium = require('cesium');

var freezeObject = Cesium.freezeObject;

var Sex = {
    MALE : 1,
    FEMALE : 2
};

module.exports = freezeObject(Sex);
