var loultApp = angular.module('loultApp', ['ngMaterial']);

var audioPlayer = 0;
var connected = false;
var ignorelist = [];
var me;

//Factory pour la gestion de la connexion socket.io

loultApp.service('$socket', ['$rootScope',
  function ($rootScope) {
    'use strict';
    var socket = io.connect('/', {
      'force new connection': true,
      'reconnection limit': 10000,
      'max reconnection attempts': Infinity
    });
    this.on = function (eventName, callback) {
      socket.on(eventName, function () {
        var args = arguments;
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

loultApp.controller('UserListCtrl', ['$scope', '$socket',
  function ($scope, $socket) {
    'use strict';
    $scope.userlist = [];

    /*
    //Gestion de la langue à revoir
    $scope.language = window.location.hostname.split('.')[0];
    if (['fr', 'en'].indexOf($scope.language) === -1) {
      $scope.language = 'en'; //default language if language is not recognized
    }
    */
    $scope.language = 'fr';
    //ÇA SERAIT BIEN DE GÉRER ÇA DANS LE FACTORY
    $socket.on('connect', function () {
      $socket.emit('join', location.pathname);
    });

    /*
// Ça sera à gérer dans le factory
    $socket.on('disconnect', function () {
      connected = false;
      setTimeout(function () {
        socket = io.connect('/');
      }, 3000);
    });
*/

    /*
    // Ça faut le gérer aussi dans le factory
    socket.on('error', function () {
      connected = false;
      insereLigne('[Info]', 'join', 'Waiting 3s for new connection…', null);
      setTimeout(function () {
        socket = io.connect('/');
      }, 3000);
    });

*/

    //ÇA A GÉRER DANS LE CONTROLEUR DE ZONE MESSAGE
    $socket.on('thumbok', function (data) {
      var nodelist = document.getElementsByClassName('link-placeholder-' + data.hash);
      Array.prototype.forEach.call(nodelist, function (elt) {
        elt.style.backgroundImage = 'url(/res/img/thumbs/' + data.hash + '.png)';
        elt.innerHTML = '<a target="_blank" href="' + data.url + '"><span>' + data.title.hostname + '</span></a>';
      });

    });

    // IDEM CONTROLEUR ZONE MESSAGE
    $socket.on('thumberr', function (data) {
      var nodelist = document.getElementsByClassName('link-placeholder-' + data);
      Array.prototype.forEach.call(nodelist, function (elt) {
        elt.innerHTML = 'Can&apos;t load preview';
      });
    });

    //À SCINDER EN DEUX POUR GÉRER ICI LES CHANGEMENTS SUR LA LISTE ET DANS LA ZONE MESSAGE L'AFFICHAGE DU MESSAGE
    // Quand un nouveau client se connecte, on affiche l'information
    $socket.on('nouveau_client', function (data) {

      var result = $scope.userlist.filter(function (obj) {
        return obj.uuid === data.uuid;
      });
      if (result.length === 1) {
        result[0].count++;
      } else if (result.length === 0) {
        data.count = 1;
        data.muted = false;
        $scope.userlist.push(data);
        if (me !== undefined) {
          if ($scope.language === 'fr') {
            //insereLigne('[Info]', 'join', 'Un ' + data.pseudo.fr + ' sauvage apparait !', null);
          } else {
            //insereLigne('[Info]', 'join', 'Wild ' + data.pseudo.en + ' appeared!', null);
          }
        }
      } else {
        location.reload();
      }

    });

    //ÇA DANS LA ZONE MESSAGE
    $socket.on('connecting', function () {

      //insereLigne('[Info]', 'join', 'Connecting…', null);
      $scope.userlist = [];

    });

    //ÇA RESTE ICI
    $socket.on('update_user', function (data) {
      var result = $scope.userlist.filter(function (obj) {
        return obj.uuid === data.uuid;
      });
      if (result.length === 1) {
        result[0] = data;
      }

    });

    //ÇA À SCINDER EN DEUX
    // Quand un nouveau client se connecte, on affiche l'information
    $socket.on('disconnected', function (data) {

      var result = $scope.userlist.filter(function (obj) {
        return obj.uuid === data.uuid;
      });
      if (me !== undefined && data.uuid !== me.uuid) {
        if (result[0].count > 1) {
          result[0].count--;
        } else if (result[0].count === 1) {
          if ($scope.language === 'fr') {
            //insereLigne('[Info]', 'part', 'Le ' + data.pseudo.fr + ' sauvage s\'enfuit !', null);
          } else {
            //insereLigne('[Info]', 'part', 'Wild ' + data.pseudo.en + ' fled!', null);
          }
          $scope.userlist.splice($scope.userlist.indexOf(result[0]), 1);
        }
      }

    });

    //ÇA À SCINDER EN DEUX
    $socket.on('connected', function (data) {


      me = data;
      //insereLigne('[Info]', 'join', 'Connected as ' + data.pseudo.fr, null);
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

      //$('#message').removeAttr('disabled').focus();




      connected = true;
    });

}]);

loultApp.controller('MessageListCtrl', ['$scope', '$socket',
  function ($scope, $socket) {
    'use strict';
    $scope.messagelist = [];


    $scope.glued = true;

    $socket.on('message', function (data) {
      var result = $scope.userlist.filter(function (obj) {
        return obj.uuid === data.user.uuid;
      });
      if (!result[0].muted) {
        $scope.pushMessage({
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
        });

        document.getElementById('audio' + (audioPlayer % 10)).src = data.audiofile;
        document.getElementById('audio' + (audioPlayer % 10)).play();
        audioPlayer++;
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
      //document.getElementById('message').placeholder = 'Message...';
      document.getElementById('audio' + (audioPlayer % 10)).src = data.audiofile;
      document.getElementById('audio' + (audioPlayer % 10)).play();
      audioPlayer++;
      $scope.pushMessage({
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
      });
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
        'avatar': '/lib/material-design-icons/action/svg/design/ic_info_24px.svg'
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
      var lastMessage = $scope.messagelist[$scope.messagelist.length - 1];
      if (typeof lastMessage !== 'undefined' && lastMessage.uuid === messageObject.uuid) {
        var lastParagraphe = lastMessage.paragraphes[lastMessage.paragraphes.length - 1];
        if (lastParagraphe.text === messageObject.paragraphes[0].text) {
          lastParagraphe.count++;
        } else {
          lastMessage.paragraphes.push(messageObject.paragraphes[0]);
        }
        lastMessage.date = new Date();
      } else {
        $scope.messagelist.push(messageObject);
      }
    }
}]);



loultApp.controller('TextBoxCtrl', ['$scope', '$socket',
  function ($scope, $socket) {
    'use strict';
    // Lorsqu'on envoie le formulaire, on transmet le message et on l'affiche sur la page
    $scope.submit = function () {
      var message = $scope.textMessage;
      var first = message.split(' ')[0];
      var next = message.substr(message.indexOf(' ') + 1);
      if (first.charAt(0) === '/') {
        $socket.emit('command', {
          cmd: first.substring(1),
          args: next
        });
      } else {
        $socket.emit('message', message); // Transmet le message aux autres
      }
      $scope.textMessage = '';

      return false; // Permet de bloquer l'envoi 'classique' du formulaire
    };

}]);



function isCharacterKeyPress(evt) {
  'use strict';
  if (typeof evt.which === 'undefined') {
    // This is IE, which only fires keypress events for printable keys
    return true;
  } else if (typeof evt.which === 'number' && evt.which > 0) {
    // In other browsers except old versions of WebKit, evt.which is
    // only greater than zero if the keypress is a printable key.
    // We need to filter out backspace and ctrl/alt/meta key combinations
    return !evt.ctrlKey && !evt.metaKey && !evt.altKey && evt.which !== 8;
  }
  return false;
}


document.onkeypress = function (evt) {
  'use strict';
  evt = evt || window.event;
  if (isCharacterKeyPress(evt)) {
    // Do your stuff here
    /*
    if (document.getElementById('message') !== document.activeElement) {
      document.getElementById('message').focus();
    }*/
  }
};
