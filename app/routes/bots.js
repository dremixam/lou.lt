'use strict';

var twitter = require('twitter-text');
var exec = require('child_process').exec;
var messagesModel = require('../models/messages');
var chance = require('chance').Chance();
var fs = require('fs');
var Robots = require('../models/bots.js');

module.exports = function (socket) {

    var message;
    var lng = 'fr';
    var channel = '/';

    var messageId = chance.guid(); // On g&eacute;n&egrave;re un id pour le message

    // Si le message est vide on jette
    if (message.length < 1) return;

    // Génération de la voix et du message
    message = message.substring(0, 300);
    messageAEnregistrer = message.replace(/(https?:\/\/[^\s]+)/g, ' ').replace(/(\#)/g, ' hashtag ').replace(/[^a-zA-Z0-9 ,\.\?\!éùàçèÉÀÇÈÙ%êÊâÂûÛïÏîÎöÖüÜëËäÄôÔñÑœŒ\@\#\€']/ig, ' ').substring(0, 300);
    message = twitter.autoLink(replaceHtmlEntites(message).replace(/卐/g, ''), {
      target: '_blank'
    });
    audio = '/res/audio/' + messageId + '.wav';

    if (lng === 'fr') {
      commande = 'espeak ' + hs.session.userData.params + ' -v mb/mb-fr1 --pho \'' + messageAEnregistrer + '\' 2>/dev/null | mbrola -e /usr/share/mbrola/' + hs.session.userData.voice.fr + '/' + hs.session.userData.voice.fr + ' - ./static' + audio;
    } else if (lng === 'en') {
      commande = 'espeak ' + hs.session.userData.params + ' -v mb/mb-us1 --pho \'' + messageAEnregistrer + '\' 2>/dev/null | mbrola -e /usr/share/mbrola/' + hs.session.userData.voice.en + '/' + hs.session.userData.voice.en + ' - ./static' + audio;
    } else {
      commande = 'espeak ' + hs.session.userData.params + ' -v mb/mb-en1 --pho \'' + messageAEnregistrer + '\' 2>/dev/null | mbrola -e /usr/share/mbrola/' + hs.session.userData.voice.en + '/' + hs.session.userData.voice.en + ' - ./static' + audio;
    }

    exec(commande, function (error, stdout, stderr) {
      console.log(messageId + ' g&eacute;n&eacute;r&eacute;, envoi sur ' + channel);
      console.log(error + '/' + stdout + '/' + stderr);
      if (error !== null) {
        console.log('exec error: ' + error);
      }
      socket.broadcast.to(channel).emit('message', {
        user: hs.session.userData.public,
        message: message,
        audiofile: audio,
        color: hs.session.userData.public.color
      });
      messagesModel.push(channel, {
        user: hs.session.userData.public,
        message: message,
        audiofile: audio,
        color: hs.session.userData.public.color
      });
    });

};


var replaceHtmlEntites = (function (mystring) {
  return mystring.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/'/g, '&quot;');
});
