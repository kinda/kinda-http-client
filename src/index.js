'use strict';

let _ = require('lodash');
let originalRequest = require('request');
let KindaObject = require('kinda-object');

let KindaHTTPClient = KindaObject.extend('KindaObject', function() {
  this.creator = function(options) {
    this.instanceOptions = options;
  };

  this.applyDefaultOptions = function(methodOptions) {
    let options = {
      useJSON: false,
      timeout: 30000
    };
    _.merge(options, this.getOptionsFromContext());
    _.merge(options, this.instanceOptions);
    _.merge(options, methodOptions);
    return options;
  };

  this.getOptionsFromContext = function() {
    let options = {};
    if ('httpClientHeaders' in this.context) {
      options.headers = this.context.httpClientHeaders;
    }
    if ('httpClientUseJSON' in this.context) {
      options.useJSON = this.context.httpClientUseJSON;
    }
    if ('httpClientTimeout' in this.context) {
      options.timeout = this.context.httpClientTimeout;
    }
    return options;
  };

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
      'url',
      'method',
      'timeout',
      'headers',
      'body'
    ]);
    opts.json = options.useJSON;
    opts.withCredentials = false; // Fix https://github.com/request/request/issues/986
    return function(cb) {
      originalRequest(opts, function(err, res) {
        if (err) return cb(err);
        cb(null, res);
      });
    };
  };

  this.normalizeArguments = function(options, body) {
    if (!options) throw new Error('invalid options');
    if (typeof options === 'string') options = { url: options };
    options = this.applyDefaultOptions(options);
    if (body != null) options.body = body;
    return options;
  };
});

module.exports = KindaHTTPClient;
