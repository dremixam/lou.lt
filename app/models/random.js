var fs = require('fs');
var Buffer = require('buffer').Buffer;

module.exports.get = function() {
  var string = new Buffer(32);
  var fd = fs.openSync('/dev/urandom', 'r');
  fs.readSync(fd, string, 0, 32, 0);
  fs.closeSync(fd);
  return string.toString('hex');
}
