'use strict';
// imports =====================================================================
var config = require('./config.json'); // load the config
var express = require('express'); // load express
var app = express(); // create express app
var server = require('http').createServer(app); // create webserver
var io = require('socket.io').listen(server); // create socket.io connection
var mongoose = require('mongoose'); // mongoose for mongodb
var MongoStore = require('connect-mongo')(express);

var connect = require('connect');
var session = require('express-session');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('./app/models/account.js');
var cookie = require('cookie');

// configuration ===============================================================
mongoose.connect('mongodb://' + config.db.host + '/' + config.db.name, function () { // connect to mongoDB database

  //Création du store
  var sessionStore = new MongoStore({
    host: config.db.host,
    db: config.db.name,
    collection: config.db.sessionColl,
    stringify: false
  });

  app.configure(function () {
    app.use(express.favicon(__dirname + '/static/dist/favicon.png'));
    app.use(express.static(__dirname + '/static/dist')); // set the static files location /public/img will be /img for users

    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(express.session({
      secret: config.secret
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);

    if (config.devel) app.use(express.logger('dev')); // log every request to the console
    else app.use(express.logger('tiny'));
  });

  passport.use(new LocalStrategy(
    function (username, password, done) {
      User.findOne({
        username: username
      }, function (err, user) {
        if (err) {
          return done(err);
        }
        if (!user) {
          return done(null, false, {
            message: 'Incorrect username.'
          });
        }
        if (!user.validPassword(password)) {
          return done(null, false, {
            message: 'Incorrect password.'
          });
        }
        return done(null, user);
      });
    }
  ));

  io.set('authorization', function (handshakeData, accept) {
    if (handshakeData.headers.cookie) {
      handshakeData.cookie = cookie.parse(handshakeData.headers.cookie);
      if (handshakeData.cookie[config.sessIdName] === undefined) return accept('Cookie is invalid.', false);
      handshakeData.sessionID = connect.utils.parseSignedCookie(handshakeData.cookie[config.sessIdName], config.secret);
      if (handshakeData.cookie[config.sessIdName] === handshakeData.sessionID) {
        return accept('Cookie is invalid.', false);
      }
    } else {
      return accept('No cookie transmitted.', false);
    }
    handshakeData.sessionStore = sessionStore;
    sessionStore.load(handshakeData.sessionID, function (err, sess) {
      if (err || !sess || !sess.valid) {
        accept('Error when creating session: ' + err, false);
      } else {
        handshakeData.session = sess;
        accept(null, true);
      }
    });
  });

  app.get('*', function (req, res) {
    req.session.valid = true;
    res.sendfile(__dirname + '/static/dist/home.html');
  });

  if (config.devel) io.set('log level', 4);
  else io.set('log level', 1);

  // routes ======================================================================
  require('./app/routes.js')(io);
  // listen (start app with node server.js) ======================================
  server.listen(config.port, config.ip);
  console.log('App listening on ' + config.ip + ':' + config.port);
});
