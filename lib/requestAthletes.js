'use strict';

var Promise = require('bluebird');
var Cesium = require('cesium');
var request = require('request');

var defined = Cesium.defined;

module.exports = requestAthletes;

var url = 'https://games.crossfit.com/competitions/api/v1/competitions/open/2017/leaderboards?competition=1&year={YEAR}&division={DIVISION}&scaled=0&sort=0&fittest=1&fittest1=0&occupation=0&page={PAGE}';

function requestAthletes(division, year, progress, athleteCallback) {
    var u = url.replace('{DIVISION}', division).replace('{YEAR}', year);
    var page = 0;
    var total;

    function makeRequest() {
        var count = 0;
        var options = {
            url: u.replace('{PAGE}', page + 1)
        };

        function _makeRequest(resolve, reject) {
            request(options, function (error, response, body) {
                if (!defined(error) && response.statusCode !== 200) {
                    error = 'Failed with code: ' + response.statusCode;
                }

                if (defined(error)) {
                    if (count < 5) {
                        ++count;
                        console.log('Failed (' + count + '): Retrying');
                        _makeRequest(resolve, reject);
                    } else {
                        reject(error);
                    }
                    return;
                }

                var info = JSON.parse(body);
                resolve(info);
            });
        };

        return new Promise(function (resolve, reject) {
            _makeRequest(resolve, reject);
        });
    }

    function loop() {
        return makeRequest()
            .then(function (info) {
                if (!defined(total)) {
                    total = info.totalpages;
                    progress.addPages(total);
                    progress.addRequest();
                }

                return Promise.map(info.athletes, athleteCallback);
            })
            .then(function () {
                ++page;
                progress.completePage();
                if (page < total) {
                    return loop();
                }
            });
    }

    return loop();
}
