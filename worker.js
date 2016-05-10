'use strict';
var config = require('conf-env');

require('env-deploy')(__dirname);
const connectionOpts = process.env.MONGOSTRING;
require('./lib/agenda.js');
