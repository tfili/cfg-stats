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

    function loop() {
        return new Promise(function (resolve, reject) {
            var options = {
                url: u.replace('{PAGE}', page+1)
            };

            request(options, function (error, response, body) {
                if (error) {
                    reject(error);
                    return;
                }
                if (response.statusCode !== 200) {
                    reject('Failed with code: ' + response.statusCode);
                    return;
                }

                var info = JSON.parse(body);
                if (!defined(total)) {
                    total = info.totalpages;
                    progress.addPages(total);
                    progress.addRequest();
                }

                Promise.map(info.athletes, athleteCallback)
                    .then(resolve);
            }); // request
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
