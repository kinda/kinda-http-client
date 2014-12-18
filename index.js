"use strict";

var originalRequest = process.browser ? require('browser-request') : require('request' + '');
var _ = require('lodash');
var config = require('kinda-config').get('kinda-http-client');

var KindaHTTPClient = {
  create: function(localConfig) {
    var defaultOptions = {};
    _.defaults(defaultOptions, localConfig);
    _.defaults(defaultOptions, config);
    _.defaults(defaultOptions, {
      json: true,
      timeout: 30000
    });

    var _request = function(options) {
      return function(cb) {
        originalRequest(options, function(err, res) {
          if (err) return cb(err);
          cb(null, res);
        });
      };
    };

    var request = function(options, body) {
      options = normalizeArguments(options, body);
      return _request(options);
    };

    var get = function(options) {
      options = normalizeArguments(options);
      options.method = 'GET';
      return _request(options);
    };

    var post = function(options, body) {
      options = normalizeArguments(options, body);
      options.method = 'POST';
      return _request(options);
    };

    var put = function(options, body) {
      options = normalizeArguments(options, body);
      options.method = 'PUT';
      return _request(options);
    };

    var del = function(options) {
      options = normalizeArguments(options);
      options.method = 'DELETE';
      return _request(options);
    };

    var patch = function(options, body) {
      options = normalizeArguments(options, body);
      options.method = 'PATCH';
      return _request(options);
    };

    var head = function(options) {
      options = normalizeArguments(options);
      options.method = 'HEAD';
      return _request(options);
    };

    var options = function(options) {
      options = normalizeArguments(options);
      options.method = 'OPTIONS';
      return _request(options);
    };

    var normalizeArguments = function(options, body) {
      if (!options)
        throw new Error('invalid options');
      if (typeof options === 'string')
        options = { url: options };
      if (body != null)
        options.body = body;
      _.defaults(options, defaultOptions);
      return options;
    }

    return {
      request: request,
      get: get,
      post: post,
      put: put,
      del: del,
      patch: patch,
      head: head,
      options: options
    };
  }
}

module.exports = KindaHTTPClient;
