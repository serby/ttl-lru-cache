var extend = require('lodash.assign')
    , EventEmitter = require('events').EventEmitter

module.exports = function(opts) {

  var cache
    , lru
    , lruId = 0
    , gcHandle
    , instance = new EventEmitter()
    , options = extend(
      { gcInterval: 30000 // How often GC happens
      , maxLength: 1000 // Maximum number of items that can be held in the cache by default.
      , lruWriteCleanUp: 100 // Run the LRU clean up every 'lruWriteCleanUp' writes
      }, opts)

  function clear() {
    cache = {}
    lru = {}
  }

  function del(key) {
    var item = cache[key]
    if (item) {
      delete lru[item.lru];
      delete cache[key]
    }
  }

  function garbageCollection() {
    Object.keys(cache).forEach(function(key) {
      var item = cache[key]
      if (item.expire <= Date.now()) {
        expire(key, item)
      }
    })
    lruClean()
  }

  function lruClean() {
    var overage = Object.keys(cache).length - options.maxLength
      , cacheId
      , lruKeys = Object.keys(lru)
      , lruKey

    for (var i = 0; i < overage; i++) {
      lruKey = lruKeys.shift()
      cacheId = lru[lruKey];
      delete lru[lruKey];
      delete cache[cacheId]
    }
  }

  function expire(key, item) {
    del(key)
    instance.emit('expired', key, item.value)
  }

  clear()
  gcHandle = setInterval(garbageCollection, options.gcInterval)

  extend(instance, {
    set: function(key, value, ttl) {

      if (typeof key === 'undefined') {
        throw new Error('Invalid key undefined')
      }
      var item =  { value: value, lru: lruId }
      if (ttl) {
        item.expire = Date.now() + ttl
      }
      cache[key] = item
      lru[lruId] = key
      lruId++
      if (lruId % options.lruWriteCleanUp === 0) {
        lruClean()
      }
    },
    get: function(key) {
      var response
        , item = cache[key]

      if (item) {
        if ((item.expire) && (item.expire < Date.now())) {
          expire(key, item)
          return undefined
        }

        response = item.value;
        lru[lruId] = key
        item.lru = lruId
        lruId++
      }
      return response
    },
    del: del,
    clear: clear,
    gc: lruClean,
    size: function() {
      garbageCollection()
      return Object.keys(cache).length
    },
    dump: function() {
      return cache
    },
    close: function() {
      clearInterval(gcHandle)
    }
  })

  return instance
}