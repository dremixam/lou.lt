var lastMessages = {};
var maximum = 5;

module.exports.push = function (lng, elt) {
  if ( lastMessages[lng] === undefined ) lastMessages[lng] = [];

  lastMessages[lng].push(elt);
  if ( lastMessages.length > maximum ) lastMessages.shift();
}

module.exports.forEach = function (lng, fn) {
  if ( lastMessages[lng] === undefined ) lastMessages[lng] = [];
  lastMessages[lng].forEach(fn);
}
