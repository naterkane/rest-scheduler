# REST-Scheduler

## Introduction

`rest-scheduler` is middleware that allows the creation and management of special tasks. Think about it as an API to cron w/ persistence and clustering, not all tasks are automations.
This is a dumb system.

## Getting started

### Mongo

**Currently agenda only supports Mongo 2.6.x - <3.0**
A [Dockerfile](Dockerfile) is included in this project for convenience

please note that `NODE_ENV` must be set per environment, example files are included in the repo

    $ cp .env.sample .env

then edit `.env` as required, the default mongo docker container does not require `dbuser` or `dbpassword`

    {
      MONGOSTRING: "mongodb://<dbuser>:<dbpassword>@<domain>:<port>/<database>", // use whatever mongo connect string you need
      "NODE_ENV": "development"                                                  // set whatever environment you want
    }

### Start REST-Scheduler    

Now that we have our environment variables taken care of

Run Mongo then start the server

    $ node run docker
    $ node server.js                                        // if you want stdout
    or
    $ pm2 start server.js --name=rest-scheduler --watch     // if you want the awesomeness of pm2

### Start Agendash

to run agendash, in a separate process (open a new terminal window) run:

    $ ./node_modules/.bin/agendash --db=mongodb://<mongouser>:<mongopass>@<mongoserver>:<mongoport>/<mongodb> --port=3001

alternatively `.env` may be used to specify this value

This service only exposes a single endpoint... `/action`

## Sending a request to the scheduler

Each request must be sent via POST and contain a request object. Currently only 3 keys are required

    {
    "when":"in 3 second",                       // a relative amount of time
    "url":"http://localhost:3000/testcburl",    // a callback url (all callback urls will be requested via POST)
    "name":"3 job"                              // a name for the job. unique value is encouraged, but not required
    }


### Using HTTP

    POST /action HTTP/1.1
    Host: localhost:3000
    Content-Type: application/json

    {
    "when":"in 3 second",
    "url":"http://localhost:3000/testcburl",
    "name":"3 job"
    }

### Using cURL

    curl -X POST -H "Content-Type: application/json" -d '{
    "when":"in 3 second",
    "url":"http://localhost:3000/testcburl",
    "name":"3 job"
    }' "http://localhost:3000/action"

## Response objects

As REST-Scheduler is really just designed to fire a dumb request to a callback URI after a set period of time, any request object sent to REST-Scheduler will get sent do the callback URI specified in the original request.
This can include any arbitrary JSON the original caller desires.

Below is an example of a current response object

    {
      "meta": {
        "time": "2016-03-18T06:54:25.567Z",
        "request": {
          "name": "1 job",
          "data": {
            "when": "in 1 second",
            "url": "http://localhost:3000/testcburl",
            "name": "1 job"
          },
          "type": "normal",
          "priority": 0,
          "nextRunAt": "2016-03-18T06:54:26.568Z",
          "_id": "56eba62139a48fc980b3495d"
        }
      }
    }

Though the original request object can be found at `meta.request.data` in the near future a payload key may be made available as a top level value.

Users are not be limited to a single payload key, and any key in the original request object named other than `meta`, `when`, `url`, or `name` will be passed forward as top level keys and sent to the callback url

    {
      "meta": {
        "time": "2016-03-18T06:54:25.567Z",
        "request": {
          "name": "1 job",
          "data": {
            "when": "in 1 second",
            "url": "http://localhost:3000/testcburl",
            "name": "1 job",
            "foo": ["bar","baz"]            // this is the arbitrarily named payload to make available to the callback url when the scheduled event gets fired
          },
          "type": "normal",
          "priority": 0,
          "nextRunAt": "2016-03-18T06:54:26.568Z",
          "_id": "56eba62139a48fc980b3495d"
        }
      },
      "foo": ["bar","baz"]                  // this is the payload available as a top level key in the request object that gets sent to the callback url
    }
