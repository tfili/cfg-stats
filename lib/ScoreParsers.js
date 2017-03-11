'use strict';

var Cesium = require('cesium');

var defined = Cesium.defined;

module.exports = {
    2017 : [
        _17_1,
        _17_2,
        _17_3,
        noScore,
        noScore
    ]
};

function _17_1(scoreObj) {
    var result = noScore();
    var scoredetails = scoreObj.scoredetails;
    if (defined(scoredetails)) {
        var scoredisplay = scoreObj.scoredisplay;
        if (scoredisplay.indexOf('reps - s') !== -1) {
            result.score = parseInt(scoredisplay) * 0.001;
        } else if (scoredisplay.indexOf('reps') !== -1) {
            result.score = parseInt(scoredisplay);
        } else {
            result.score = 225;
        }
        result.tiebreaker = scoredetails.time;
    }

    return result;
}

function _17_2(scoreObj) {
    var result = noScore();
    var scoredetails = scoreObj.scoredetails;
    if (defined(scoredetails)) {
        var scoredisplay = scoreObj.scoredisplay;
        if (scoredisplay.indexOf('reps - s') !== -1) {
            result.score = parseInt(scoredisplay) * 0.001;
        } else if (scoredisplay.indexOf('reps') !== -1) {
            result.score = parseInt(scoredisplay);
        }
        result.tiebreaker = scoredetails.time;
    }

    return result;
}

function _17_3(scoreObj) {
    var result = noScore();
    var scoredetails = scoreObj.scoredetails;
    if (defined(scoredetails)) {
        var scoredisplay = scoreObj.scoredisplay;

        if (scoredisplay.indexOf('reps - s') !== -1) {
            result.score = parseInt(scoredisplay) * 0.001;
        } else if (scoredisplay.indexOf('reps') !== -1) {
            result.score = parseInt(scoredisplay);
        } else {
            result.score = 216;
        }
        result.tiebreaker = scoredetails.time;
    }
    return result;
}

function noScore() {
    return {
        score : 0,
        tiebreaker : 0
    };
}