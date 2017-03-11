'use strict';

var Promise = require('bluebird');
var Cesium = require('cesium');
var fs = require('fs-extra');
var sqlite3 = require('sqlite3');

var DataParsers = require('./DataParsers');
var Division = require('./Division');
var ScoreParsers = require('./ScoreParsers');

var defined = Cesium.defined;
var destroyObject = Cesium.destroyObject;

module.exports = Database;

function createInsert(statement) {
    return function () {
        var args = Array.prototype.slice.call(arguments);
        return new Promise(function (resolve, reject) {
            args.push(function (error) {
                if (defined(error)) {
                    reject(error);
                    return;
                }

                resolve(this.lastID);
            });
            statement.run.apply(statement, args);
        });
    };
}

function Database(dbPath, year) {
    if (typeof dbPath !== 'string') {
        throw 'dbPath must be string';
    }

    if (typeof year !== 'number') {
        throw 'year must be a number';
    }

    this._year = year;
    this._db = undefined;
    this._dbExec = undefined;

    this._insertAthlete = undefined;
    this._insertAthleteFinalize = undefined;
    this._insertScore = undefined;
    this._insertScoreFinalize = undefined;
    this._selectLastRowId = undefined;
    this._selectLastRowIdFinalize = undefined;

    var that = this;
    var db;
    this.readyPromise = new Promise(function (resolve, reject) {
        var callback = function (err) {
            if (defined(err)) {
                reject(err);
                return;
            }
            resolve();
        };
        if (!fs.existsSync(dbPath)) {
            that._db = db = new sqlite3.Database(dbPath, callback);
        } else {
            reject('Database already exists!');
        }
    })
        .then(function () {
            console.log('Database Created!');

            // Create database tables
            var dbExec = that._dbExec = Promise.promisify(db.exec, {context: db});

            var sql = ['CREATE TABLE IF NOT EXISTS athletes(id INTEGER PRIMARY KEY, userid TEXT, name TEXT, region INTEGER, affiliate INTEGER, sex INTEGER, \
                  age INTEGER, height REAL, weight REAL, picture TEXT)',

                'CREATE TABLE IF NOT EXISTS scores(athlete_id INTEGER, year INTEGER, workout INTEGER, score REAL, \
                tiebreak REAL, PRIMARY KEY (athlete_id, year, workout), FOREIGN KEY(athlete_id) REFERENCES athletes(id))'];

            return Promise.map(sql, function (s) {
                return dbExec(s);
            });
        })
        .then(function () {
            console.log('Tables Created!');

            var promises = [];
            promises.push(new Promise(function (resolve, reject) {
                var insertAthleteStatement = db.prepare('INSERT INTO athletes (userid, name, region, affiliate, sex, age, height, weight, picture) \
                                    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    function (err) {
                        if (defined(err)) {
                            reject(err);
                            return;
                        }
                        that._insertAthlete = createInsert(insertAthleteStatement);
                        that._insertAthleteFinalize = Promise.promisify(insertAthleteStatement.finalize, {context: insertAthleteStatement});
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
                        that._insertScore = createInsert(insertScoreStatement);
                        that._insertScoreFinalize = Promise.promisify(insertScoreStatement.finalize, {context: insertScoreStatement});
                        resolve();
                    });
            }));

            promises.push(new Promise(function (resolve, reject) {
                var selectLastRowIdStatement = db.prepare('SELECT last_insert_rowid() AS id',
                    function (err) {
                        if (defined(err)) {
                            reject(err);
                            return;
                        }
                        that._selectLastRowId = Promise.promisify(selectLastRowIdStatement.get, {context: selectLastRowIdStatement});
                        that._selectLastRowIdFinalize = Promise.promisify(selectLastRowIdStatement.finalize, {context: selectLastRowIdStatement});
                        resolve();
                    });
            }));

            return Promise.all(promises);
        });
}

Database.prototype.begin = function () {
    if (this._inTransaction) {
        return Promise.reject('Already in a transaction');
    }

    var that = this;
    return this._dbExec('BEGIN TRANSACTION')
        .then(function () {
            that._inTransaction = true;
        });
};

Database.prototype.end = function () {
    if (!this._inTransaction) {
        return Promise.reject('Not in a transaction');
    }

    var that = this;
    return this._dbExec('END')
        .then(function () {
            that._inTransaction = false;
        });
};

Database.prototype.addAthlete = function (athleteInfo) {
    var that = this;
    var year = this._year;
    var sex = Division.toSex(athleteInfo.division);
    return this._insertAthlete(athleteInfo.userid, athleteInfo.name, DataParsers.region(athleteInfo.regionid),
        DataParsers.affiliate(athleteInfo.affiliateid), sex, athleteInfo.age,
        DataParsers.height(athleteInfo.height), DataParsers.weight(athleteInfo.weight),
        athleteInfo.profilepic)
        .then(function (id) {
            return Promise.map(athleteInfo.scores, function (scoreObj, index) {
                var score = ScoreParsers[year][index](scoreObj);
                return that._insertScore(id, year, index, score.score, score.tiebreaker);
            });
        });
};

Database.prototype.destroy = function () {
    var promise = this._inTransaction ? this._dbExec('END') : Promise.resolve();

    var that = this;
    return promise
        .then(function () {
            return Promise.join(that._insertAthleteFinalize(), that._insertScoreFinalize(), that._selectLastRowIdFinalize());
        })
        .then(function () {
            destroyObject(that);
        });
};
