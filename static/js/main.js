var audioPlayer = 0;
// Connexion à socket.io
var socket = io.connect('/');

var connected = false;
var userlist = {};
var ignorelist = [];
var me = undefined;

insereLigne("[Info]", "info", 'Connexion en cours…', null);

// Quand on reçoit un message, on l'insère dans la page
socket.on('connected', function(data) {
  me = data;
  insereLigne("[Info]", "info", 'Votre pseudo est '+data.pseudo+'', null);
  $('#message').removeAttr("disabled").focus();
  connected = true;
})

// Quand on reçoit un message, on l'insère dans la page
socket.on('message', function(data) {
  if (ignorelist.indexOf(data.user.uuid) == -1) {
    insereMessage(data.user.pseudo, data.message, data.color);
    document.getElementById("audio"+(audioPlayer%10)).src = data.audiofile;
    document.getElementById("audio"+(audioPlayer%10)).play();
    audioPlayer++;
  }
})

// Historique des derniers messages
socket.on('lastmessage', function(data) {
  if (ignorelist.indexOf(data.pseudo) == -1) {
    insereLastMessage(data.pseudo, data.message, data.color);
  }
})

socket.on('ownmessage', function(data) {
  document.getElementById("message").placeholder = "Message...";
  insereOwnMessage(data.user.pseudo, data.message, data.color);
  document.getElementById("audio"+(audioPlayer%10)).src = data.audiofile;
  document.getElementById("audio"+(audioPlayer%10)).play();
  audioPlayer++;
})

socket.on('debug', function(message) {
  insereDebug(message);
})

socket.on('errormsg', function(data) {
  document.getElementById("message").placeholder = "Message...";
  insereErreur(data.message);
})

socket.on('connecting', function(){
  userlist = {};
})

// Quand un nouveau client se connecte, on affiche l'information
socket.on('nouveau_client', function(data) {
  if ( userlist[data.uuid] !== undefined ) {
    userlist[data.uuid].count++;
  } else {
    userlist[data.uuid] = data;
    userlist[data.uuid].count = 1;
    if (connected) insereLigne("[Info]", "join", 'Un '+data.pseudo + ' sauvage apparait !', null);
  }
  updateUserList();
})

socket.on('info', function(data) {
  insereLigne("[Info]", "info", data, null);
})


socket.on('attack', function(data) {
  if (connected) insereLigne("[Attaque]", "attack", data, null);
})

// Quand un nouveau client se connecte, on affiche l'information
socket.on('disconnected', function(data) {
  if (me !== undefined && data.uuid != me.uuid) {
    if ( userlist[data.uuid].count > 1 ) {
      userlist[data.uuid].count--;
    } else {
      delete userlist[data.uuid];
      insereLigne("[Info]", "part", 'Le '+ data.pseudo + ' sauvage s\'enfuit !', null);
    }
    updateUserList();
  }
})

// Lorsqu'on envoie le formulaire, on transmet le message et on l'affiche sur la page
$('#formulaire_chat').submit(function () {
  var message = $('#message').val();
  var first = message.split(' ')[0];
  var next = message.substr(message.indexOf(" ") + 1);
  if (first.charAt(0) == "/") {
    socket.emit('command', {cmd: first.substring(1), args: next});
  } else {
    socket.emit('message', message); // Transmet le message aux autres
  }

  document.getElementById("message").placeholder = "Envoi...";
  $('#message').val('').focus(); // Vide la zone de Chat et remet le focus dessus
  return false; // Permet de bloquer l'envoi "classique" du formulaire
});

function updateUserList() {
  liste = $("<ul>");
  for (key in userlist) {
    element = userlist[key];
    if (ignorelist.indexOf(element.uuid) == -1) {
      liste.append('<li>\
      <i class="fa fa-volume-up fa-fw" style="margin-right: 7px; cursor: pointer;" onclick="toggleIgnore(\''+element.uuid+'\', this)"></i>\
      <i class="fa fa-heart-o" style="color: #fcd2f3;"></i> <small style="color: #fcd2f3; font-size: 10px; margin-right: 7px;">0</small>\
      <i class="fa fa-thumbs-o-down" style="color: red;"></i> <small style="color: red; font-size: 10px; margin-right: 7px;">0</small>\
      <span style="color: '+element.color+';">'+element.pseudo+"</span>\
      </li>");
    } else {
      liste.append('<li style=" color: #c0c0c0;">\
      <i class="fa fa-times-circle fa-fw" style="margin-right: 7px; cursor: pointer;" onclick="toggleIgnore(\''+element.uuid+'\', this)"></i>\
      <i class="fa fa-heart-o" style="color: #fcd2f3;"></i> <small style="color: #fcd2f3; font-size: 10px; margin-right: 7px;">0</small>\
      <i class="fa fa-thumbs-o-down" style="color: red"></i> <small style="color: red; font-size: 10px; margin-right: 7px;">0</small>\
      <span style="color: '+element.color+';">'+element.pseudo+"</span>\
      </li>");
    }
  }
  $("#userlist").html(liste);
}


/*
<span class="fa-stack fa-lg">
<i class="fa fa-camera fa-stack-1x"></i>
<i class="fa fa-ban fa-stack-2x text-danger"></i>
</span>
*/

function toggleIgnore(pseudo, elt){
  if (elt !== null)
  if (ignorelist.indexOf(pseudo) == -1) {
    ignorelist.push(pseudo);
    elt.parentNode.style.color="#c0c0c0";
    elt.className="fa fa-times-circle fa-fw";
  } else {
    var i = ignorelist.indexOf(pseudo);
    ignorelist.splice(i, 1);
    elt.parentNode.style.color="black";
    elt.className="fa fa-volume-up fa-fw";
  }
  else
  if (ignorelist.indexOf(pseudo) == -1) {
    ignorelist.push(pseudo);
    updateUserList();
  } else {
    var i = ignorelist.indexOf(pseudo);
    ignorelist.splice(i, 1);
    updateUserList();
  }


}
toggleMute = function() {
  for ( i = 0 ; i < 10 ; i ++) {
    if (document.getElementById("audio"+i).volume == 0 ) {
      document.getElementById("audio"+i).volume = 1;
      document.getElementById("globalMute").style.color="#fff";
      document.getElementById("globalMute").className="fa fa-volume-up fa-fw";
    } else {
      document.getElementById("audio"+i).volume = 0;
      document.getElementById("globalMute").style.color="#c0c0c0";
      document.getElementById("globalMute").className="fa fa-volume-off fa-fw";
    }
  }
}

function currentTime() {
  var currentTime = new Date();
  var hours = currentTime.getHours();
  var minutes = currentTime.getMinutes();
  var seconds = currentTime.getSeconds();
  if (minutes < 10){
    minutes = "0" + minutes;
  }
  if (seconds < 10){
    seconds = "0" + seconds;
  }
  var v = hours + ":" + minutes + ":" + seconds + " ";
  if(hours > 11){
    v+="PM";
  } else {
    v+="AM"
  }
  return v;
}

function isCharacterKeyPress(evt) {
    if (typeof evt.which == "undefined") {
        // This is IE, which only fires keypress events for printable keys
        return true;
    } else if (typeof evt.which == "number" && evt.which > 0) {
        // In other browsers except old versions of WebKit, evt.which is
        // only greater than zero if the keypress is a printable key.
        // We need to filter out backspace and ctrl/alt/meta key combinations
        return !evt.ctrlKey && !evt.metaKey && !evt.altKey && evt.which != 8;
    }
    return false;
}

var input = document.getElementById("message");
document.onkeypress = function(evt) {
    evt = evt || window.event;
    if (isCharacterKeyPress(evt)) {
        // Do your stuff here
        if (document.getElementById("message") !== document.activeElement) document.getElementById("message").focus();
    }
}
