'use strict';

var regionStrings = ['Worldwide', 'Africa', 'Asia', 'Australia', 'Canada East', 'Canada West', 'Central East', 'Europe',
    'Latin America', 'Mid Atlantic', 'North Central', 'North East', 'Northern California',
    'North West', 'South Central', 'South East', 'Southern California', 'South West'];

var Region = {
    WORLDWIDE: 0,
    AFRICA: 1,
    ASIA: 2,
    AUSTRALIA: 3,
    CANADA_EAST: 4,
    CANADA_WEST: 5,
    CENTRAL_EAST: 6,
    EUROPE: 7,
    LATIN_AMERICA: 8,
    MID_ATLANTIC: 9,
    NORTH_CENTRAL: 10,
    NORTH_EAST: 11,
    NORTHERN_CALIFORNIA: 12,
    NORTH_WEST: 13,
    SOUTH_CENTRAL: 14,
    SOUTH_EAST: 15,
    SOUTHERN_CALIFORNIA: 16,
    SOUTH_WEST: 17
};

Region.toString = function (region) {
    if (region >= regionStrings) {
        throw 'Invalid Region';
    }

    return regionStrings[region];
};

Region.fromString = function (str) {
    var index = regionStrings.indexOf(str);
    if (index === -1) {
        throw 'Invalid Region: ' + str;
    }

    return index;
};

module.exports = Region;
