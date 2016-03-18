'use strict';
var express = require('express'),
    expressRest = require('express-rest'),
    config = require('conf-env'),
    bodyParser = require('body-parser'),
    URL = require('url'),
    http = require('http');
require('env-deploy')(__dirname);

var app = express();
  app.use(bodyParser.json());

/**
 * let's get our dashboard served (on the same instance now because lazy)
 */
var Agenda = require('agenda');
var agenda = new Agenda()
    .database(process.env.MONGOSTRING);

/**
 * let's expose our endpoints
 */
var rest = expressRest(app);
var generateResponseObj = function(jerb, reqtime){
  return JSON.stringify({_metadata:{time:reqtime,request:jerb}});
};
app.post('/action', function(req, res) {
  let reqtime = new Date().toISOString();
  let jerb = req.body;
  console.log("URL " + req.body.url);
  //console.log(req);

  agenda.define(jerb.name, (jerb, done) => {


    var postData = JSON.stringify(jerb),
        cburl = URL.parse(jerb.url, true, true);
    console.log("cburl " + cburl);

    var options = {
      hostname:    URL.parse(jerb.url).hostname,
      port:        URL.parse(jerb.url).port,
      path:        URL.parse(jerb.url).path,
      querystring: "",
      method:      'POST',
      headers:     {
        'Content-Type':   'application/json',
        'Content-Length': postData.length
      }
    };

    var req = http.request(options, (res) => {
      console.log(`STATUS: ${res.statusCode}`);
      console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
      });
      res.on('end', () => {
        console.log('No more data in response.')
      })
    });

    req.on('error', (e) => {
      console.log(`problem with request: ${e.message}`);
    });

// write data to request body
    req.write(postData);
    req.end();
    next();
  });




  agenda.schedule(jerb.when,jerb.name, jerb, (err, jerb) => res.send(generateResponseObj(jerb, reqtime)) );
  agenda.start();
});

app.get('/action/:id', function(req, res){
  let jerb = req;
  var action = jerb.callback;

});

app.get('/testcburl', function(req,res){
  var resp = JSON.Stringify(req.body);
  console.log(Date.now(),resp)
  res.send(resp);
});
agenda.on('ready', function() {
  agenda.start();
});
agenda.on('start', function(job) {
  console.log("Job %s starting", job.attrs.name);
});
var server = app.listen(3000, function () {
  var host = server.address().address;
  host = (host === '::' ? 'localhost' : host);
  var port = server.address().port;

  console.log('listening at http://%s:%s', host, port);
});
