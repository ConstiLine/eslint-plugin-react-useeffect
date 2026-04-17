'use strict';

var assert = require('node:assert/strict');
var test = require('node:test');

var rule = require('../lib/rules/no-non-function-return');

function createSourceCode() {
    return {
        getText(node) {
            return node.text;
        },
    };
}

function createRuleRun(options) {
    var reports = [];
    var sourceCode = options.sourceCode || createSourceCode();
    var context = {
        report(descriptor) {
            reports.push(descriptor);
        },
    };

    if (options.useSourceCode) {
        context.sourceCode = sourceCode;
    }

    if (options.useGetSourceCode) {
        context.getSourceCode = function () {
            return sourceCode;
        };
    }

    if (options.onGetSourceCode) {
        context.getSourceCode = options.onGetSourceCode;
    }

    var listeners = rule.create(context);
    var callback = {
        type: 'ArrowFunctionExpression',
        parent: null,
    };
    var callExpression = {
        type: 'CallExpression',
        parent: {
            type: 'Program',
            parent: null,
        },
        callee: {
            type: 'Identifier',
            name: options.calleeName || 'useEffect',
        },
        arguments: [callback],
    };
    var argument = options.argument || null;
    var returnNode = {
        type: 'ReturnStatement',
        parent: callback,
        argument: argument,
        text: options.returnText || (argument ? 'return ' + argument.text + ';' : 'return;'),
    };

    callback.parent = callExpression;

    if (argument) {
        argument.parent = returnNode;
    }

    listeners.CallExpression(callExpression);
    listeners.ReturnStatement(returnNode);

    return {
        reports: reports,
        returnNode: returnNode,
    };
}

function createFixerResult(report) {
    return report.suggest[0].fix({
        replaceText(node, text) {
            return {
                node: node,
                text: text,
            };
        },
    });
}

test('uses context.sourceCode without calling getSourceCode', function () {
    var run = createRuleRun({
        useSourceCode: true,
        onGetSourceCode() {
            throw new Error('getSourceCode should not be called when sourceCode exists');
        },
    });

    assert.equal(run.reports.length, 1);
    assert.equal(run.reports[0].messageId, 'returnNotFunction');
    assert.strictEqual(run.reports[0].node, run.returnNode);
    assert.deepEqual(createFixerResult(run.reports[0]), {
        node: run.returnNode,
        text: 'return () => {};',
    });
});

test('falls back to context.getSourceCode for older ESLint versions', function () {
    var argument = {
        type: 'Literal',
        text: '42',
    };
    var run = createRuleRun({
        useGetSourceCode: true,
        argument: argument,
        returnText: 'return 42;',
    });

    assert.equal(run.reports.length, 1);
    assert.equal(run.reports[0].messageId, 'returnNotFunction');
    assert.strictEqual(run.reports[0].node, argument);
    assert.deepEqual(createFixerResult(run.reports[0]), {
        node: run.returnNode,
        text: 'return () => {};',
    });
});

test('does not report an existing cleanup function', function () {
    var run = createRuleRun({
        useSourceCode: true,
        onGetSourceCode() {
            throw new Error('getSourceCode should not be called when sourceCode exists');
        },
        argument: {
            type: 'ArrowFunctionExpression',
            text: '() => {}',
        },
        returnText: 'return () => {};',
    });

    assert.equal(run.reports.length, 0);
});
