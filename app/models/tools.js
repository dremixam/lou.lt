'use strict';

var config = require('../../config.json');
var log4js = require('log4js');
log4js.replaceConsole();
var path = require('path');
var log = require('../models/log.js')(config, path.relative('.', __filename));

var chance = require('chance').Chance();

module.exports.randomColor = function () {
  var lines = ['#001F3F', '#0074D9', '#39CCCC', '#3D9970', '#01FF70', '#FF851B', '#85144B', '#F012BE', '#B10DC9'];
  var text = lines[Math.floor(Math.random() * lines.length)];
  return text;
};

module.exports.randomUUID = function () {
  return chance.guid();
};

module.exports.randomIntRange = function (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

module.exports.replaceHtmlEntites = (function (mystring) {
  return mystring.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
});
