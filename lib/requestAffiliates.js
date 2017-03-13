'use strict';

var Promise = require('bluebird');
var Cesium = require('cesium');
var os = require('os');
var request = require('request');
var DOMParser = require('xmldom').DOMParser;

var Region = require('../lib/Region');

var defined = Cesium.defined;
var numCPUs = os.cpus().length;

module.exports = requestAffiliates;

var parser = new DOMParser({
    locator: {},
    errorHandler: {
        warning: function (w) {
            //console.warn(w);
        },
        error: function (e) {
            throw e;
        },
        fatalError: function (e) {
            throw e;
        }
    }
});

function requestAffiliates(affiliateIds, affiliateCallback) {
    return Promise.map(affiliateIds, function (id) {
        return makeRequest(id)
            .then(function (doc) {
                return parseDocument(doc, id);
            })
            .then(function (affiliateObj) {
                return affiliateCallback(affiliateObj);
            });
    }, {concurrency: numCPUs});
}

function parseDocument(doc, id) {
    var divs = Array.prototype.slice.call(doc.getElementsByTagName('div'));
    var affiliatesDiv = divs.find(function (div) {
        return div.getAttribute('id') === 'affiliates';
    });
    if (defined(affiliatesDiv)) {
        var result = {
            id: id,
            name: '',
            country: '',
            region: '',
            phone: '',
            address1: '',
            address: '',
            city: '',
            state: '',
            postal: '',
            website: ''
        };

        result.name = affiliatesDiv.getElementsByTagName('h3')[0].textContent;

        var items = Array.prototype.slice.call(affiliatesDiv.getElementsByTagName('li'));
        items.forEach(function (item) {
            var divs = item.getElementsByTagName('div');
            if (divs.length === 1) {
                var val = divs[0].textContent.trim();
                result.country = val;
            } else if (divs.length > 1) {
                var key = divs[0].textContent.trim().toLowerCase();
                var val = divs[1].textContent.trim();
                if (key === "location") {
                    var s = val.split('\n');
                    var address1 = s[0].trim();
                    var address2 = defined(s[1]) ? s[1].trim() : '';
                    var address3 = defined(s[2]) ? s[2].trim() : '';

                    // If we only have 1 address line then check if its possibly a city, state, zip
                    if (address2.length === 0 && address1.indexOf(',') !== -1) {
                        s = address1;
                    } else if (address3.length === 0) {
                        result.address1 = address1;
                        s = address2;
                    } else {
                        result.address1 = address1;
                        result.address2 = address2;
                        s = address3;
                    }

                    if (defined(s)) {
                        s = s.replace(/,+/g, ','); // Remove repeat commas
                        s = s.split(',');
                        result.city = defined(s[0]) ? s[0].trim() : '';
                        result.state = defined(s[1]) ? s[1].trim() : '';
                        result.postal = defined(s[2]) ? s[2].trim() : '';
                    }
                } else if (defined(result[key])) {
                    result[key] = val;
                }
            }
        });

        result.region = Region.fromString(result.region);

        return Promise.resolve(result);
    }

    return Promise.reject('Unable to parse document');
}

function makeRequest(id) {
    var count = 0;
    var options = {
        url: 'https://games.crossfit.com/affiliate/' + id
    };

    function _makeRequest(resolve, reject) {
        request(options, function (error, response, body) {
            if (!defined(error) && response.statusCode !== 200) {
                error = 'Failed with code: ' + response.statusCode;
            }

            if (defined(error)) {
                if (count < 5) {
                    ++count;
                    _makeRequest(resolve, reject);
                } else {
                    reject(error);
                }
                return;
            }

            // Remove some things that break xmldom
            body = body.replace(/&(times|copy);/g, '');
            body = body.replace(/<head>(.|[\r\n])+<\/head>/m, '');
            resolve(parser.parseFromString(body, "text/xml"));
        });
    }

    return new Promise(function (resolve, reject) {
        _makeRequest(resolve, reject);
    });
}
