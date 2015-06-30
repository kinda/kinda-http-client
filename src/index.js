'use strict';

let _ = require('lodash');
let originalRequest = require('request');
let KindaObject = require('kinda-object');

let KindaHTTPClient = KindaObject.extend('KindaObject', function() {
  // options:
  //   headers: headers to add to all requests
  //   json: if true, automatically JSON.stringify/parse request body
  //     and set appropriate headers
  //   timeout: maximum milliseconds before throwing an error. Default: 30000.
  this.creator = function(options = {}) {
    _.defaults(options, {
      timeout: 30000
    });
    this.defaultOptions = options;
  };

  // options:
  //   url: request URL
  //   method: request method
  //   headers: request headers
  //   body: request body
  //   json: if true, automatically JSON.stringify/parse request body
  //     and set appropriate headers
  //   timeout: maximum milliseconds before throwing an error. Default: 30000.
  this.request = function(options, body) {
    options = this.normalizeArguments(options, body);
    return this._request(options);
  };

  this.get = function(options) {
    options = this.normalizeArguments(options);
    options.method = 'GET';
    return this._request(options);
  };

  this.post = function(options, body) {
    options = this.normalizeArguments(options, body);
    options.method = 'POST';
    return this._request(options);
  };

  this.put = function(options, body) {
    options = this.normalizeArguments(options, body);
    options.method = 'PUT';
    return this._request(options);
  };

  this.del = function(options) {
    options = this.normalizeArguments(options);
    options.method = 'DELETE';
    return this._request(options);
  };

  this.patch = function(options, body) {
    options = this.normalizeArguments(options, body);
    options.method = 'PATCH';
    return this._request(options);
  };

  this.head = function(options) {
    options = this.normalizeArguments(options);
    options.method = 'HEAD';
    return this._request(options);
  };

  this.options = function(options) {
    options = this.normalizeArguments(options);
    options.method = 'OPTIONS';
    return this._request(options);
  };

  this._request = function(options) {
    let opts = _.pick(options, [
      'url', 'method', 'headers', 'body', 'json', 'timeout', 'encoding'
    ]);
    opts.withCredentials = false; // Fix https://github.com/request/request/issues/986
    return function(cb) {
      originalRequest(opts, function(err, res) {
        if (err) {
          return cb(new Error('HTTP Request Error: ' + err.message));
        }
        cb(null, res);
      });
    };
  };

  this.normalizeArguments = function(methodOptions, body) {
    if (!methodOptions) throw new Error('invalid options');
    if (typeof methodOptions === 'string') methodOptions = { url: methodOptions };
    let options = _.clone(this.defaultOptions);
    _.merge(options, methodOptions);
    if (body != null) options.body = body;
    return options;
  };
});

module.exports = KindaHTTPClient;
