var twitter = require('twitter-text');
var exec = require('child_process').exec;
var userModel = require('../models/user');
var messagesModel = require('../models/messages');
var randomGen = require('../models/random');

//randomGen.init();

module.exports = function (socket) {

  socket.get("lng", function (err, lng) {
    socket.get("channel", function (err, channel) {

      socket.on('message', function (message) {

        var messageId = randomGen.get(); // On g&eacute;n&egrave;re un id pour le message

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
        message = message.substring(0, 300);
        messageAEnregistrer = message.replace(/(https?:\/\/[^\s]+)/g, ' ').replace(/(\#)/g, ' hashtag ').replace(/[^a-zA-Z0-9 ,\.\?\!éùàçèÉÀÇÈÙ%êÊâÂûÛïÏîÎöÖüÜëËäÄôÔñÑœŒ\@\#\€']/ig, ' ').substring(0, 140);
        message = twitter.autoLink(replaceHtmlEntites(message).replace(/卐/g, " je suis homosexuel "), {
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



        console.log(commande);

        child = exec(commande, function (error, stdout, stderr) {
          if (error !== null) {
            console.log('exec error: ' + error);
          }
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
          messagesModel.push({
            pseudo: hs.session.userData.public.pseudo,
            message: message,
            audiofile: audio,
            color: hs.session.userData.public.color
          });
        });



      });
    });
  });



};


var replaceHtmlEntites = (function (mystring) {
  return mystring.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
});
