'use strict';
var express = require('express'),
    expressRest = require('express-rest'),
    config = require('conf-env'),
    bodyParser = require('body-parser'),
    url = require('url'),
    http = require('http'),
    _ = require('lodash');
require('env-deploy')(__dirname);

var app = express();
  app.use(bodyParser.json());
  app.use((req, res, next) => {
  res.removeHeader("X-Powered-By");
  next();
});
/**
 * let's get our dashboard served (on the same instance now because lazy)
 */
var Agenda = require('agenda');
var agenda = new Agenda()
    .database(process.env.MONGOSTRING);
var rest = expressRest(app);
/**
 * let's expose our endpoints
 */
var generateResponseObj = function(jerb, reqtime){
  let time = (undefined === reqtime) ? new Date().toISOString() : reqtime;
  //let dataitems = jerb.keys();
  /**
   * omit core request keys from the arbitrary data we'll make available under req.data for the object we forwarard on to the callback url
   */
      console.log("jerb",JSON.stringify(jerb.attrs.data,null,1));
  let data = _.omit(jerb.attrs.data,"when","url","name");

      console.log("data",JSON.stringify(data,null,1));
  return JSON.stringify({
    meta: {
      time:    time,
      request: jerb
    },
    data: data
  });
};


/**
 * /action
 */
app.post('/action', function(req, res) {
  let reqtime = new Date().toISOString();
  let jerb = req.body,

      opts = {};

  /**
   * process options
   */
  if(jerb.concurrency   !== undefined) opts.concurrency   = jerb.concurrency;
  if(jerb.lockLimit     !== undefined) opts.lockLimit     = jerb.lockLimit;
  if(jerb.priority      !== undefined) opts.priority      = jerb.priority;
  if(jerb.lockLifetime  !== undefined) opts.lockLifetime  = jerb.lockLifetime;


  console.log("URL " + req.body.url);
  var jorb = jerb;
  agenda.define(jerb.name, opts, (jorb, done) => {

    //console.log("#################################################/nJERB URL" + jerb.url);

    var postData = JSON.stringify(jerb),
        cburl = url.parse(jerb.url, true, true);
    //console.info("cburl " + JSON.stringify(cburl));

    var options = {
      hostname:    cburl.hostname,
      port:        cburl.port,
      path:        cburl.path,
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

    req.write(postData);
    req.end();
    console.log("done with " + jerb.name)
    done();
  });

  agenda.schedule(jerb.when, jerb.name, jerb, (err, jerb) =>
      res.status(201)
          .set('Content-Type', 'application/json')
          .send(generateResponseObj(jerb, reqtime)));
  agenda.start();
});

app.post('/testcburl', function(req,res){
  var resp = JSON.stringify(req.body);
  console.log("TEST CB URL: " + new Date().toISOString(),resp);
  res.status(202)
      .set('Content-Type', 'application/json')
      .send(resp);
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
