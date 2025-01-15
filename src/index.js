'use strict';

module.exports = (_ref) => {
    const t = _ref.types;

    const errorHandlerName = 'ReactSSRErrorHandler';
    const originalRenderMethodName = '__originalRenderMethod__';

    const isReactClass = (node) => {
        const superClass = node.superClass;
        return t.isIdentifier(superClass, { name: 'Component' }) ||
            t.isIdentifier(superClass, { name: 'PureComponent' }) ||
            t.isMemberExpression(superClass) && (
                t.isIdentifier(superClass.object, { name: 'React' }) &&
                (
                    t.isIdentifier(superClass.property, { name: 'Component' }) ||
                    t.isIdentifier(superClass.property, { name: 'PureComponent' })
                )
            );
    };

    const bodyVisitor = {
        ClassMethod: function (path, state) {
            const methodName = path.node.key.name;

            // finds render() method definition
            if (methodName === 'render') {
                this.renderMethod = path;
            }

            const errorRenderMethod = state.opts.errorRenderMethod;
            if (errorRenderMethod && methodName === errorRenderMethod) {
                this.hasErrorRenderMethod = true;
            }
        },
    };

    return {
        visitor: {
            Program: {
                exit(path, state) {
                    if (!state.insertErrorHandler) {
                        return;
                    }

                    if (!state.opts.errorHandler && !state.opts.errorRenderMethod) {
                        throw Error('[babel-plugin-transform-react-ssr-try-catch] You must define "errorHandler" or "errorRenderMethod" property');
                    }

                    if (state.opts.type !== 'module') {
                        const varName = t.identifier(errorHandlerName);
                        const variableDeclaration = t.variableDeclaration('const', [
                            t.variableDeclarator(
                                varName,
                                t.callExpression(t.identifier('require'), [ t.stringLiteral(state.opts.errorHandler) ]),
                            ),
                        ]);
                        path.unshiftContainer('body', variableDeclaration);
                    } else {
                        const importName = t.identifier(errorHandlerName);
                        const importDeclaration = t.importDeclaration([ t.importDefaultSpecifier(importName) ], t.stringLiteral(state.opts.errorHandler));
                        path.unshiftContainer('body', importDeclaration);
                    }
                },
            },
            Class(path, state) {
                if (!isReactClass(path.node)) {
                    return;
                }

                const opts = state.opts;

                const visitorState = {
                    renderMethod: null,
                    opts: opts,
                };

                path.traverse(bodyVisitor, visitorState);

                if (!visitorState.renderMethod) {
                    return;
                }

                // generate new render() method
                if (visitorState.hasErrorRenderMethod) {
                    // rename original render() method
                    visitorState.renderMethod.node.key.name = originalRenderMethodName;

                    path.get('body').unshiftContainer('body',
                        t.classMethod(
                            'method',
                            t.identifier('render'),
                            [],
                            t.blockStatement([
                                t.tryStatement(
                                    t.blockStatement([
                                        t.returnStatement(t.callExpression(
                                            t.memberExpression(t.thisExpression(), t.identifier('__originalRenderMethod__')),
                                            [],
                                        )),
                                    ]),
                                    t.catchClause(t.identifier('e'), t.blockStatement([
                                        t.returnStatement(t.callExpression(
                                            t.memberExpression(t.thisExpression(), t.identifier(opts.errorRenderMethod)),
                                            [
                                                t.identifier('e'),
                                                t.memberExpression(
                                                    t.memberExpression(t.thisExpression(), t.identifier('constructor')),
                                                    t.identifier('name'),
                                                ),
                                            ],
                                        )),
                                    ])),
                                ),
                            ]),
                        ),
                    );

                } else if (opts.errorHandler) {
                    // rename original render() method
                    visitorState.renderMethod.node.key.name = originalRenderMethodName;

                    path.get('body').unshiftContainer('body',
                        t.classMethod('method', t.identifier('render'), [], t.blockStatement([
                            t.tryStatement(
                                t.blockStatement([
                                    t.returnStatement(t.callExpression(
                                        t.memberExpression(t.thisExpression(), t.identifier('__originalRenderMethod__')),
                                        [],
                                    )),
                                ]),
                                t.catchClause(t.identifier('e'), t.blockStatement([
                                    t.returnStatement(t.callExpression(
                                        t.identifier('ReactSSRErrorHandler'),
                                        [
                                            t.identifier('e'),
                                            t.memberExpression(
                                                t.memberExpression(t.thisExpression(), t.identifier('constructor')),
                                                t.identifier('name'),
                                            ),
                                            t.thisExpression(),
                                        ],
                                    )),
                                ])),
                            ),
                        ])),
                    );

                    // pass info for Program:exit to create "const ReactSSRErrorHandler = require('./errorHandler')"
                    state.insertErrorHandler = true;
                }
            },
        },
    };
};
