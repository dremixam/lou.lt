'use strict';

var config = require('../../config.json');
var log4js = require('log4js');
log4js.replaceConsole();
var path = require('path');
var log = require('../models/log.js')(config, path.relative('.', __filename));

var twitter = require('twitter-text');
var spawn = require('child_process').spawn;
var userModel = require('../models/user');
var messagesModel = require('../models/messages');
var socketModel = require('../models/socket');
var crypto = require('crypto');
var fs = require('fs'),
  gm = require('gm').subClass({
    imageMagick: true
  });
var config = require('../../config'); // load the config
var embed = require('embed-video');
var url = require('url');
var Pageres = require('pageres');
var tools = require('../models/tools.js');

//=============================================================================
var dirPath = './static/dist/res/audio/records/';
try {
  var files = fs.readdirSync(dirPath);
  if (files.length > 0) {
    for (var i = 0; i < files.length; i++) {
      var filePath = dirPath + '/' + files[i];
      fs.unlinkSync(filePath);
    }
  }
} catch (e) {
  log.error(e);
}
//=============================================================================

module.exports = function (socket, db) {
  socket.on('message', function (message) {
    log.debug('message reçu de ' + socket.id + ' : ' + message);
    var channel = socketModel.get(socket.id, 'channel');


    if (typeof socket.handshake === 'undefined') {
      return;
    }

    var userIp = socket.handshake.headers['x-real-ip'] || socket.handshake.address.address;


    var messageId = tools.randomUUID(); // On g&eacute;n&egrave;re un id pour le message

    // Si le message est vide on jette
    if (message.length < 1) {
      return;
    }


    var userData = socketModel.get(socket.id, 'userData');

    log.debug('userdata : ' + JSON.stringify(userData));

    // Si le pseudo n'est pas défini, on est pas connecté donc on jette
    if (userData === null) {
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
    if (message.length < 1) {
      return;
    }

    var messageAEnregistrer = message.replace(/(https?:\/\/[^\s]+)/g, ' ').replace(/(\#)/g, ' hashtag ').replace(/[^a-zA-Z0-9 ,\.\?\!éùàçèÉÀÇÈÙ%êÊâÂûÛïÏîÎöÖüÜëËäÄôÔñÑœŒ\@\#\€\-']/ig, ' ').substring(0, 300);

    var audio = '/res/audio/records/' + messageId + '.wav';

    // Configuration du synthétiseur vocal.
    var params = [];
    params = [userData.params, 'fr', messageAEnregistrer, userData.voice.fr, './static/dist' + audio, userData.gender];


    //Lancement du synthétiseur vocal
    var synth = spawn('./voiceSynth.sh', params);

    synth.on('exit', function (exitCode) {
      if (exitCode !== 0 && config.devel === false) {
        log.error('Une erreur est survenue lors de la génération du son');
      } else {
        try {
          socket.broadcast.to(channel).emit('message', {
            user: userData.public,
            message: message,
            audiofile: audio,
            color: userData.public.color
          });
          socket.emit('ownmessage', {
            user: userData.public,
            message: message,
            audiofile: audio,
            color: userData.public.color
          });
          messagesModel.push(channel, {
            user: userData.public,
            ip: userIp,
            message: message,
            audiofile: audio,
            color: userData.public.color,
            time: new Date().toUTCString()
          });
          setTimeout(function () {
            log.debug('suppression du fichier audio ' + audio);
            try {
              fs.unlinkSync('./static/dist' + audio);
            } catch (err) {
              log.error('could not delete audio file' + audio);
            }

          }, 60000)
        } catch (err) {
          log.error('send error: ' + err);
        }
      }
    });
  });
};
