'use strict';

var Cesium = require('cesium');

var Sex = require('./Sex');

var freezeObject = Cesium.freezeObject;

var Division = {
    MEN : 1,
    WOMEN : 2,
    BOYS_14_15 : 14,
    GIRLS_14_15 : 15,
    BOYS_16_17 : 16,
    GIRLS_16_17 : 17,
    MEN_35_39 : 18,
    WOMEN_35_39 : 19,
    MEN_40_44 : 12,
    WOMEN_40_44 : 13,
    MEN_45_49 : 3,
    WOMEN_45_49 : 4,
    MEN_50_54 : 5,
    WOMEN_50_54 : 6,
    MEN_55_59 : 7,
    WOMEN_55_59 : 8,
    MEN_60 : 9,
    WOMEN_60 : 10,
    TEAM : 11
};

Division.toSex = function(division) {
    if (division === Division.MEN ||
        division === Division.BOYS_14_15 ||
        division === Division.BOYS_16_17 ||
        division === Division.MEN_35_39 ||
        division === Division.MEN_40_44 ||
        division === Division.MEN_45_49 ||
        division === Division.MEN_50_54 ||
        division === Division.MEN_55_59 ||
        division === Division.MEN_60) {
        return Sex.MALE;
    }

    if (division === Division.WOMEN ||
        division === Division.GIRLS_14_15 ||
        division === Division.GIRLS_16_17 ||
        division === Division.WOMEN_35_39 ||
        division === Division.WOMEN_40_44 ||
        division === Division.WOMEN_45_49 ||
        division === Division.WOMEN_50_54 ||
        division === Division.WOMEN_55_59 ||
        division === Division.WOMEN_60) {
        return Sex.FEMALE;
    }

    throw 'Invalid Division';
};

module.exports = freezeObject(Division);
