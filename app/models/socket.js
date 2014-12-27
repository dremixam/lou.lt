'use strict';
module.exports = {
  socket: {},
  push: function (newSocketID) {
    if (typeof this.socket[newSocketID] === 'undefined') {
      this.socket[newSocketID] = {};
    }
    //console.log(this.socket);
  },
  remove: function (socketID) {
    if (typeof this.socket[socketID] !== 'undefined') {
      delete this.socket[socketID];
    }
  },
  getSocketById: function (id) {
    if (typeof this.socket[id] !== 'undefined') {
      return this.socket[id];
    }
  },
  set: function (id, key, value) {
    if (typeof this.socket[id] !== 'undefined') {
      this.socket[id][key] = value;
    }
  },
  get: function (id, key) {
    //console.log(this.socket);
    if (typeof this.socket[id] !== 'undefined') {
      return this.socket[id][key];
    }

  }
};
