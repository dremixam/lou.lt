'use strict';

var gulp = require('gulp'),
  compass = require('gulp-compass'),
  minifycss = require('gulp-minify-css'),
  uglify = require('gulp-uglify'),
  rename = require('gulp-rename'),
  nodemon = require('gulp-nodemon'),
  minifyHTML = require('gulp-minify-html'),
  imagemin = require('gulp-imagemin'),
  clean = require('gulp-clean'),
  install = require('gulp-install'),
  concat = require('gulp-concat');

//Compilation des SCSS

gulp.task('styles', function () {
  return gulp.src(['static/src/scss/*.scss'])
    .pipe(compass({
      sass: 'static/src/scss',
      css: 'static/dist/styles',
      image: 'static/src/res/img'
    }))
    .pipe(minifycss())
    .pipe(gulp.dest('static/dist/styles'));
});

gulp.task('favicon', function () {
  return gulp.src('static/src/favicon.png')
    .pipe(imagemin({
      optimizationLevel: 3,
      progressive: true,
      interlaced: true
    }))
    .pipe(gulp.dest('static/dist'));
});

gulp.task('images', function () {
  return gulp.src('static/src/res/**/*')
    .pipe(imagemin({
      optimizationLevel: 3,
      progressive: true,
      interlaced: true
    }))
    .pipe(gulp.dest('static/dist/res'));
});

gulp.task('html', function () {
  return gulp.src(['static/src/*.html'])
    .pipe(minifyHTML())
    .pipe(gulp.dest('static/dist'));
});

//Compilation des fichiers javascript en un seul fichier main.js uglifié

gulp.task('scripts', function () {
  return gulp.src('static/src/js/*.js')
    .pipe(concat('main.js'))
    .pipe(gulp.dest('static/dist/js'))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(uglify())
    .pipe(gulp.dest('static/dist/js'));
});


gulp.task('install', function () {
  return gulp.src(['./bower.json', './package.json'])
    .pipe(install());
});

//Action par d&eacute;faut : compilation complete du site pour le déploiement

gulp.task('clean', function () {
  return gulp.src(['static/dist/styles/*.css', 'static/dist/js/*.js', 'static/dist/*.html', 'static/dist/favicon.png', 'static/dist/res/**/*.jpg', 'static/dist/res/**/*.png', 'static/dist/res/**/*.gif'], {
      read: false
    })
    .pipe(clean());
});

gulp.task('default', ['install', 'images'], function () {
  gulp.start('styles', 'scripts', 'html', 'favicon');
});

//Action devel, compilation + surveillance pour utiliser pendant le dev

gulp.task('devel', ['default'], function () {

  // watch for JS changes
  gulp.watch('static/src/js/*.js', function () {
    gulp.start('scripts');
  });


  gulp.watch('static/src/scss/**/*.scss', function () {
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
