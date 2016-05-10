var R = require('ramda');
var q = require('q');
var fs = require('fs');
var check = require('./lib/check');

var t0 = '(function () {\n Bar.$inject = ["x"]\nfunction Bar(x) {} function Foo(a, b, c) {}\nFoo.$inject = ["a", "b"]\n }())';
//var t0 = 'function Foo(a, b, c) {}\nif (1) { 1 + 1} else { Foo.$inject = ["a", "b"] }';

var r = check(t0);

//console.log(JSON.stringify(r));

var files = process.argv.slice(2);

void q.all(files.map(function (name) {
	return q.nfcall(fs.readFile, name, 'utf8').then(function (contents) {
		return [ name, contents ];
	});
})).then(function (xs) {
	var results = xs.reduce(function (acc, js) {
		var r = check(js[1]);
		return acc.concat(r.map(function (r) {
			return R.merge(r, {file: js[0]});
		}));
	}, []);
	var warnings = results.filter(R.compose(R.lt(0), R.path(['problems', 'length'])));
	console.log('check-ng-inject warnings:');
	warnings.forEach(function (w) {
		//console.log(JSON.stringify(w));
		console.dir(w);
	});
});