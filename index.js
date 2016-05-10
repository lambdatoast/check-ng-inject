var q = require('q');
var fs = require('fs');
var check = require('./lib/check');

var t0 = '(function () {\n Bar.$inject = ["x"]\nfunction Bar(x) {} function Foo(a, b, c) {}\nFoo.$inject = ["a", "b"]\n }())';
//var t0 = 'function Foo(a, b, c) {}\nif (1) { 1 + 1} else { Foo.$inject = ["a", "b"] }';

var r = check(t0);

//console.log(JSON.stringify(r));

var files = process.argv.slice(2);

void q.all(files.map(function (name) {
	return q.nfcall(fs.readFile, name, 'utf8');
})).then(function (xs) {
	var results = xs.reduce(function (acc, js) {
		var r = check(js);
		return acc.concat(check(js));
	}, []);
	console.log(JSON.stringify(results));
});