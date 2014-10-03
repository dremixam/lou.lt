var lastMessages = {};
var maximum = 5;

module.exports.push = function (channel, elt) {
  if (lastMessages[channel] === undefined) lastMessages[channel] = [];

  lastMessages[channel].push(elt);
  if (lastMessages.length > maximum) lastMessages.shift();
}

module.exports.forEach = function (channel, fn) {
  if (lastMessages[channel] === undefined) lastMessages[channel] = [];
  lastMessages[channel].forEach(fn);
}
