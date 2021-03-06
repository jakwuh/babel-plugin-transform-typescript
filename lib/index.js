"use strict";

exports.__esModule = true;

exports.default = function (_ref) {
  var t = _ref.types;
  return {
    inherits: _babelPluginSyntaxTypescript2.default,
    visitor: {
      Pattern: visitPattern,
      Identifier: visitPattern,
      RestElement: visitPattern,
      Program: function Program(path, state) {
        state.programPath = path;
      },
      ImportDeclaration: function ImportDeclaration(path, state) {
        if (path.node.specifiers.length === 0) {
          return;
        }

        var allElided = true;
        var importsToRemove = [];

        for (var _iterator = path.node.specifiers, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
          var _ref2;

          if (_isArray) {
            if (_i >= _iterator.length) break;
            _ref2 = _iterator[_i++];
          } else {
            _i = _iterator.next();
            if (_i.done) break;
            _ref2 = _i.value;
          }

          var _specifier = _ref2;
          var binding = path.scope.getBinding(_specifier.local.name);

          if (binding && isImportTypeOnly(binding, state.programPath)) {
            importsToRemove.push(binding.path);
          } else {
            allElided = false;
          }
        }

        if (allElided) {
          path.remove();
        } else {
          for (var _i2 = 0; _i2 < importsToRemove.length; _i2++) {
            var importPath = importsToRemove[_i2];
            importPath.remove();
          }
        }
      },
      TSDeclareFunction: function TSDeclareFunction(path) {
        path.remove();
      },
      TSDeclareMethod: function TSDeclareMethod(path) {
        path.remove();
      },
      VariableDeclaration: function VariableDeclaration(path) {
        if (path.node.declare) path.remove();
      },
      ClassMethod: function ClassMethod(path) {
        var node = path.node;
        if (node.accessibility) node.accessibility = null;
        if (node.abstract) node.abstract = null;
        if (node.optional) node.optional = null;

        if (node.kind !== "constructor") {
          return;
        }

        var parameterProperties = [];

        for (var _iterator2 = node.params, _isArray2 = Array.isArray(_iterator2), _i3 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
          var _ref3;

          if (_isArray2) {
            if (_i3 >= _iterator2.length) break;
            _ref3 = _iterator2[_i3++];
          } else {
            _i3 = _iterator2.next();
            if (_i3.done) break;
            _ref3 = _i3.value;
          }

          var _param = _ref3;

          if (_param.type === "TSParameterProperty") {
            parameterProperties.push(_param.parameter);
          }
        }

        if (!parameterProperties.length) {
          return;
        }

        var assigns = parameterProperties.map(function (p) {
          var name = void 0;

          if (t.isIdentifier(p)) {
            name = p.name;
          } else if (t.isAssignmentPattern(p) && t.isIdentifier(p.left)) {
            name = p.left.name;
          } else {
            throw path.buildCodeFrameError("Parameter properties can not be destructuring patterns.");
          }

          var id = t.identifier(name);
          var thisDotName = t.memberExpression(t.thisExpression(), id);
          var assign = t.assignmentExpression("=", thisDotName, id);
          return t.expressionStatement(assign);
        });
        var statements = node.body.body;
        var first = statements[0];
        var startsWithSuperCall = first !== undefined && t.isExpressionStatement(first) && t.isCallExpression(first.expression) && t.isSuper(first.expression.callee);
        node.body.body = startsWithSuperCall ? [first].concat(assigns, statements.slice(1)) : [].concat(assigns, statements);
      },
      TSParameterProperty: function TSParameterProperty(path) {
        path.replaceWith(path.node.parameter);
      },
      ClassProperty: function ClassProperty(path) {
        var node = path.node;

        if (!node.value) {
          path.remove();
          return;
        }

        if (node.accessibility) node.accessibility = null;
        if (node.abstract) node.abstract = null;
        if (node.optional) node.optional = null;
        if (node.typeAnnotation) node.typeAnnotation = null;
      },
      TSIndexSignature: function TSIndexSignature(path) {
        path.remove();
      },
      ClassDeclaration: function ClassDeclaration(path) {
        var node = path.node;

        if (node.declare) {
          path.remove();
          return;
        }

        if (node.abstract) node.abstract = null;
      },
      Class: function Class(_ref4) {
        var node = _ref4.node;
        if (node.typeParameters) node.typeParameters = null;
        if (node.superTypeParameters) node.superTypeParameters = null;
        if (node.implements) node.implements = null;
      },
      Function: function Function(_ref5) {
        var node = _ref5.node;
        if (node.typeParameters) node.typeParameters = null;
        if (node.returnType) node.returnType = null;
        var p0 = node.params[0];

        if (p0 && t.isIdentifier(p0) && p0.name === "this") {
          node.params.shift();
        }
      },
      TSModuleDeclaration: function TSModuleDeclaration(path) {
        if (!path.node.declare && path.node.id.type !== "StringLiteral") {
          throw path.buildCodeFrameError("Namespaces are not supported.");
        }

        path.remove();
      },
      TSInterfaceDeclaration: function TSInterfaceDeclaration(path) {
        path.remove();
      },
      TSTypeAliasDeclaration: function TSTypeAliasDeclaration(path) {
        path.remove();
      },
      TSEnumDeclaration: function TSEnumDeclaration(path) {
        (0, _enum2.default)(path, t);
      },
      TSImportEqualsDeclaration: function TSImportEqualsDeclaration(path) {
        throw path.buildCodeFrameError("`import =` is not supported.");
      },
      TSExportAssignment: function TSExportAssignment(path) {
        throw path.buildCodeFrameError("`export =` is not supported.");
      },
      TSTypeAssertion: function TSTypeAssertion(path) {
        path.replaceWith(path.node.expression);
      },
      TSAsExpression: function TSAsExpression(path) {
        path.replaceWith(path.node.expression);
      },
      TSNonNullExpression: function TSNonNullExpression(path) {
        path.replaceWith(path.node.expression);
      },
      CallExpression: function CallExpression(path) {
        path.node.typeParameters = null;
      },
      NewExpression: function NewExpression(path) {
        path.node.typeParameters = null;
      }
    }
  };

  function visitPattern(_ref6) {
    var node = _ref6.node;
    if (node.typeAnnotation) node.typeAnnotation = null;
    if (t.isIdentifier(node) && node.optional) node.optional = null;
  }

  function isImportTypeOnly(binding, programPath) {
    for (var _iterator3 = binding.referencePaths, _isArray3 = Array.isArray(_iterator3), _i4 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
      var _ref7;

      if (_isArray3) {
        if (_i4 >= _iterator3.length) break;
        _ref7 = _iterator3[_i4++];
      } else {
        _i4 = _iterator3.next();
        if (_i4.done) break;
        _ref7 = _i4.value;
      }

      var _path = _ref7;

      if (!isInType(_path)) {
        return false;
      }
    }

    if (binding.identifier.name != "React") {
      return true;
    }

    var sourceFileHasJsx = false;
    programPath.traverse({
      JSXElement: function JSXElement() {
        sourceFileHasJsx = true;
      }
    });
    return !sourceFileHasJsx;
  }
};

var _babelPluginSyntaxTypescript = require("babel-plugin-syntax-typescript");

var _babelPluginSyntaxTypescript2 = _interopRequireDefault(_babelPluginSyntaxTypescript);

var _enum = require("./enum");

var _enum2 = _interopRequireDefault(_enum);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function isInType(path) {
  switch (path.parent.type) {
    case "TSTypeReference":
    case "TSQualifiedName":
    case "TSExpressionWithTypeArguments":
    case "TSTypeQuery":
      return true;

    default:
      return false;
  }
}