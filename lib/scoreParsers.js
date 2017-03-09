'use strict';

module.exports = {
    2017 : [
        _17_1,
        _17_2,
        noScore,
        noScore,
        noScore
    ]
};

function _17_1(scoreObj) {
    var result = noScore();
    var scoredisplay = scoreObj.scoredisplay;
    if (scoredisplay.indexOf('reps - s') !== -1) {
        result.score = parseInt(scoredisplay) * 0.001;
    } else if (scoredisplay.indexOf('reps') !== -1) {
        result.score = parseInt(scoredisplay);
    } else {
        result.score = 225;
    }
    result.tiebreaker = scoreObj.scoredetails.time;

    return result;
}

function _17_2(scoreObj) {
    var result = noScore();
    var scoredisplay = scoreObj.scoredisplay;
    if (scoredisplay.indexOf('reps - s') !== -1) {
        result.score = parseInt(scoredisplay) * 0.001;
    } else if (scoredisplay.indexOf('reps') !== -1) {
        result.score = parseInt(scoredisplay);
    }
    result.tiebreaker = scoreObj.scoredetails.time;

    return result;
}

function noScore() {
    return {
        score : 0,
        tiebreaker : 0
    };
}