var fs = require('fs');
var check = require('./lib/check');

var t0 = 'function Foo(a, b, c) {}\nFoo.$inject = ["a", "b"]';
//var t0 = 'function Foo(a, b, c) {}\nif (1) { 1 + 1} else { Foo.$inject = ["a", "b"] }';

var r = check(t0);

//console.log(JSON.stringify(r));

var files = process.argv.slice(2);
files.forEach(function (val, index, array) {
  //console.log(index + ': ' + val);
	fs.readFile(val, 'utf8', function(err, contents) {
		var r = check(contents);
		if (r.ngInjects.length > 0) {
			console.log(JSON.stringify(r), '\n');
		}
	});
});
/*
*/