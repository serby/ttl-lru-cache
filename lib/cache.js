var _ = require('lodash')
    , EventEmitter = require('events').EventEmitter;

module.exports = function(options) {

  var cache
    , lru
    , lruId = 0
    , gcHandle
    , instance
    ;

  options = _.extend({
    gcInterval: 30000, // How often GC happens
    maxLength: 1000 // Maximum number of items that can be held in the LRU cache by default.
  }, options);

  function clear() {
    cache = {};
    lru = [];
  }

  function hasOwn (object, key) {
    return object.hasOwnProperty(key);
  }

  function del(key) {
    var item = cache[key];
    if (item) {

      delete lru[item.lru];
      delete cache[key];
    }
  }

  function garbageCollection() {
    Object.keys(cache).forEach(function(key) {
      var item = cache[key];
      if (item.expire <= Date.now()) {
        expire(key, item);
      }
    });
    lruClean();
  }

  function lruClean() {
    var overage = Object.keys(cache).length - options.maxLength
      , cacheId
      , lruKeys = Object.keys(lru)
      ;

    for (var i = 0; i < overage; i++) {
      cacheId = lru.shift();
      var item = cache[cacheId];
      delete cache[cacheId];
    }
  }

  function expire(key, item) {
    del(key);
    instance.emit("expired", key, item.value);
  }

  clear();
  gcHandle = setInterval(garbageCollection, options.gcInterval);

  instance = {
    set: function(key, value, ttl) {

      if (typeof key === 'undefined') {
        throw new Error('Invalid key undefined');
      }
      var item =  { value: value, lru: lruId };
      if (ttl) {
        item.expire = Date.now() + ttl;
      }
      cache[key] = item;
      lru[lruId] = key;
      lruId++;
      if (lruId % 100 === 0) {
        lruClean();
      }
    },
    get: function(key) {
      var response
        , item = cache[key];

      if (item) {
        if ((item.expire) && (item.expire < Date.now())) {
          expire(key, item);
          return undefined;
        }

        response = item.value;

        delete lru[item.lruId];
        lru[lruId] = key;
        item.lruId = lruId;
        lruId++;
      }
      return response;
    },
    del: del,
    clear: clear,
    size: function() {
      garbageCollection();
      return Object.keys(cache).length;
    },
    dump: function() {
      return cache;
    },
    close: function() {
      clearInterval(gcHandle);
    }
  };

  instance = _.extend(instance, new EventEmitter());

  return instance;
};
