# ttl-lru-cache - A fast in memory cache with TTL and LRU support

[![build status](https://secure.travis-ci.org/serby/ttl-lru-cache.png)](http://travis-ci.org/serby/ttl-lru-cache) [![Greenkeeper badge](https://badges.greenkeeper.io/serby/ttl-lru-cache.svg)](https://greenkeeper.io/)

## Installation

      npm install ttl-lru-cache

## Usage

```js

var cache = require('ttl-lru-cache')({ maxLength: 100 });

cache.set('a', 'Hello');

var a = cache.get('a');

// a = 'Hello'

// TTL Example
cache.set('b', 'Hello', 1000); // Add TTL in ms
var b = cache.get('b');
// b = 'Hello'

setTimeout(function() {
  var b = cache.get('b');
// b = undefined
}, 2000);

// Events
cache.set('c', 'Hello', 1000); // Add TTL in ms
cache.on('expired', function(key, value){ console.log('Expired', key, 'who had the value:', value); });

setTimeout(function() {
  var c = cache.get('c');
  // => Expired c who had the value: Hello
}, 2000);

```

## Benchmark against lru-cache

      npm install
      make bench

## Credits
[Paul Serby](https://github.com/serby/) follow me on twitter [@serby](http://twitter.com/serby)

## Licence
Licenced under the [New BSD License](http://opensource.org/licenses/bsd-license.php)
