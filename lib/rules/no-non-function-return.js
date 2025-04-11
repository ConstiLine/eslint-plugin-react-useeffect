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
        var effectFunctions = new Set();

        function isEffectCall(node) {
            return (
                node &&
                node.callee &&
                node.callee.type === 'Identifier' &&
                (node.callee.name === 'useEffect' || node.callee.name === 'useLayoutEffect')
            );
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
            return ancestors.find(
                (ancestor) =>
                    (ancestor.type === 'FunctionExpression' ||
                        ancestor.type === 'ArrowFunctionExpression') &&
                    effectFunctions.has(ancestor)
            );
        }

        return {
            CallExpression(node) {
                if (isEffectCall(node)) {
                    var firstArg = node.arguments[0];
                    if (
                        firstArg &&
                        (firstArg.type === 'ArrowFunctionExpression' || firstArg.type === 'FunctionExpression')
                    ) {
                        effectFunctions.add(firstArg);
                    }
                }
            },

            ReturnStatement(node) {
                if (!isInTopLevelEffectFunction(node)) {
                    return;
                }

                var sourceCode = context.getSourceCode();

                if (!node.argument) {
                    context.report({
                        node,
                        messageId: 'returnNotFunction',
                        suggest: [
                            {
                                messageId: 'replaceWithFunction',
                                fix(fixer) {
                                    var text = sourceCode.getText(node);
                                    var semicolon = text.trim().endsWith(';') ? ';' : '';
                                    return fixer.replaceText(node, 'return () => {}' + semicolon);
                                },
                            },
                        ],
                    });
                    return;
                }

                if (
                    node.argument.type !== 'ArrowFunctionExpression' &&
                    node.argument.type !== 'FunctionExpression'
                ) {
                    context.report({
                        node: node.argument,
                        messageId: 'returnNotFunction',
                        suggest: [
                            {
                                messageId: 'replaceWithFunction',
                                fix(fixer) {
                                    return fixer.replaceText(node.argument, '() => {};');
                                },
                            },
                        ],
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
