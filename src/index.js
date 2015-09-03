'use strict';

let _ = require('lodash');
let superagent = require('superagent');
let Buffers = require('buffers');
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
    let method = options.method.toLowerCase();
    if (method === 'delete') method = 'del';
    let req = superagent[method](options.url);

    if (!_.isEmpty(options.headers)) req.set(options.headers);

    if (options.timeout != null) req.timeout(options.timeout);

    let encoding;
    if ('encoding' in options) {
      if (options.encoding == null) {
        encoding = 'buffer';
      } else { // TODO: support more encodings
        throw new Error('unsupported encoding');
      }
    }

    if (encoding === 'buffer') { // NodeJS only
      req.buffer();
      req.parse(function(res, done) {
        let buffers = [];
        res.on('data', function(buffer) {
          buffers.push(buffer);
        });
        res.on('end', function() {
          let body = Buffers(buffers).toBuffer(); // eslint-disable-line new-cap
          done(null, body);
        });
      });
    }

    if (options.json) req.set('Accept', 'application/json');

    if (options.body != null) {
      let body = options.body;
      if (options.json) {
        body = JSON.stringify(body);
        req.set('Content-Type', 'application/json');
      }
      req.send(body);
    }

    return new Promise((resolve, reject) => {
      req.end(function(err, res) {
        if (err && ('status' in err)) {
          // don't consider status 4xx or 5xx as errors
          res = err.response;
          err = null;
        }

        if (err) {
          reject(new Error('HTTP Request Error: ' + err.message));
        } else {
          let result = {
            statusCode: res.status,
            headers: res.header
          };
          if (encoding === 'buffer') {
            result.body = res.body;
          } else if (res.type === 'application/json') {
            result.body = res.body;
          } else {
            let body = res.text;
            if (res.status === 204 && body === '') body = undefined;
            if (options.json && body) {
              // try to parse JSON even if the server doesn't answer
              // with 'application/json' as 'Content-Type'
              try {
                body = JSON.parse(body);
              } catch (err) {
                // noop
              }
            }
            result.body = body;
          }
          resolve(result);
        }
      });
    });
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
