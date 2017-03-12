'use strict';

var Cesium = require('cesium');
var ProgressBar = require('progress');

var defined = Cesium.defined;

module.exports = Progress;

function Progress(requests) {
    this._desiredRequestCount = requests;
    this._requestCount = 0;
    this._totalPages = 0;
    this._completedPages = 0;
    this._progressBar = undefined;
}

Progress.prototype.addRequest = function() {
    ++this._requestCount;
    if (this._requestCount == this._desiredRequestCount) {
        var text = 'Processing pages [:bar] :current/:total(:percent) :elapsed seconds';
        var bar = this._progressBar = new ProgressBar(text, {
            complete: '=',
            incomplete: ' ',
            width: 20,
            total: this._totalPages
        });

        var completed = this._completedPages;
        if (completed > 0) {
            bar.tick(completed);
        }
    }
};

Progress.prototype.addPages = function(count) {
    if (defined(this._progressBar)) {
        throw 'Can\'t add pages after progress bar creation.';
    }

    this._totalPages += count;
};

Progress.prototype.completePage = function() {
    ++this._completedPages;
    if (defined(this._progressBar)) {
        this._progressBar.tick();
    }
};
