'use strict';

var twitter = require('twitter-text');
var spawn = require('child_process').spawn;
var userModel = require('../models/user');
var messagesModel = require('../models/messages');
var socketModel = require('../models/socket');
var chance = require('chance').Chance();
var crypto = require('crypto');
var fs = require('fs'),
  gm = require('gm').subClass({
    imageMagick: true
  });
var config = require('../../config'); // load the config
var embed = require('embed-video');
var url = require('url');
var Pageres = require('pageres');

var replaceHtmlEntites = (function (mystring) {
  return mystring.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
});

module.exports = function (socket) {
  socket.on('message', function (message) {
    var lng = socketModel.get(socket.id, 'lng'),
      channel = socketModel.get(socket.id, 'channel');
    fs.readFile('banlist.json', 'utf8', function (err, data) {
      if (err) {
        console.log(err);
        return;
      }

      var banlist = JSON.parse(data);

      if (typeof socket.handshake === 'undefined') {
        return;
      }

      var userIp = socket.handshake.headers['x-real-ip'] || socket.handshake.address.address;


      if (banlist.banned.indexOf(userIp) !== -1) {
        socket.disconnect('unauthorized');
        return 0;
      } else {


        var messageId = chance.guid(); // On g&eacute;n&egrave;re un id pour le message

        // Si le message est vide on jette
        if (message.length < 1) { return; }

        var hs = socket.handshake;

        // Si le pseudo n'est pas défini, on est pas connecté donc on jette
        if (hs.session.userData === null) {
          socket.emit('errormsg', {
            message: 'Une erreur est survenue, veuillez réactualiser'
          });
          return;
        }

        // Si le dernier message a moins de deux secondes on jette
        if (userModel.updateLastMessage(socket) === false) {
          socket.emit('errormsg', {
            message: 'Ne postez pas trop vite'
          });
          return;
        }

        // Génération de la voix et du message
        message = message.replace(/卐/g, '').substring(0, 300); //On vire les caracteres qui font chier et on réduit la chaine

        // Si le message est vide on jette
        if (message.length < 1) { return; }

        var messageAEnregistrer = message.replace(/(https?:\/\/[^\s]+)/g, ' ').replace(/(\#)/g, ' hashtag ').replace(/[^a-zA-Z0-9 ,\.\?\!éùàçèÉÀÇÈÙ%êÊâÂûÛïÏîÎöÖüÜëËäÄôÔñÑœŒ\@\#\€\-']/ig, ' ').substring(0, 300);

	message = replaceHtmlEntites(message);

        var messageHisto = message;

        var audio = '/res/audio/' + messageId + '.wav';

        // Configuration du synthétiseur vocal.
        var params = [];
        if (lng === 'fr') {
          params = [hs.session.userData.params, 'fr', messageAEnregistrer, hs.session.userData.voice.fr, './static/dist' + audio];
        } else if (lng === 'en') {
          params = [hs.session.userData.params, 'us', messageAEnregistrer, hs.session.userData.voice.en, './static/dist' + audio];
        } else {
          params = [hs.session.userData.params, 'en', messageAEnregistrer, hs.session.userData.voice.en, './static/dist' + audio];
        }

        //Lancement du synthétiseur vocal
        var synth = spawn('./voiceSynth.sh', params);

        synth.on('exit', function(exitCode){

          if (exitCode !== 0 && config.devel === false) {
            console.log('Une erreur est survenue lors de la génération du son');
          } else {
            try {
              socket.broadcast.to(channel).emit('message', {
                user: hs.session.userData.public,
                message: message,
                audiofile: audio,
                color: hs.session.userData.public.color
              });
              socket.emit('ownmessage', {
                user: hs.session.userData.public,
                message: message,
                audiofile: audio,
                color: hs.session.userData.public.color
              });
              messagesModel.push(channel, {
                user: hs.session.userData.public,
                ip: userIp,
                message: messageHisto,
                audiofile: audio,
                color: hs.session.userData.public.color,
                time: new Date()
              });
            } catch (err) {
              console.log('send error: ' + err);
            }
            //Création et envoi des miniatures
          }
        });
      }
    });
  });
};



