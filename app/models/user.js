'use strict';

var socketModel = require('../models/socket');

var tools = require('./tools.js');

var allClients = {};
var allSockets = {};


/*
Le code de ce module est à revoir completement
Mise &agrave; jour il va falloir utiliser la base de donn&eacute;es pour choisir le pok&eacute;mon maintenant. Elle contient tout ce qu'il faut.
pkmn.find({$or:[{ 'gen': 1 }, { 'gen': 2 }], 'uncommon':false, randomKey: {$gte: Math.random()}}).sort({'randomKey':1}).skip(0).limit(1)
*/




module.exports.add = function (socket, fn) {

  var lng = socketModel.get(socket.id, 'lng');
  var channel = socketModel.get(socket.id, 'channel');

  if (allClients[channel] === undefined) allClients[channel] = {};
  if (allSockets[channel] === undefined) allSockets[channel] = {};

  var userData = {};

  if (socket.handshake.session.userData !== undefined) {
    userData = socket.handshake.session.userData;
    userData.last = Date.now();
    userData.ip = socket.handshake.headers['x-real-ip'] || socket.handshake.address.address;
    userData.public.like = userData.public.like || 0;
    userData.public.thumb = userData.public.thumb || 0;

    if (userData.voice[lng] === undefined) {
      if (lng === 'fr') {
        userData.voice[lng] = 'fr' + tools.randomIntRange(1, 6);
      } else if (lng === 'en') {
        userData.voice[lng] = 'us' + tools.randomIntRange(1, 3);
      } else {
        userData.voice[lng] = 'en1';
      }
    }

    module.exports.updateLastMessage(socket);
    allClients[channel][userData.public.uuid] = userData;
    socket.handshake.session.userData = userData;
    socket.handshake.session.save();
    fn(userData);
  } else {


      var pseudo = 'Jacques Chirac';

      // On récupère une couleur qu'on attribue au nouvel utilisateur
      var color = tools.randomColor();

      var uuid = tools.randomUUID();

      // On sauvegarde toutes les données de l'utilisateur
      userData = {
        voice: {
          fr: 'fr' + tools.randomIntRange(1, 6),
          en: 'us' + tools.randomIntRange(1, 3)
        },
        params: ' -p ' + tools.randomIntRange(1, 99) + ' -s ' + tools.randomIntRange(100, 175),
        last: Date.now(),
        ip: socket.handshake.headers['x-real-ip'] || socket.handshake.address.address,
        public: {
          uuid: uuid,
          pseudo: pseudo,
          color: color,
          like: 0,
          thumb: 0,
          avatar: 'Jacques Chirac.jpg'
        }
      };

      allClients[channel][uuid] = userData;
      allSockets[channel][uuid] = socket;

      // On initialise la date du dernier message

      socket.handshake.session.userData = userData;

      socket.handshake.session.save();

      module.exports.updateLastMessage(socket);
      fn(userData);

  }
};

module.exports.forEach = function (channel, fn) {
  if (allClients[channel] === undefined) allClients[channel] = {};
  if (allSockets[channel] === undefined) allSockets[channel] = {};
  for (var uuid in allClients[channel]) {
    if ( allClients.hasOwnProperty(channel)) {
      fn(allClients[channel][uuid]);
    }
  }
};

module.exports.remove = function (channel, uuid) {

  if (allClients[channel] === undefined) allClients[channel] = {};
  if (allSockets[channel] === undefined) allSockets[channel] = {};
  delete allClients[channel][uuid];
  delete allSockets[channel][uuid];
};

module.exports.updateLastMessage = function(socket) {
  socket.handshake.session.userData.last = socket.handshake.session.userData.last || Date.now();
  if (Date.now() < socket.handshake.session.userData.last + 300) {
    return false;
  } else {
    socket.handshake.session.userData.last = Date.now();
    socket.handshake.session.save();
    return true;
  }
};
