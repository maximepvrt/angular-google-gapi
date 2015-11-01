var gulp = require('gulp');
var uglify = require('gulp-uglify');
var del = require('del');
var path = require('path');
var rename = require('gulp-rename');
var uglifySaveLicense = require('uglify-save-license');

gulp.task('clean', function (done) {
    del([
        path.join('./', 'angular-google-gapi.min.js')], done);
});

gulp.task('compress', function() {
    return gulp.src('angular-google-gapi.js')
        .pipe(uglify({
            mangle: false,
            preserveComments: uglifySaveLicense
        }))
        .pipe(rename({
            extname: '.min.js'
        }))
        .pipe(gulp.dest('./'));
});

gulp.task('default', ['clean', 'compress']);