#!/bin/sh

git pull
npm install
bower install
gulp
forever stop loult.js
forever start loult.js
