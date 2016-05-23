(function () {
  'use strict';
  var DEBUG = true;

  var dateOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric'
  };

  var locale = window.navigator.userLanguage || window.navigator.language;

  function d(message) {
    if (DEBUG) {
      console.log('[DEBUG] ' + message);
    }
  }

  function e(message) {
    if (DEBUG) {
      console.error('[ERROR] ' + message);
    }
  }

  var loultApp = angular.module('loultApp', ['ngMaterial', 'ngMessages', 'ngAudio', 'luegg.directives']);

  //var audioPlayer = 0;
  var connected = false;
  var me;

  loultApp.config(['$mdThemingProvider', function ($mdThemingProvider) {
    $mdThemingProvider.theme('default')
      .primaryPalette('blue')
      .accentPalette('pink');
    $mdThemingProvider.theme('docs-dark', 'default')
      .primaryPalette('blue')
      .accentPalette('pink')
      .dark();
  }]);


  //Factory pour la gestion de la connexion socket.io

  loultApp.service('$socket', ['$rootScope',
    function ($rootScope) {
      d('connecting…');
      var socket = io.connect('', {
        'force new connection': true,
        'reconnection limit': 10000,
        'max reconnection attempts': Infinity
      });
      this.on = function (eventName, callback) {
        socket.on(eventName, function () {
          var args = arguments;
          d('recv:' + eventName + ':' + JSON.stringify(arguments));
          $rootScope.$apply(function () {
            if (callback) {
              callback.apply(socket, args);
            }
          });
        });
      };
      this.emit = function (eventName, data, callback) {
        socket.emit(eventName, data, function () {
          var args = arguments;
          d('send:' + eventName + ':' + JSON.stringify(arguments));
          $rootScope.$apply(function () {
            if (callback) {
              callback.apply(socket, args);
            }
          });
        });
      };
      this.removeAllListeners = function () {
        socket.removeAllListeners();
      };
  }]);

  // Controller pour la gestion des menus sur les cotés.
  loultApp.controller('mainCtrl', ['$scope', '$mdSidenav', function ($scope, $mdSidenav) {
    $scope.channel = window.location.pathname;
    $scope.toggleSideNav = function (name) {
      $mdSidenav(name).toggle();
    };
  }]);

  // Controller pour la liste des utilisateurs
  loultApp.controller('UserListCtrl', ['$scope', '$socket',
    function ($scope, $socket) {
      $scope.userlist = [];

      // ajouter a la liste les nouveaux clients (il faudra revoir ici pour éviter les fantomes)
      $socket.on('nouveau_client', function (data) {
        d('nouveau client');
        var result = $scope.userlist.filter(function (obj) {
          return obj.uuid === data.uuid;
        });
        if (result.length === 1) {
          result[0].count++;
        } else if (result.length === 0) {
          data.count = 1;
          data.muted = false;
          $scope.userlist.push(data);
        } else {
          location.reload();
        }
      });

      // Réinitialisation de la liste des utilisateur lorsqu'on se connecte
      $socket.on('connecting', function () {
        $scope.userlist = [];
      });

      // Mise a jour d'un utilisateur'
      $socket.on('update_user', function (data) {
        var result = $scope.userlist.filter(function (obj) {
          return obj.uuid === data.uuid;
        });
        if (result.length === 1) {
          result[0] = data;
        }
      });

      // Supression de la liste des utilisateurs qui se déconnectent.
      $socket.on('disconnected', function (data) {
        var result = $scope.userlist.filter(function (obj) {
          return obj.uuid === data.uuid;
        });
        if (me !== undefined && data.uuid !== me.uuid) {
          if (result[0].count > 1) {
            result[0].count--;
          } else if (result[0].count === 1) {
            $scope.userlist.splice($scope.userlist.indexOf(result[0]), 1);
          }
        }
      });

      // On vient de se connecter, on initialise tout
      $socket.on('connected', function (data) {
        me = data;
        var result = $scope.userlist.filter(function (obj) {
          return obj.uuid === data.uuid;
        });
        if (result.length === 1) {
          result[0].count++;
        } else if (result.length === 0) {
          data.count = 1;
          $scope.userlist.push(data);
        } else {
          location.reload();
        }
        connected = true;
      });

  }]);

  loultApp.controller('MessageListCtrl', ['$scope', '$socket', 'ngAudio',
    function ($scope, $socket, ngAudio) {
      $scope.messagelist = [];

      $socket.on('message', function (data) {

        if ($scope.pushMessage({
            'premier': data.user.pseudo,
            'paragraphes': [{
              text: data.message,
              class: '',
              count: 1
            }],
            'color': data.color,
            'date': new Date(),
            'uuid': data.user.uuid,
            'avatar': '/res/charapic/' + data.user.avatar
          })) {
          ngAudio.play(data.audiofile);
        }
      });

      $socket.on('lastmessage', function (data) {
        $scope.pushMessage({
          'premier': data.user.pseudo,
          'paragraphes': [{
            text: data.message,
            class: 'old',
            count: 1
            }],
          'color': data.color,
          'date': new Date(Date.parse(data.time)),
          'uuid': data.user.uuid,
          'avatar': '/res/charapic/' + data.user.avatar
        });
      });

      $socket.on('ownmessage', function (data) {
        //document.getElementById('audio' + (audioPlayer % 10)).src = data.audiofile;
        //document.getElementById('audio' + (audioPlayer % 10)).play();
        //audioPlayer++;
        if ($scope.pushMessage({
            'premier': data.user.pseudo,
            'paragraphes': [{
              text: data.message,
              class: 'own',
              count: 1
            }],
            'color': data.color,
            'date': new Date(),
            'uuid': data.user.uuid,
            'avatar': '/res/charapic/' + data.user.avatar
          })) {
          ngAudio.play(data.audiofile);
        }
      });

      $socket.on('errormsg', function (data) {
        //document.getElementById('message').placeholder = 'Message...';
        $scope.pushMessage({
          'premier': '[Error]',
          'paragraphes': [{
            text: data.message,
            class: 'error',
            count: 1
            }],
          'color': null,
          'date': new Date(),
          'uuid': 'error',
          'avatar': '/lib/material-design-icons/alert/svg/design/ic_error_24px.svg'
        });
      });

      $socket.on('info', function (data) {
        $scope.pushMessage({
          'premier': '[Info]',
          'paragraphes': [{
            text: data,
            class: 'info',
            count: 1
            }],
          'color': null,
          'date': new Date(),
          'uuid': 'info',
          'avatar': '/lib/material-design-icons/action/svg/design/ic_info_24px.svg'
        });
      });

      $socket.on('disconnect', function () {
        $scope.pushMessage({
          'premier': '[Info]',
          'paragraphes': [{
            text: 'Waiting for new connection…',
            class: 'join',
            count: 1
            }],
          'color': null,
          'date': new Date(),
          'uuid': 'info',
          'avatar': '/lib/material-design-icons/action/svg/design/ic_info_24px.svg'
        });
      });

      $socket.on('connecting', function () {
        $socket.emit('join', location.pathname);
        $scope.pushMessage({
          'premier': '[Info]',
          'paragraphes': [{
            text: 'Connecting…',
            class: 'join',
            count: 1
            }],
          'color': null,
          'date': new Date(),
          'uuid': 'info',
          'avatar': '/lib/material-design-icons/action/svg/design/ic_info_24px.svg'
        });
      });

      $socket.on('connected', function (data) {
        $scope.pushMessage({
          'premier': '[Info]',
          'paragraphes': [{
            text: 'Connected as ' + data.pseudo + '.',
            class: 'join',
            count: 1
            }],
          'color': null,
          'date': new Date(),
          'uuid': 'info',
          'avatar': '/lib/material-design-icons/action/svg/design/ic_info_24px.svg'
        });
      });

      $scope.pushMessage = function (messageObject) {
        var _return = true;
        var lastMessage = $scope.messagelist[$scope.messagelist.length - 1];
        if (typeof lastMessage !== 'undefined' && lastMessage.uuid === messageObject.uuid) {
          // Si le nouveau message a le meme auteur que le précédent

          //On récupère le dernier paragraphe du message
          var lastParagraphe = lastMessage.paragraphes[lastMessage.paragraphes.length - 1];


          if (lastParagraphe.text === messageObject.paragraphes[0].text) {
            // Si le dernier paragraphe est identique au nouveau message, on incrémente juste son compteur
            lastParagraphe.count++;
            _return = false;
          } else {
            // Sinon on ajoute le message comme nouveau paragraphe au message précédent
            lastMessage.paragraphes.push(messageObject.paragraphes[0]);
          }
          if (messageObject.date) {
            //Si le message est reçu avec une heure, on met a jour en utilisant l'heure reçue
            lastMessage.date = new Date(Date.parse(messageObject.date)).toLocaleString(locale, dateOptions);
          }
        } else {
          messageObject.date = new Date(Date.parse(messageObject.date)).toLocaleString(locale, dateOptions);
          if ( $scope.messagelist.length > 100) $scope.messagelist.shift();
          $scope.messagelist.push(messageObject);
        }
        return _return;
      };
  }]);


  loultApp.controller('TitleCtrl', ['$scope', function ($scope) {
    $scope.channel = location.pathname;
  }]);

  loultApp.controller('TextBoxCtrl', ['$scope', '$socket',
    function ($scope, $socket) {
      $scope.check = function () {
        if ($scope.textMessage && !FloodDetector.evaluate($scope.textMessage)) {
          $scope.messageForm.message.$error.flood = true;
        } else {
          if ($scope.messageForm.message.$error.flood) {
            delete($scope.messageForm.message.$error.flood);
          }
        }
      };
      // Lorsqu'on envoie le formulaire, on transmet le message et on l'affiche sur la page
      $scope.submit = function () {
        d('valudation du formulaire');
        if (Object.keys($scope.messageForm.message.$error).length > 0) {
          d('il y a une erreur on valide pas');
          return;
        }
        var message = $scope.textMessage;
        if (!message || message.length < 1) {
          $scope.textMessage = '';
          return false;
        }
        var first = message.split(' ')[0];
        var next = message.substr(message.indexOf(' ') + 1);
        if (first.charAt(0) === '/') {
          d('commande ' + first.substring(1));
          $socket.emit('command', {
            cmd: first.substring(1),
            args: next
          });
        } else {
          d('message ' + message);
          $socket.emit('message', message); // Transmet le message aux autres
        }
        $scope.textMessage = '';

        return false; // Permet de bloquer l'envoi 'classique' du formulaire
      };

  }]);

})();
