'use strict';

var gulp = require('gulp'),
  compass = require('gulp-compass'),
  minifycss = require('gulp-minify-css'),
  jshint = require('gulp-jshint'),
  uglify = require('gulp-uglify'),
  rename = require('gulp-rename'),
  nodemon = require('gulp-nodemon'),
  install = require('gulp-install');

//Compilation des SCSS

gulp.task('styles', function () {
  return gulp.src(['static/scss/**/*.scss'])
    .pipe(compass({
      sass: 'static/scss',
      css: 'static/styles',
      image: 'static/res/img'
    }))
    .pipe(minifycss())
    .pipe(gulp.dest('static/styles'));
});

//Compilation des fichiers javascript en un seul fichier main.js uglifié

gulp.task('scripts', function () {
  return gulp.src('static/js/adsbygoogle.js')
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('default'))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(uglify())
    .pipe(gulp.dest('static/js'));
});


gulp.task('install', function () {
  return gulp.src(['./bower.json', './package.json'])
    .pipe(install());
});

//Action par d&eacute;faut : compilation complete du site pour le déploiement

gulp.task('default', ['install'], function () {
  gulp.start('styles', 'scripts');
});

//Action devel, compilation + surveillance pour utiliser pendant le dev

gulp.task('devel', ['default'], function () {

  // watch for JS changes
  gulp.watch('static/js/*.js', function () {
    gulp.start('scripts');
  });


  gulp.watch('static/src/styles/**/*.scss', function () {
    gulp.start('styles');
  });

  nodemon({
    script: 'loult.js',
    ext: 'js',
    ignore: ['./static/**', '.*/**']
  })
    .on('change', [])
    .on('restart', function () {
      console.log('restarted!');
    });

});
