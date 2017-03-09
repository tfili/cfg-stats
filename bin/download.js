#!/usr/bin/env node
'use strict';

var Promise = require('bluebird');
var Cesium = require('cesium');
var fs = require('fs-extra');
var path = require('path');
var request = require('request');
var sqlite3 = require('sqlite3');

var dataParsers = require('../lib/dataParsers');
var scoreParsers = require('../lib/scoreParsers');

var defined = Cesium.defined;

var dbPath = path.join(__dirname, '..', 'data', 'stats.db');
fs.ensureDirSync(path.dirname(dbPath));

var SEX = {
    MALE: 1,
    FEMALE: 2
};
// var SEX_STRINGS = ['', 'Male', 'Female'];
// var REGION_STRINGS = ['Worldwide', 'Africa', 'Asia', 'Australia', 'Canada East', 'Canada West', 'Central East', 'Europe',
//                         'Latin America', 'Mid Atlantic', 'North Central', 'North East', 'Northern California',
//                         'North West', 'South Central', 'South East', 'Southern California', 'South West'];

var url = 'https://games.crossfit.com/competitions/api/v1/competitions/open/2017/leaderboards?competition=1&year=2017&division={SEX}&scaled=0&sort=0&fittest=1&fittest1=0&occupation=0&page={PAGE}';
var year = 2017;

var db;
var openPromise = new Promise(function (resolve, reject) {
    var callback = function (err) {
        if (defined(err)) {
            reject(err);
            return;
        }
        resolve(db);
    };
    if (!fs.existsSync(dbPath)) {
        db = new sqlite3.Database(dbPath, callback);
    } else {
        reject('Database already exists!');
    }
});

var insertAthlete, insertAthleteFinalize;
var insertScore, insertScoreFinalize;
var dbExec;
openPromise
    .then(function() {
        console.log('Database Created!');

        // Create database tables
        dbExec = Promise.promisify(db.exec, {context: db});

        var sql = ['CREATE TABLE IF NOT EXISTS athletes(id INTEGER PRIMARY KEY, name TEXT, affiliate INTEGER, sex INTEGER, \
                  age INTEGER, height REAL, weight REAL, picture TEXT)',

                   'CREATE TABLE IF NOT EXISTS scores(athlete_id INTEGER, year INTEGER, workout INTEGER, score REAL, \
                   tiebreak REAL, PRIMARY KEY (athlete_id, year, workout), FOREIGN KEY(athlete_id) REFERENCES athletes(id))'];

        return Promise.map(sql, function(s) {
            return dbExec(s);
        });
    })
    .then(function() {
        var promises = [];
        promises.push(new Promise(function (resolve, reject) {
            var insertAthleteStatement = db.prepare('INSERT INTO athletes (id, name, affiliate, sex, age, height, weight, picture) \
                                    VALUES(?, ?, ?, ?, ?, ?, ?, ?)',
                function (err) {
                    if (defined(err)) {
                        reject(err);
                        return;
                    }
                    insertAthlete = Promise.promisify(insertAthleteStatement.run, {context: insertAthleteStatement});
                    insertAthleteFinalize = Promise.promisify(insertAthleteStatement.finalize, {context: insertAthleteStatement});
                    resolve();
                });
        }));

        promises.push(new Promise(function (resolve, reject) {
            var insertScoreStatement = db.prepare('INSERT INTO scores(athlete_id, year, workout, score, tiebreak) \
                                          VALUES(?, ?, ?, ?, ?)',
                function (err) {
                    if (defined(err)) {
                        reject(err);
                        return;
                    }
                    insertScore = Promise.promisify(insertScoreStatement.run, {context: insertScoreStatement});
                    insertScoreFinalize = Promise.promisify(insertScoreStatement.finalize, {context: insertScoreStatement});
                    resolve();
                });
        }));

        return Promise.all(promises);
    })
    .then(function() {
        console.log('Tables Created!');
        return dbExec('BEGIN TRANSACTION');
    })
    .then(function() {
        var totalPages = 0;
        var pageCount = 0;
        return Promise.map([SEX.MALE, SEX.FEMALE], function(sex) {
            var page = 1;
            var u = url.replace('{SEX}', sex).replace('{YEAR}', year);

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
                        if (info.currentpage === 1) {
                            totalPages += info.totalpages;
                        }

                        Promise.map(info.athletes, function(athleteInfo) {
                            var athleteId = dataParsers.id(athleteInfo.userid);
                            return Promise.join(insertAthlete(athleteId, athleteInfo.name,
                                dataParsers.affiliate(athleteInfo.affiliateid), athleteInfo.division, athleteInfo.age,
                                dataParsers.height(athleteInfo.height), dataParsers.weight(athleteInfo.weight),
                                athleteInfo.profilepic),
                                Promise.map(athleteInfo.scores, function(scoreObj, index) {
                                    var score = scoreParsers[year][index](scoreObj);
                                    return insertScore(athleteId, year, index, score.score, score.tiebreaker);
                                }));
                        })
                            .then(function(){
                                if (info.currentpage === info.totalpages) {
                                    resolve(false);
                                    return;
                                }

                                resolve(false);
                                //resolve(true);
                            });
                    });
                })
                    .then(function(bContinue) {
                        if (++pageCount % 10 === 0) {
                            console.log(pageCount + ' of ' + totalPages + ' pages complete');
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
    .then(function() {
        console.log('Done!');
        return Promise.join(dbExec('END'), insertAthleteFinalize(), insertScoreFinalize());
    })
    .catch(function(error) {
        console.log(error);
        process.exit(1);
    });
