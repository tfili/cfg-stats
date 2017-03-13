#!/usr/bin/env node
'use strict';

var Promise = require('bluebird');
var fs = require('fs-extra');
var path = require('path');
var yargs = require('yargs');

var Database = require('../lib/Database');
var Division = require('../lib/Division');
var Progress = require('../lib/Progress');
var requestAthletes = require('../lib/requestAthletes');
var requestAffiliates = require('../lib/requestAffiliates');

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

var year = argv.year;

var dbPath = argv.output;
fs.ensureDirSync(path.dirname(dbPath));

var database = new Database(dbPath, year);

database.readyPromise
    .then(function () {
        return database.begin();
    })
    .then(function () {
        // MEN/WOMEN include 16-17, 35-39, 40-44, 45-49, and 50-54
        var divisionToQuery = [Division.MEN, Division.WOMEN, Division.BOYS_14_15, Division.GIRLS_14_15, Division.MEN_55_59,
            Division.WOMEN_55_59, Division.MEN_60, Division.WOMEN_60];

        var progress = new Progress('Populate Athletes', divisionToQuery.length);
        return Promise.map(divisionToQuery, function (division) {
            return requestAthletes(division, year, progress, function (athlete) {
                return database.addAthlete(athlete);
            });
        });
    })
    .then(function () {
        return database.end();
    })
    .then(function () {
        return database.begin();
    })
    .then(function () {
        return database.getAffiliatesWithAthletes();
    })
    .then(function (affiliates) {
        var progress = new Progress('Populate Affiliates');
        progress.add(affiliates.length);
        return requestAffiliates(affiliates, function (affiliate) {
            return database.addAffiliate(affiliate)
                .then(function () {
                    progress.tick();
                });
        });
    })
    .then(function () {
        return database.destroy();
    })
    .catch(function (error) {
        console.log(error);
        process.exit(1);
    });
