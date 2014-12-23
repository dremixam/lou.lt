var twitter = require('twitter-text');
var exec = require('child_process').exec;
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
var embed = require("embed-video");
var webshot = require('webshot');
var url = require('url');
var Pageres = require('pageres');

module.exports = function (socket) {



  socket.on('message', function (message) {
    var lng = socketModel.get(socket.id, 'lng');
    var channel = socketModel.get(socket.id, 'channel');


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

        var links = twitter.extractUrls(message);

        message = twitter.autoLink(replaceHtmlEntites(message), {
          target: '_blank'
        });

        var messageHisto = message;
        if (links.length > 0) {
          var insert = '';
          var insertHisto = '';

          for (index = 0; index < links.length && index < 3; ++index) {
            if (links[index].indexOf('http') !== 0) {
              links[index] = 'http://' + links[index];
            }
            var imgHash = crypto.createHash('sha1').update('URL' + links[index]).digest('hex');
            var imgPath = './static/res/img/thumbs/' + imgHash + '.png';
            var parsedURL = url.parse(links[index]);
            if (fs.existsSync(imgPath)) {
              console.log(parsedURL);
              insert += '<span class="link-placeholder-' + imgHash + ' link-placeholder" style="background: url(/res/img/thumbs/' + imgHash + '.png);"><a target="_blank" href="' + links[index] + '"><span>' + parsedURL.host + '</span></a></span>';
              delete links[index];
            } else {
              insert += '<span class="link-placeholder-' + imgHash + ' link-placeholder">Loading preview…</span>';
            }
            insertHisto += '<span class="link-placeholder-' + imgHash + ' link-placeholder" style="background: url(/res/img/thumbs/' + imgHash + '.png);"><a target="_blank" href="' + links[index] + '"><span>' + parsedURL.host + '</span></a></span>';
          }
          message += '<div style="display: table; border-spacing:4px;">' + insert + "</div>";
          messageHisto += '<div style="display: table; border-spacing:4px;">' + insertHisto + "</div>";
        }

        audio = "/res/audio/" + messageId + ".wav";

        if (lng == 'fr') {
          commande = "espeak " + hs.session.userData.params + " -v mb/mb-fr1 --pho \"" + messageAEnregistrer + "\" 2>/dev/null | mbrola -e /usr/share/mbrola/" + hs.session.userData.voice.fr + "/" + hs.session.userData.voice.fr + " - ./static" + audio;
        } else if (lng == 'en') {
          commande = "espeak " + hs.session.userData.params + " -v mb/mb-us1 --pho \"" + messageAEnregistrer + "\" 2>/dev/null | mbrola -e /usr/share/mbrola/" + hs.session.userData.voice.en + "/" + hs.session.userData.voice.en + " - ./static" + audio;
        } else {
          commande = "espeak " + hs.session.userData.params + " -v mb/mb-en1 --pho \"" + messageAEnregistrer + "\" 2>/dev/null | mbrola -e /usr/share/mbrola/" + hs.session.userData.voice.en + "/" + hs.session.userData.voice.en + " - ./static" + audio;
        }

        exec(commande, function (error, stdout, stderr) {
          console.log("DEBUG MESSAGE " + hs.session.userData + ":" + messageAEnregistrer + ":" + commande);
          if (error !== null && config.devel === false) {
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
                message: messageHisto,
                audiofile: audio,
                color: hs.session.userData.public.color,
                time: new Date()
              });
            } catch (err) {
              console.log('send error: ' + err);
            }



            //Création et envoi des miniatures
            links.forEach(function (site) {
              if (site.indexOf('http') !== 0) {
                site = 'http://' + site;
              }
              var embeded = embed(site);
              if (typeof embeded !== 'undefined') {
                socket.broadcast.to(channel).emit('embed', {
                  id: crypto.createHash('sha1').update('URL' + site).digest('hex'),
                  code: embeded
                });
                socket.emit('embed', {
                  id: crypto.createHash('sha1').update('URL' + site).digest('hex'),
                  code: embeded
                });
              } else {

                var filename = './static' + '/res/img/thumbs/' + crypto.createHash('sha1').update('URL' + site).digest('hex') + '.png';
                var filenameBig = './static' + '/res/img/thumbs/' + crypto.createHash('sha1').update('URL' + site).digest('hex') + '_large.png';


                var pageres = new Pageres({
                    delay: 2,
                    filename: crypto.createHash('sha1').update('URL' + site).digest('hex') + '_large'
                  })
                  .src(site, ['1280x960'], {
                    crop: true
                  })
                  .dest('./static/res/img/thumbs/');

                try {
                  pageres.run(function (err) {
                    if (err) {
                      console.log("erreur gm " + err);
                      socket.broadcast.to(channel).emit('thumberr',
                        crypto.createHash('sha1').update('URL' + site).digest('hex')
                      );
                      socket.emit('thumberr',
                        crypto.createHash('sha1').update('URL' + site).digest('hex')
                      );
                      return;
                    }

                    gm(filenameBig).resize(200).write(filename, function (err) {
                      if (err) {
                        console.log("erreur gm " + err);
                        socket.broadcast.to(channel).emit('thumberr',
                          crypto.createHash('sha1').update('URL' + site).digest('hex')
                        );
                        socket.emit('thumberr',
                          crypto.createHash('sha1').update('URL' + site).digest('hex')
                        );
                      } else {
                        socket.broadcast.to(channel).emit('thumbok', {
                          url: site,
                          title: url.parse(site),
                          hash: crypto.createHash('sha1').update('URL' + site).digest('hex')
                        });
                        socket.emit('thumbok', {
                          url: site,
                          title: url.parse(site),
                          hash: crypto.createHash('sha1').update('URL' + site).digest('hex')
                        });
                      }
                    });


                    console.log('done');
                  });
                } catch (err) {
                  socket.broadcast.to(channel).emit('thumberr',
                    crypto.createHash('sha1').update('URL' + site).digest('hex')
                  );
                  socket.emit('thumberr',
                    crypto.createHash('sha1').update('URL' + site).digest('hex')
                  );
                }



                /*
                webshot(site, function (err, imageStream) {
                  console.log("Erreur webshot "+err+" IMAGE : "+JSON.stringify(imageStream));


                  if(!fs.existsSync(imageStream)) console.log("il semblerait que l'image n'existe pas");



                });*/

              }
            });


          }
        });

      }
    });
  });
};


var replaceHtmlEntites = (function (mystring) {
  return mystring.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
});

/*


var webshot = require('webshot');
var crypto = require('crypto');
var fs = require('fs'),
  gm = require('gm');

var embed = require("embed-video");

var site = process.argv[2] || 'google.fr';



console.log(site);



*/
