var lastMessages = {};
var maximum = 10;

module.exports.push = function (channel, elt) {
  //console.log('message:push');
  if (lastMessages[channel] === undefined) lastMessages[channel] = [];

  lastMessages[channel].push(elt);
  if (lastMessages[channel].length > maximum) lastMessages[channel].shift();
}

module.exports.forEach = function (channel, fn) {
  if (lastMessages[channel] === undefined) lastMessages[channel] = [];
  lastMessages[channel].forEach(fn);
}
