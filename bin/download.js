#!/usr/bin/env node
'use strict';

var Promise = require('bluebird');
var Cesium = require('cesium');
var fs = require('fs-extra');
var path = require('path');
var request = require('request');
var yargs = require('yargs');

var Database = require('../lib/Database');
var Division = require('../lib/Division');

var defined = Cesium.defined;

var argv = yargs
    .usage('download.js [OPTIONS]')
    .example('download.js --output stats.db --year 2017')
    .help('help')
    .alias('help', 'h')
    .options({
        output: {
            alias: 'o',
            description: 'Path to output file',
            default: 'stats.db',
            normalize: true,
            type: 'string'
        },
        year: {
            alias: 'y',
            description: 'Year to query',
            default: 2017,
            type: 'string'
        },
    })
    .argv;

// var REGION_STRINGS = ['Worldwide', 'Africa', 'Asia', 'Australia', 'Canada East', 'Canada West', 'Central East', 'Europe',
//                         'Latin America', 'Mid Atlantic', 'North Central', 'North East', 'Northern California',
//                         'North West', 'South Central', 'South East', 'Southern California', 'South West'];

var url = 'https://games.crossfit.com/competitions/api/v1/competitions/open/2017/leaderboards?competition=1&year={YEAR}&division={DIVISION}&scaled=0&sort=0&fittest=1&fittest1=0&occupation=0&page={PAGE}';
var year = argv.year;

var dbPath = argv.output;
fs.ensureDirSync(path.dirname(dbPath));

var database = new Database(dbPath, year);

database.readyPromise
    .then(function () {
        return database.begin();
    })
    .then(function () {
        var overallTotal = 0;
        var overallPage = 0;

        // MEN/WOMEN include 16-17, 35-39, 40-44, 45-49, and 50-54
        var divisionToQuery = [Division.MEN, Division.WOMEN, Division.BOYS_14_15, Division.GIRLS_14_15, Division.MEN_55_59,
            Division.WOMEN_55_59, Division.MEN_60, Division.WOMEN_60];

        return Promise.map(divisionToQuery, function (division) {
            var page = 1;
            var total;
            var u = url.replace('{DIVISION}', division).replace('{YEAR}', year);

            function loop() {
                return new Promise(function (resolve, reject) {
                    var options = {
                        url: u.replace('{PAGE}', page)
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
                            overallTotal += total;
                        }

                        Promise.map(info.athletes, function(athlete) {
                            return database.addAthlete(athlete);
                        })
                            .then(function () {
                                if (page >= total) {
                                    resolve(false);
                                    return;
                                }

                                resolve(true);
                            });
                    }); // request
                })
                    .then(function (bContinue) {
                        if (++overallPage % 10 === 0 || !bContinue) {
                            console.log(overallPage + ' of ' + overallTotal + ' pages complete');
                        }
                        if (bContinue) {
                            ++page;
                            return loop();
                        }
                    });
            }

            return loop();
        });
    })
    .then(function () {
        console.log('Done!');
        return database.destroy();
    })
    .catch(function (error) {
        console.log(error);
        process.exit(1);
    });
