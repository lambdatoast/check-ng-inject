var R = require('ramda');
var esprima = require('esprima');
var type = R.prop('type');
var name = R.prop('name');
var body = R.prop('body');
var value = R.prop('value');
var expression = R.prop('expression');
var eq = R.equals;
var isProgram = R.compose(eq('Program'), type)
var isFuncDecl = R.compose(eq('FunctionDeclaration'), type)
var isExpr = R.compose(eq('ExpressionStatement'), type)
var isAssign = R.compose(eq('AssignmentExpression'), type)
var isIfStmt = R.compose(eq('IfStatement'), type)

function isNgInjectAssign(t) {
	return isExpr(t) ? isAssign(expression(t)) && (R.path(['expression', 'left', 'property', 'name'])(t) === '$inject') : false;
}

var isOfInterest = R.anyPass([isFuncDecl, isNgInjectAssign, isIfStmt]);

function decl(t) {
	return { 
		name: R.path(['id', 'name'])(t),
		params: R.path(['params'])(t).map(name)
	};
}

function ngInjects(t) {
	return { 
		name: R.path(['expression', 'left', 'object', 'name'])(t), 
		$injects: R.path(['expression', 'right', 'elements'])(t).map(value)
	}
}

var emptyCheck = { funDecls: [], ngInjects: [] };

function checkBody(body) {
	return body.filter(isOfInterest).reduce(function (acc, t) {
		return R.mergeWith(R.concat, {
			funDecls:        isFuncDecl(t) ? [decl(t)]      : [],
			ngInjects: isNgInjectAssign(t) ? [ngInjects(t)] : (isIfStmt(t) 
				? checkBody(t.alternate.body).ngInjects.concat(checkBody(t.consequent.body).ngInjects)
				: []
			)
		}, acc);
	}, emptyCheck);
}

function removeWrapperIIFE(t) {
	if (t.body.length === 1 && R.path(['expression', 'callee', 'id'], t.body[0]) === null) {
		return R.path(['expression', 'callee', 'body' ], t.body[0]);
	} else {
		return t;
	}
}

function assemble(r) {
	return r.ngInjects.reduce(function (acc, ng) {
		var decl = R.find(R.compose(R.equals(ng.name), name), r.funDecls)
		return decl ? acc.concat([R.merge(ng, {
			params: decl.params
		})]) : acc;
	}, []);
}

function check(js /* String */) {
	var t /* Tree */ = esprima.parse(js);
	if (!isProgram(t)) {
		throw new Error('Could not parse as a valid program');
	} else {
		return assemble(checkBody(body(removeWrapperIIFE(t))));
	}
}

module.exports = check;
