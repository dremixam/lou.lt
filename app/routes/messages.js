var twitter = require('twitter-text');
var exec = require('child_process').exec;
var userModel = require('../models/user');
var messagesModel = require('../models/messages');
var socketModel = require('../models/socket');
var chance = require('chance').Chance();
var fs = require('fs');
var config = require('../../config'); // load the config

module.exports = function (socket) {



  socket.on('message', function (message) {
    var lng = socketModel.get(socket.id, 'lng');
    var channel = socketModel.get(socket.id, 'channel');


    fs.readFile('banlist.json', 'utf8', function (err, data) {
      if (err) {
        return;
      }

      var banlist = JSON.parse(data);

      if ( typeof socket.handshake === 'undefined' ) {
        return;
      }

      var userIp = socket.handshake.headers['x-real-ip'] || socket.handshake.address.address;


      if (banlist.banned.indexOf(userIp) != -1) {
        socket.disconnect('unauthorized');
        return 0;
      } else {


        var messageId = chance.guid(); // On g&eacute;n&egrave;re un id pour le message

        // Si le message est vide on jette
        if (message.length < 1) return;

        var hs = socket.handshake;

        // Si le pseudo n'est pas défini, on est pas connecté donc on jette
        if (hs.session.userData === null) {
          socket.emit('errormsg', {
            message: "Une erreur est survenue, veuillez réactualiser"
          });
          return;
        }

        // Si le dernier message a moins de deux secondes on jette
        if (userModel.updateLastMessage(socket) === false) {
          socket.emit('errormsg', {
            message: "Ne postez pas trop vite"
          });
          return;
        }


        // Génération de la voix et du message
        message = message.replace(/卐/g, "").substring(0, 300); //On vire les caracteres qui font chier et on réduit la chaine

        // Si le message est vide on jette
        if (message.length < 1) return;

        messageAEnregistrer = message.replace(/(https?:\/\/[^\s]+)/g, ' ').replace(/(\#)/g, ' hashtag ').replace(/[^a-zA-Z0-9 ,\.\?\!éùàçèÉÀÇÈÙ%êÊâÂûÛïÏîÎöÖüÜëËäÄôÔñÑœŒ\@\#\€\-']/ig, ' ').substring(0, 300);
        message = twitter.autoLink(replaceHtmlEntites(message), {
          target: '_blank'
        });
        audio = "/res/audio/" + messageId + ".wav";

        if (lng == 'fr') {
          commande = "espeak " + hs.session.userData.params + " -v mb/mb-fr1 --pho \"" + messageAEnregistrer + "\" 2>/dev/null | mbrola -e /usr/share/mbrola/" + hs.session.userData.voice.fr + "/" + hs.session.userData.voice.fr + " - ./static" + audio;
        } else if (lng == 'en') {
          commande = "espeak " + hs.session.userData.params + " -v mb/mb-us1 --pho \"" + messageAEnregistrer + "\" 2>/dev/null | mbrola -e /usr/share/mbrola/" + hs.session.userData.voice.en + "/" + hs.session.userData.voice.en + " - ./static" + audio;
        } else {
          commande = "espeak " + hs.session.userData.params + " -v mb/mb-en1 --pho \"" + messageAEnregistrer + "\" 2>/dev/null | mbrola -e /usr/share/mbrola/" + hs.session.userData.voice.en + "/" + hs.session.userData.voice.en + " - ./static" + audio;
        }



        exec(commande, function (error, stdout, stderr) {

          if (config.devel) console.log("DEBUG MESSAGE "+hs.session.userData+":"+messageAEnregistrer+":"+commande);

          if (error !== null) {
            console.log('exec error: ' + error);
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
              message: message,
              audiofile: audio,
              color: hs.session.userData.public.color
            });
            }
            catch (err) {
              console.log('send error: ' + err);
            }

          }
        });
      }
    });
  });



};


var replaceHtmlEntites = (function (mystring) {
  return mystring.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
});
