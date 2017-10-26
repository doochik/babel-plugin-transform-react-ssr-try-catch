'use strict';

const babylon = require('babylon');

const errorHandlerName = 'ReactRenderTryCatchErrorHandler';
const originalRenderMethodName = '__originalRenderMethod__';

const tryCatchRender = `try{return this.__originalRenderMethod__();}catch(e){return ${ errorHandlerName }(e, this.constructor.name)}`;
const tryCatchRenderAST = babylon.parse(tryCatchRender, {allowReturnOutsideFunction: true}).program.body[0];


module.exports = function(_ref) {
    const t = _ref.types;

    const isReactClass = createReactChecker(t);

    const bodyVisitor = {
        ClassMethod: function ClassMethod(path) {
            if (path.node.key.name === 'render') {
                this.renderMethod = path;
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

                    if (!state.opts.errorHandler) {
                        throw Error('[babel-plugin-transform-react-render-try-catch] You must define "errorHandler" property');
                    }

                    const varName = t.identifier(errorHandlerName);
                    const variableDeclaration = t.variableDeclaration('const', [
                        t.variableDeclarator(
                            varName,
                            t.callExpression(t.identifier('require'), [t.stringLiteral(state.opts.errorHandler)])
                        )
                    ]);
                    path.unshiftContainer('body', variableDeclaration);
                }
            },
            Class: function Class(path, pass) {
                if (!isReactClass(path.node)) {
                    return;
                }

                const state = {
                    renderMethod: null,
                };

                path.traverse(bodyVisitor, state);

                if (!state.renderMethod) {
                    return;
                }

                // rename
                state.renderMethod.node.key.name = originalRenderMethodName;

                // generate new render() method
                path.get("body").unshiftContainer("body",
                    t.classMethod("method", t.identifier("render"), [], t.blockStatement([tryCatchRenderAST]))
                );

                // pass info to create require('./errorHandler')
                pass.insertErrorHandler = true;
            }
        }
    };
};

function createReactChecker(t) {
    return function isReactClass(node) {
        const superClass = node.superClass;
        return t.isMemberExpression(superClass) &&
            t.isIdentifier(superClass.object, {name: 'React'}) &&
            (
                t.isIdentifier(superClass.property, {name: 'Component'}) ||
                t.isIdentifier(superClass.property, {name: 'PureComponent'})
            );
    };
}
