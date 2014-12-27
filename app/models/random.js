'use strict';


function randomIntInc(low, high) {
  return Math.floor(Math.random() * (high - low + 1) + low);
}

module.exports.get = function () {
  return randomIntInc(1, 99999999999999999999999999999999).toString(36);
};
