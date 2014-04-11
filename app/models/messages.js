var lastMessages = [];
var maximum = 5;

module.exports.push = function (elt) {
  lastMessages.push(elt);
  if ( lastMessages.length > maximum ) lastMessages.shift();
}

module.exports.forEach = function (fn) {
  lastMessages.forEach(fn);
}
