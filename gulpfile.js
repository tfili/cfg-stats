'use strict';

var gulp = require('gulp');
var gulpJshint = require('gulp-jshint');
var yargs = require('yargs');

var argv = yargs.argv;

var jsHintFiles = ['**/*.js', '!node_modules/**'];

gulp.task('jsHint', function () {
    var stream = gulp.src(jsHintFiles)
        .pipe(gulpJshint())
        .pipe(gulpJshint.reporter('jshint-stylish'));

    if (argv.failTaskOnError) {
        stream = stream.pipe(gulpJshint.reporter('fail'));
    }

    return stream;
});
