#!/usr/bin/env node

var argv = require('yargs')
.usage('Usage: $0 -a [pot-file] -b [pot-file] -o [output pot-file]')
.demand(['a', 'b', 'o'])
.argv;

var potMerge = require('./pot-merge.js');

var a = argv.a || argv._[0];
var b = argv.b || argv._[1];
var o = argv.o || argv._[2];

potMerge.run(a, b, o);
