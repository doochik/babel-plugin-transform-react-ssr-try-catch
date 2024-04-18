'use strict';

const babelParser = require('@babel/parser');

const errorHandlerName = 'ReactSSRErrorHandler';
const originalRenderMethodName = '__originalRenderMethod__';

const createReactChecker = (t) => (node) => {
    const superClass = node.superClass;
    return t.isIdentifier(superClass, {name: 'Component'}) ||
        t.isIdentifier(superClass, {name: 'PureComponent'}) ||
        t.isMemberExpression(superClass) && (
            t.isIdentifier(superClass.object, {name: 'React'}) &&
            (
                t.isIdentifier(superClass.property, {name: 'Component'}) ||
                t.isIdentifier(superClass.property, {name: 'PureComponent'})
            )
        );
};

const getRenderMethodWithErrorHandler = (() => {
    const tryCatchRender = `try{return this.__originalRenderMethod__();}catch(e){return ${ errorHandlerName }(e, this.constructor.name, this)}`;
    let tryCatchRenderAST;

    return () => {
        if (!tryCatchRenderAST) {
            tryCatchRenderAST = babelParser.parse(tryCatchRender, {allowReturnOutsideFunction: true}).program.body[0];
        }

        return tryCatchRenderAST;
    };
})();

const getRenderMethodWithErrorRenderMethod = (() => {
    let tryCatchRenderAST;

    return (errorRenderMethod) => {
        if (!tryCatchRenderAST) {
            const tryCatchRender = `try{return this.__originalRenderMethod__();}catch(e){return this.${ errorRenderMethod }(e, this.constructor.name)}`;
            tryCatchRenderAST = babelParser.parse(tryCatchRender, {allowReturnOutsideFunction: true}).program.body[0];
        }

        return tryCatchRenderAST;
    };
})();

module.exports = (_ref) => {
    const t = _ref.types;

    const isReactClass = createReactChecker(t);

    const bodyVisitor = {
        ClassMethod: function(path, state) {
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
                                t.callExpression(t.identifier('require'), [t.stringLiteral(state.opts.errorHandler)])
                            )
                        ]);
                        path.unshiftContainer('body', variableDeclaration);
                    } else {
                        const importName = t.identifier(errorHandlerName);
                        const importDeclaration = t.importDeclaration([t.importDefaultSpecifier(importName)], t.stringLiteral(state.opts.errorHandler));
                        path.unshiftContainer('body', importDeclaration);
                    }
                }
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
                            t.blockStatement([ getRenderMethodWithErrorRenderMethod(opts.errorRenderMethod) ])
                        )
                    );

                } else if (opts.errorHandler) {
                    // rename original render() method
                    visitorState.renderMethod.node.key.name = originalRenderMethodName;

                    path.get('body').unshiftContainer('body',
                        t.classMethod('method', t.identifier('render'), [], t.blockStatement([ getRenderMethodWithErrorHandler() ]))
                    );

                    // pass info for Program:exit to create "const ReactSSRErrorHandler = require('./errorHandler')"
                    state.insertErrorHandler = true;
                }
            }
        }
    };
};
