var lastMessages = {};
var maximum = 5;

module.exports.push = function (channel, elt) {
  //console.log('message:push');
  if (lastMessages[channel] === undefined) lastMessages[channel] = [];

  lastMessages[channel].push(elt);
  if (lastMessages.length > maximum) lastMessages.shift();
  //console.log(JSON.stringify(lastMessages));
}

module.exports.forEach = function (channel, fn) {
  //console.log('message:foreach');
  //console.log(JSON.stringify(lastMessages));
  if (lastMessages[channel] === undefined) lastMessages[channel] = [];
  lastMessages[channel].forEach(fn);
}
