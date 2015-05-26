'use strict';

var config = require('../../config.json');
var log4js = require('log4js');
log4js.replaceConsole();
var path = require('path');
var log = require('../models/log.js')(config, path.relative('.', __filename));

var socketModel = require('../models/socket');

var tools = require('./tools.js');

var allClients = {};
var allSockets = {};


/*
Le code de ce module est à revoir completement
Mise &agrave; jour il va falloir utiliser la base de donn&eacute;es pour choisir le pok&eacute;mon maintenant. Elle contient tout ce qu'il faut.
pkmn.find({$or:[{ 'gen': 1 }, { 'gen': 2 }], 'uncommon':false, randomKey: {$gte: Math.random()}}).sort({'randomKey':1}).skip(0).limit(1)
*/


module.exports.add = function (socket, db, fn) {

  var channel = socketModel.get(socket.id, 'channel');

  log.debug('add socket ' + socket.id + ' to channel ' + channel);

  if (allClients[channel] === undefined) allClients[channel] = {};
  if (allSockets[channel] === undefined) allSockets[channel] = {};

  var userData = {};

  var characters = db.collection('characters');

  characters.count(function (err, n) {
    log.debug(n + ' personnages dans la base');
    var r = Math.floor(Math.random() * n);
    log.debug('on prend le numéro ' + r);

    characters.find({}, {
      skip: r,
      limit: 1
    }).toArray(function (err, randomElement) {
      log.debug(randomElement);
      log.debug('il s\'agit de ' + randomElement);

      var uuid = tools.randomUUID();

      // On sauvegarde toutes les données de l'utilisateur
      userData = {
        voice: {
          fr: 'fr' + tools.randomIntRange(1, 6),
          en: 'us' + tools.randomIntRange(1, 3)
        },
        params: ' -p ' + tools.randomIntRange(1, 99) + ' -s ' + tools.randomIntRange(100, 175),
        last: Date.now(),
        ip: socket.handshake.headers['x-real-ip'] || socket.handshake.address.address || socket.handshake.address,
        public: {
          uuid: uuid,
          pseudo: randomElement[0].nom,
          avatar: randomElement[0]._id + '.jpg',
          bio: randomElement[0].bio
        }
      };

      allClients[channel][uuid] = userData;
      allSockets[channel][uuid] = socket;

      socketModel.set(socket.id, 'userData', userData);
      socketModel.set(socket.id, 'last', Date.now());

      log.debug('allClients : ' + JSON.stringify(allClients));
      fn(userData);
    });





  });

};

module.exports.forEach = function (channel, fn) {
  if (allClients[channel] === undefined) allClients[channel] = {};
  if (allSockets[channel] === undefined) allSockets[channel] = {};
  for (var uuid in allClients[channel]) {
    if (allClients.hasOwnProperty(channel)) {
      fn(allClients[channel][uuid]);
    }
  }
};

module.exports.remove = function (channel, uuid) {
  log.debug('remove ' + uuid + ' from ' + channel);
  if (allClients[channel] === undefined) allClients[channel] = {};
  if (allSockets[channel] === undefined) allSockets[channel] = {};
  delete allClients[channel][uuid];
  delete allSockets[channel][uuid];
};

module.exports.updateLastMessage = function (socket) {
  var last = socketModel.get(socket.id, 'last') || 0;
  if (Date.now() < last + 300) {
    log.debug('dernier message datant de ' + last + ' alors qu\'il est ' + Date.now());
    return false;
  } else {
    socketModel.set(socket.id, 'last', Date.now());
    return true;
  }
};
