/**
 * @fileoverview ESLint plugin to check that all returns in useEffect/useLayoutEffect callbacks return a function.
 */

'use strict';

module.exports = {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Checks that all returns in useEffect/useLayoutEffect callbacks return a function. An empty return or return of a non-function will be an error',
            recommended: false,
        },
        fixable: 'code',
        hasSuggestions: true,
        schema: [],
        messages: {
            returnNotFunction:
                'The return inside useEffect/useLayoutEffect must be a function. Make sure that a cleanup function is returned',
            replaceWithFunction:
                'Replace with a cleanup function `() => {};`',
        },
    },

    create(context) {
        var FN_TYPES = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression']);
        var effectFunctions = new Set();

        var sourceCode = context.sourceCode || (typeof context.getSourceCode === 'function' ? context.getSourceCode() : null);

        function isEffectCall(node) {
            return (node && node.callee && node.callee.type === 'Identifier' && (node.callee.name === 'useEffect' || node.callee.name === 'useLayoutEffect'));
        }

        function getAncestors(node) {
            var ancestors = [];
            var current = node.parent;
            while (current) {
                ancestors.push(current);
                current = current.parent;
            }
            return ancestors;
        }

        function isInTopLevelEffectFunction(node) {
            var ancestors = getAncestors(node);
            return ancestors.find((ancestor) => FN_TYPES.has(ancestor.type) && effectFunctions.has(ancestor));
        }

        return {
            CallExpression(node) {
                if (isEffectCall(node)) {
                    var firstArg = node.arguments[0];
                    if (firstArg && FN_TYPES.has(firstArg.type)) {
                        effectFunctions.add(firstArg);
                    }
                }
            },

            ReturnStatement(node) {
                var nearestFn = getAncestors(node).find((n) => FN_TYPES.has(n.type));

                if (!nearestFn || !effectFunctions.has(nearestFn)) {
                    return;
                }

                if (!node.argument) {
                    context.report({
                        node,
                        messageId: 'returnNotFunction',
                        suggest: [{
                            messageId: 'replaceWithFunction',
                            fix(fixer) {
                                var text = sourceCode.getText(node);
                                var semicolon = text.trim().endsWith(';') ? ';' : '';
                                return fixer.replaceText(node, `return () => {}${semicolon}`);
                            },
                        }],
                    });
                    return;
                }

                if (!FN_TYPES.has(node.argument.type)) {
                    context.report({
                        node: node.argument,
                        messageId: 'returnNotFunction',
                        suggest: [{
                            messageId: 'replaceWithFunction',
                            fix(fixer) {
                                var text = sourceCode.getText(node);
                                var semicolon = text.trim().endsWith(';') ? ';' : '';
                                return fixer.replaceText(node, `return () => {}${semicolon}`);
                            },
                        }],
                    });
                }
            },

            'FunctionExpression:exit'(node) {
                effectFunctions.delete(node);
            },
            'FunctionDeclaration:exit'(node) {
                effectFunctions.delete(node);
            },
            'ArrowFunctionExpression:exit'(node) {
                effectFunctions.delete(node);
            },
        };
    },
};
