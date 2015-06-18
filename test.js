'use strict';

let http = require('http');
require('co-mocha');
let _ = require('lodash');
let assert = require('chai').assert;
let koa = require('koa');
let koaRouter = require('koa-router');
let body = require('koa-body');
let wait = require('co-wait');
let KindaHTTPClient = require('./src');

suite('KindaHTTPClient', function() {
  let httpServer, baseURL;

  let catchError = function *(fn) {
    let err;
    try {
      yield fn();
    } catch (e) {
      err = e;
    }
    return err;
  };

  suiteSetup(function *() {
    let serverPort = 8888;
    baseURL = 'http://localhost:' + serverPort;

    let server = koa();
    server.use(body());
    let router = koaRouter();
    server.use(router.routes());
    server.use(router.allowedMethods());

    router.get('/simple', function *() {
      this.body = 'ok';
    });

    router.get('/restricted-area', function *() {
      let accessToken = this.headers['x-access-token'];
      if (accessToken !== 'secret') {
        this.status = 403;
        return;
      }
      this.body = 'ok';
    });

    router.get('/resource', function *() {
      if (!_.startsWith(this.headers.accept, 'application/json')) {
        this.status = 400;
        return;
      }
      this.body = { result: 'ok' };
    });

    router.post('/resource', function *() {
      if (!_.startsWith(this.headers.accept, 'application/json')) {
        this.status = 400;
        return;
      }
      if (!_.startsWith(this.headers['content-type'], 'application/json')) {
        this.status = 400;
        return;
      }
      this.status = 201;
      this.body = { result: 'ok' };
    });

    router.get('/big-resource', function *() {
      yield wait(55);
      this.body = 'ok';
    });

    httpServer = http.createServer(server.callback());
    httpServer.listen(serverPort);
  });

  suiteTeardown(function *() {
    httpServer.close();
  });

  test('simple get', function *() {
    let httpClient = KindaHTTPClient.create();

    let res = yield httpClient.get(baseURL + '/simple');
    assert.strictEqual(res.statusCode, 200);
    assert.isTrue(_.startsWith(res.headers['content-type'], 'text/plain'));
    assert.strictEqual(res.body, 'ok');

    res = yield httpClient.get(baseURL + '/invalid-url');
    assert.strictEqual(res.statusCode, 404);
  });

  test('default options', function *() {
    let httpClient = KindaHTTPClient.create();
    let res = yield httpClient.get(baseURL + '/restricted-area');
    assert.strictEqual(res.statusCode, 403);

    httpClient = KindaHTTPClient.create({
      headers: { 'x-access-token': 'secret' }
    });
    res = yield httpClient.get(baseURL + '/restricted-area');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body, 'ok');
  });

  test('method options', function *() {
    let httpClient = KindaHTTPClient.create({
      headers: { 'x-access-token': 'invalid-secret' }
    });

    let res = yield httpClient.get(baseURL + '/restricted-area');
    assert.strictEqual(res.statusCode, 403);

    res = yield httpClient.get({
      url: baseURL + '/restricted-area',
      headers: { 'x-access-token': 'secret' }
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body, 'ok');
  });

  test('get json', function *() {
    let httpClient = KindaHTTPClient.create();
    let res = yield httpClient.get(baseURL + '/resource');
    assert.strictEqual(res.statusCode, 400);

    httpClient = KindaHTTPClient.create({ json: true });
    res = yield httpClient.get(baseURL + '/resource');
    assert.strictEqual(res.statusCode, 200);
    assert.isTrue(_.startsWith(res.headers['content-type'], 'application/json'));
    assert.deepEqual(res.body, { result: 'ok' });
  });

  test('post json', function *() {
    let httpClient = KindaHTTPClient.create({ json: true });
    let res = yield httpClient.post(baseURL + '/resource', { param: 123 });
    assert.strictEqual(res.statusCode, 201);
    assert.isTrue(_.startsWith(res.headers['content-type'], 'application/json'));
    assert.deepEqual(res.body, { result: 'ok' });
  });

  test('timeout', function *() {
    let httpClient = KindaHTTPClient.create();

    let err = yield catchError(function *() {
      yield httpClient.get({
        url: baseURL + '/big-resource',
        timeout: 50
      });
    });
    assert.instanceOf(err, Error);

    let res = yield httpClient.get({
      url: baseURL + '/big-resource',
      timeout: 100
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body, 'ok');
  });
});