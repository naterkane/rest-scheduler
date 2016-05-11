'use strict';
var express = require('express');
// var expressRest = require('express-rest');
// var config = require('conf-env');
var bodyParser = require('body-parser');
var url = require('url');
var http = require('http');
var _ = require('lodash');
require('env-deploy')(__dirname);
var ObjectId = require('mongodb').ObjectID;
var app = express();
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.removeHeader('X-Powered-By');
  next();
});
/**
 * let's get our dashboard served (on the same instance now because lazy)
 */
var Agenda = require('agenda');
let processname = (process.getuid) ? process.getuid() : 'windozdevbox';
var agenda = new Agenda({name: processname})
    .database(process.env.MONGOSTRING);
// var rest = expressRest(app);
/**
 * let's expose our endpoints
 */
var generateResponseObj = function(jerb, reqtime) {
  let time = (undefined === reqtime) ? new Date().toISOString() : reqtime;
  // let dataitems = jerb.keys();
  /**
   * omit core request keys from the arbitrary data we'll make available under req.data for the object we forwarard on
   * to the callback url
   */
  console.log('jerb', JSON.stringify(jerb.attrs.data, null, 1));
  let data = _.omit(jerb.attrs.data, 'when', 'url', 'name');

  console.log('data', JSON.stringify(data, null, 1));
  return JSON.stringify({
    meta: {
      time: time,
      request: jerb
    },
    data: data
  });
};

/**
 * /action
 */
app.post('/', function(req, res) {
  let reqtime = new Date().toISOString();
  let jerb = req.body;
  let opts = {};
  /**
   * process options
   */
  if (jerb.concurrency !== undefined) {
    opts.concurrency = jerb.concurrency;
  }
  if (jerb.lockLimit !== undefined) {
    opts.lockLimit = jerb.lockLimit;
  }
  if (jerb.priority !== undefined) {
    opts.priority = jerb.priority;
  }
  if (jerb.lockLifetime !== undefined) {
    opts.lockLifetime = jerb.lockLifetime;
  }

  console.log('URL ' + req.body.url);
  // var jorb = jerb;
  agenda.define(jerb.name, opts, (jorb, done) => {
    // console.log("#################################################/nJERB URL" + jerb.url);
    var postData = JSON.stringify(jerb);
    var cburl = url.parse(jerb.url, true, true);
    // console.info("cburl " + JSON.stringify(cburl));
    var options = {
      hostname: cburl.hostname,
      port: cburl.port,
      path: cburl.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': postData.length
      }
    };

    var req = http.request(options, res => {
      console.log(`STATUS: ${res.statusCode}`);
      console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
      res.setEncoding('utf8');
      res.on('data', chunk => {
        console.log(`BODY: ${chunk}`);
      });
      res.on('end', () => {
        console.log('No more data in response.');
      });
    });

    req.on('error', err => {
      console.log(`problem with request: ${err.message}`);
    });

    req.write(postData);
    req.end();
    console.log('done with ' + jerb.name);
    done();
  });

  agenda.schedule(jerb.when, jerb.name, jerb, (err, jerb) => {
    if (err) {
      throw new Error(err);
    }
    res.status(201)
       .set('Content-Type', 'application/json; charset=utf-8')
       .send(generateResponseObj(jerb, reqtime));
  });

  agenda.start();
});

app.get('/:jobid', (req, res) => {
  agenda.jobs({_id: ObjectId(req.params.jobid)}, (err, job) => {
    if (err) {
      throw new Error(err);
    }
    console.log(job, 'job');
    var resp = job[0];
    res.status(200)
       .set('Content-Type', 'application/json; charset=utf-8')
       .send(resp);
  });
});

app.put('/:jobid', (req, res) => {
  let jerb = req.body;
  let resp = '';
  console.log(req.params.jobid, '_id');
  agenda.jobs({_id: ObjectId(req.params.jobid)}, (err, job) => {
    if (err) {
      console.error(err);
      // throw new Error(err);
    }
    job = job[0];
    console.log(job);
    // console.dir(job.agenda.attrs, {depth: null, colors: true});
    console.dir(jerb, {depth: null, colors: true});

    job.attrs = Object.assign(job.attrs, jerb);
    job.attrs.data = Object.assign(job.attrs.data, jerb);
    job.save(err => {
      if (err === null) {
        console.log('Successfully saved Job ' + job.attrs.name);
        resp = JSON.stringify(job);
        res.status(200)
           .set('Content-Type', 'application/json; charset=utf-8')
           .send(resp);
      } else {
        res.status(500)
           .set('Content-Type', 'application/json; charset=utf-8')
           .send(err);
      }
    });
  });
});

app.delete('/:jobid', (req, res) => {
  agenda.cancel({_id: ObjectId(req.params.jobid)}, (err, numRemoved) => {
    if (err) {
      throw new Error(err);
    }
    console.log(numRemoved, 'numRemoved');
    res.status(200)
       .set('Content-Type', 'application/json; charset=utf-8')
       .send({message: 'Successfully removed Job ' + req.params.jobid});
  });
});

app.post('/testcburl', (req, res) => {
  var resp = JSON.stringify(req.body);
  console.log('TEST CB URL: ' + new Date().toISOString(), resp);
  res.status(202)
     .set('Content-Type', 'application/json; charset=utf-8')
     .send(resp);
});

agenda.on('ready', () => {
  agenda.start();
});

agenda.on('start', job => {
  console.info('Job %s starting', job.attrs.name);
});

var server = app.listen(3000, function() {
  var host = server.address().address;
  host = (host === '::' ? 'localhost' : host);
  var port = server.address().port;

  console.info('listening at http://%s:%s', host, port);
});

/**
 *
 */
function graceful() {
  agenda.stop(() => {
    process.exit(0);
  });
}

process.on('SIGTERM', graceful);
process.on('SIGINT', graceful);
