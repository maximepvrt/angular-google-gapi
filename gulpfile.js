var del = require('del');
var gulp = require('gulp');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var uglifySaveLicense = require('uglify-save-license');

gulp.task('clean', function () {
    return del('dist/**.js');
});

gulp.task('build', ['clean'], function () {
    return gulp.src(['src/angular-google-gapi.module.js', 'src/factories/*.js', 'src/directives/*.js'])
        .pipe(concat('angular-google-gapi.js'))
        .pipe(gulp.dest('dist'))
        .pipe(uglify({preserveComments: uglifySaveLicense}))
        .pipe(rename({extname: '.min.js'}))
        .pipe(gulp.dest('dist/'));
});

gulp.task('watch', ['build'], function () {
    gulp.watch('src/**/*.js', ['build']);
});

gulp.task('default', ['build']);