var raml = require('raml-1-parser');
var _ = require('lodash');
var fs = require('fs');

raml.composeFile('raml/api.raml').then(function(rootNode) {

  var doclines = rootNode.start_mark.buffer.split('\n'),
      newdoc = [],
      c = 0,
      msg = '';
  _.forOwn(doclines,function(line) {
    c++;
    var include,
        buffer,
        includelines = [],
        d = 0;

    if (line.match(/\!include\s(examples|schemas)\/\w+\-*\w+(\.json)/)) {
      if (!msg){
        msg = 'importing external files for ' + doclines.length + ' lines';
        console.log(msg);
      }
      console.info('line ' + c + ': importing ' + line.match(/(examples|schemas)\/\w+\-*\w+(\.json)/)[0]);
      include = fs.readFileSync('raml/' + line.match(/(examples|schemas)\/\w+\-*\w+(\.json)/)[0], 'utf8');
      /**
       * let's maintain our indentation since raml is yaml-ish it's important
       */
      buffer = line.match(/^\s{0,100}/)[0] + '  '; // add two spaces (or four?) - need to check raml spec
      includelines = include.split('\n');


      d = 0;
      _.forOwn(includelines, function(iline){
        includelines[d++] = buffer + iline;//iline.replace(/^/,buffer);
      });
      include = includelines.join('\n');
      line = line.replace(/\!include\s(examples|schemas)\/\w+\-*\w+(\.json)/, '|\n' + include);

    }
    newdoc.push(line);
  });
  //if (fs.file)
  fs.writeFile('raml/api-flat.raml',newdoc.join('\n'), 'utf8',function(err) {
        if (err) {
          console.warn(err);
          //exit;
        }
        console.info('done!');
        //console.log(newdoc.join('\n'));
      }
  );
  //console.log(newdoc);
  /*console.log(data.resources[0].methods[0].responses[200]);
   console.log(data.resources[0].resources.length);
   console.dir(data.resources[0]);
   console.log('top level: ' + data.resources.length);
   console.dir(data);
   rootNode.resources.forEach(function(r){
   console.log('2nd level: ' + r.resources.length);
   console.dir(r);

   });
   //console.log(JSON.stringify(data, null, 1));
   //console.dir(data);*/
}, function(error) {
  console.error(error);
});
