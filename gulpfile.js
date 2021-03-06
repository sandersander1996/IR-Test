/** gulpfile
 *
 * author: jbroglio
 * Date: 5/13/14
 * Time: 10:43 AM
 */

var gulp = require('gulp'),
    del = require('del'),
    mocha = require('gulp-mocha'),
    rename = require('gulp-rename'),
    plumber = require('gulp-plumber'),
    notify = require('gulp-notify'),
    fs = require('fs')
    ;


gulp.task('default', ['clean'], function () {
    gulp.start('test', 'js', 'examples', 'package', 'top', 'testFiles');
});

gulp.task('testFiles', function () {
    return gulp.src('test/**')
        .pipe(gulp.dest('dist/test'))
});

gulp.task('js', function () {
    return gulp.src('lib/*.js')
        .pipe(gulp.dest('dist/lib/'));

});

gulp.task('examples', function () {
    return gulp.src((['examples/*.js', 'examples/*.json']))
        .pipe(gulp.dest('dist/examples'));

});

gulp.task('package',
    function () {
        // remove gulp packages from npm version of package.json
        // (I could not find a gulp plugin for doing this).
        var npmpkg = 'npm-package.json';
        return fs.readFile('package.json', function (err, txt) {
            if (err) throw err;
            txt = ''+txt;
            var json = JSON.parse(txt);
            Object.keys(json.devDependencies).forEach(function(k){
                if (/gulp/.test(k)) delete json.devDependencies[k];
            });
            txt = JSON.stringify(json, null, 4);
            return fs.writeFile(npmpkg, txt, function (err) {
                if (err) throw err;
                return gulp.src((npmpkg))
                    .pipe(rename('package.json'))
                    .pipe(gulp.dest('dist'));
            })
        });
    });

gulp.task('top', function(){
    return gulp.src(['LICENSE','CHANGES.md', 'index.js','README.md'])
        .pipe(gulp.dest('dist'));
});

gulp.task('clean', function (cb) {
    del(['dist/*'], cb);
});

gulp.task('test', function () {
    return gulp.src('test/*Spec.js', {read: false})
        .pipe(plumber({errorHandler: //function(error) {
        //var errs = JSON.stringify(error);
        //notify.onError("Error:"+errs+"\n "+ "<%= error.stack ? error.stack : '' %>")();}}))
            notify.onError("Error: <%= error %>, <%= error.stack ? error.stack : '' %>")}))
        .pipe(mocha({useColors: false, reporter: 'spec'}));
});
