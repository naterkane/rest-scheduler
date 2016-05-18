'use strict';
var ramlMocker =  require('raml-mocker');
var express = require('express');
var _ = require('lodash');
var faker = require('faker');
var options = {path: [__dirname, '/raml'].join()};
var app = express();
var port = process.env.API_SPEC_PORT || 3001;

var callback = function(requestsToMock) {
  _.each(requestsToMock, function(reqToMock) {
    app[reqToMock.method](reqToMock.uri, function(req, res) {
      var code = 200;
      if (reqToMock.defaultCode) {
        code = reqToMock.defaultCode;
      }
      console.log('mocking ' + reqToMock.uri);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(code).send(reqToMock.mock());
    });
  });
};

options.formats = {
  'date-time': function() {
    return faker.date.past();
  },
  city: function() {
    return faker.address.city();
  },
  state: function() {
    return faker.address.state();
  },
  stateAbbr: function() {
    return faker.address.stateAbbr();
  },
  ipv4: function() {
    return faker.internet.ip();
  },
  name: function() {
    return faker.name.findName();
  }
};

ramlMocker.generate(options, callback);

app.listen(port);
console.log('api mock server listening on http://localhost:' + port);
