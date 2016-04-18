#!/usr/bin/env node
var fs = require('fs');
var Promise = require('promise');


var readFile = Promise.denodeify(fs.readFile);

var Block = function(lines) {

    var parseForLine = function(lines, id) {
        var res = [];
        var startParse = false;
        for (var i=0;i<lines.length;i++) {
            if (lines[i].indexOf(id) !== -1 || (startParse && lines[i].indexOf('"') == 0)){
                res.push(lines[i]);
                startParse = true;
            } else {
                startParse = false;
            }
        }
        return res;
    }

    this.msgid = parseForLine(lines, 'msgid');
    this.msgstr = parseForLine(lines, 'msgstr');
    this.msgctx = parseForLine(lines, 'msgctx');
    this.occ = parseForLine(lines, '#:');
    this.com = parseForLine(lines, '#.');
}

Block.prototype.toStr = function() {
    var res = [];
    if (this.com.length > 0)
        res.push(this.com.join('\n'));

    if (this.occ.length > 0)
        res.push(this.occ.join('\n'));

    if (this.msgctx.length > 0)
        res.push(this.msgctx.join('\n'));

    if (this.msgid.length > 0)
        res.push(this.msgid.join('\n'));

    if (this.msgstr.length > 0)
        res.push(this.msgstr.join('\n'));

    res.push('');
    res.push('');

    return res.join('\n');
}

Block.prototype.hash = function() {
    var strToHash = this.msgid + this.msgctx;

    var hash = 0, i, chr, len;
    if (strToHash.length == 0) return hash;
    for (i = 0, len = strToHash.length; i < len; i++) {
        chr   = strToHash.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }

    Block.prototype.eq = function(b) {
        return this.hash() === b.hash();
    }

    Block.prototype.merge = function(other) {
        var origOccs = this.occ;
        other.occ.forEach(function(o){
            if (origOccs.indexOf(o) === -1)
                origOccs.push(o);
        });
    }

    var SetOfBlocks = function(arr) {
        this.blocks = arr || [];
    }

    SetOfBlocks.prototype.add = function(block) {
        var duplicate = this.getDuplicate(block.hash());
        if (duplicate)
         duplicate.merge(block);
     else {
        try {
            this.blocks.push(block);
        } catch (e) {
            console.log(e);
        }
    }
}

SetOfBlocks.prototype.getDuplicate = function(hash) {
    for (var i = 0; i<this.blocks.length;i++)
        if (this.blocks[i].hash() === hash)
            return this.blocks[i];      

        return;
    }

    SetOfBlocks.prototype.toStr = function() {
        return this.blocks.reduce(function(prev, curr){
            return prev + curr.toStr();
        }, "");
    }

    SetOfBlocks.prototype.addArray = function(arr) {
        for(var i = 0;i<arr.length;i++)
            this.add(arr[i]);
    }

    var readBlock = function(lines) {
        var block = [];
        var line = lines.pop();
        while(line) {
            block.push(line);
            line = lines.pop();
        }
        return [block, lines];
    }

    var readBlocks = function(lines, blocks) {
        var blocks = [];
        while (lines.length > 0) {
            var res = readBlock(lines);
            var b = new Block(res[0]);
            blocks.push(b);
            lines = res[1];
        }
        return blocks;
    }

    var printBlock = function(b) {
        console.log(b.hash());
        console.log(b.toStr());
        console.log();
    }

    var hashCompare = function(a, b) {
        return a.hash() - b.hash();
    }

    var msgIdCompare = function(a, b) {
        return a.msgid.localeCompare(b.msgid);
    }

    var parseFile = function(data) {
        var lines = data.split(/\r?\n/).reverse();
        var blocks = readBlocks(lines).sort(hashCompare);

        return blocks;
    }

    var merge = function(arrays) {
        var set = new SetOfBlocks(arrays[0]);
        set.addArray(arrays[1]);

        return set;
    }

    var writeFile = function(blocks, output){
        console.log('');
        console.log('writefile: '+blocks.toStr());
        var text = blocks.toStr();
        fs.writeFile(output, text);
    }

    var run = function(a, b, output) {
        Promise.all([readFile(a, 'utf8').then(parseFile), readFile(b, 'utf8').then(parseFile)]).then(merge).then(function(outputData) {
            writeFile(outputData, output);
        });
    }


    // Export methods for use elsewhere
    module.exports.parseFile = parseFile;
    module.exports.merge = merge;
    module.exports.run = run;

//todo:
// 1. merga comments for block som ar samma
// 2. maste sluta med tom rad
