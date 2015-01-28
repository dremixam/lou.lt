'use strict';
// imports =====================================================================
var config = require('./config.json'); // load the config
var express = require('express'); // load express
var app = express(); // create express app
var server = require('http').createServer(app); // create webserver
var io = require('socket.io').listen(server); // create socket.io connection
var mongoose = require('mongoose'); // mongoose for mongodb
var MongoStore = require('connect-mongo')(express);
var passportSocketIo = require('passport.socketio');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('./app/models/account.js');

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
  app.use(express.session({ secret: config.secret }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);

    if (config.devel) app.use(express.logger('dev')); // log every request to the console
    else app.use(express.logger('tiny'));
  });

  passport.use(new LocalStrategy(
    function(username, password, done) {
      User.findOne({ username: username }, function (err, user) {
        if (err) { return done(err); }
        if (!user) {
          return done(null, false, { message: 'Incorrect username.' });
        }
        if (!user.validPassword(password)) {
          return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, user);
      });
    }
  ));

  //Configuration des autorisations de io
  io.use(passportSocketIo.authorize({
    cookieParser: express.cookieParser,
    key:         'express.sid',       // the name of the cookie where express/connect stores its session_id
    secret:      'session_secret',    // the session_secret to parse the cookie
    store:       sessionStore,        // we NEED to use a sessionstore. no memorystore please
    success:     function(data, accept){
      console.log('successful connection to socket.io');

      accept();
    },  // *optional* callback on success - read more below
    fail:        function(data, message, error, accept){
      if(error)
        throw new Error(message);
      console.log('failed connection to socket.io:', message);
      if(error)
        accept(new Error(message));
    },     // *optional* callback on fail/error - read more below
  }));

  if (config.devel) io.set('log level', 4);
  else io.set('log level', 1);












































  /*
  // Chargement de la page index.html
  app.get('*', function (req, res) {
    req.session.valid = true;
    res.sendfile('static/dist/home.html');


  });
*/







  /*
  // routes ======================================================================
  require('./app/routes.js')(io);
*/
  // listen (start app with node server.js) ======================================
  server.listen(config.port, config.ip);
  //console.log("App listening on " + config.ip + ":" + config.port);
});
