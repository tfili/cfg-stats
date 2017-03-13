'use strict';

var Cesium = require('cesium');
var ProgressBar = require('progress');

var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

module.exports = Progress;

function Progress(taskname, adds) {
    this._taskname = taskname;
    this._desiredAdds = defaultValue(adds, 1);
    this._addCount = 0;
    this._total = 0;
    this._completed = 0;
    this._progressBar = undefined;
}

Progress.prototype.add = function (count) {
    if (defined(this._progressBar)) {
        throw 'Can\'t add after progress bar creation.';
    }

    this._total += count;

    ++this._addCount;
    if (this._addCount >= this._desiredAdds) {
        var text = this._taskname + ' [:bar] :current/:total(:percent) :elapsed seconds';
        var bar = this._progressBar = new ProgressBar(text, {
            complete: '=',
            incomplete: ' ',
            width: 20,
            total: this._total
        });

        var completed = this._completed;
        if (completed > 0) {
            bar.tick(completed);
        }
    }
};

Progress.prototype.tick = function () {
    ++this._completed;
    if (defined(this._progressBar)) {
        this._progressBar.tick();
    }
};
