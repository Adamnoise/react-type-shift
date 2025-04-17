import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';

/**
 * Maps PropTypes to TypeScript types
 */
const propTypeToTSType = (propType: any): string => {
  if (t.isMemberExpression(propType)) {
    const property = propType.property as t.Identifier;

    // Handle isRequired
    if (property.name === 'isRequired' && t.isMemberExpression(propType.object)) {
      return propTypeToTSType(propType.object);
    }

    // Handle PropTypes.X
    if (
      t.isIdentifier(propType.object) &&
      propType.object.name === 'PropTypes' &&
      t.isIdentifier(property)
    ) {
      switch (property.name) {
        case 'string':
          return 'string';
        case 'number':
          return 'number';
        case 'bool':
          return 'boolean';
        case 'func':
          return '(...args: any[]) => any';
        case 'array':
          return 'any[]';
        case 'object':
          return 'Record<string, any>';
        case 'node':
          return 'React.ReactNode';
        case 'element':
          return 'React.ReactElement';
        case 'any':
          return 'any';
        case 'arrayOf':
        case 'shape':
        case 'oneOf':
        case 'oneOfType':
          return 'any'; // Extend later if needed
        default:
          return 'any';
      }
    }
  }
  return 'any';
};

/**
 * Creates a TypeScript interface from propTypes
 */
const createTypeInterface = (componentName: string, propTypes: any): string => {
  const properties: string[] = [];

  Object.entries(propTypes).forEach(([key, value]: [string, any]) => {
    const isRequired =
      t.isMemberExpression(value) &&
      t.isIdentifier(value.property) &&
      value.property.name === 'isRequired';

    const type = propTypeToTSType(isRequired ? value.object : value);
    properties.push(`  ${key}${isRequired ? '' : '?'}: ${type};`);
  });

  return `interface ${componentName}Props {\n${properties.join('\n')}\n}`;
};

/**
 * Adds TS annotations to function-based React components
 */
const addTypeAnnotationToFunction = (path: any, componentName: string, hasProps: boolean) => {
  if (!path || !path.node) return;

  const applyProps = () => t.identifier(`props: ${componentName}Props`);

  const wrapDestructuredProps = (props: t.ObjectPattern) => {
    const paramName = 'props';
    return {
      param: t.identifier(`${paramName}: ${componentName}Props`),
      unpack: t.variableDeclaration('const', [
        t.variableDeclarator(props, t.identifier(paramName)),
      ]),
    };
  };

  const annotate = (fn: any) => {
    if (hasProps) {
      if (fn.params && fn.params.length > 0) {
        if (t.isObjectPattern(fn.params[0])) {
          const { param, unpack } = wrapDestructuredProps(fn.params[0]);
          fn.params[0] = param;

          if (t.isBlockStatement(fn.body)) {
            fn.body.body.unshift(unpack);
          } else {
            fn.body = t.blockStatement([unpack, t.returnStatement(fn.body)]);
          }
        } else {
          fn.params[0] = applyProps();
        }
      } else {
        fn.params = [applyProps()];
      }
    } else if (fn.params.length === 0) {
      fn.params = [applyProps()];
    }

    fn.returnType = t.tsTypeAnnotation(t.tsTypeReference(t.identifier('JSX.Element')));
  };

  annotate(path.node);
};

/**
 * Converts JSX to TSX using AST transformation
 */
export const convertJSXToTSX = (code: string): string => {
  try {
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });

    let interfaces: string[] = [];
    const componentNames = new Set<string>();
    const componentHasProps = new Map<string, boolean>();
    let hasReactImport = false;

    // Collect data and strip propTypes
    traverse(ast, {
      ImportDeclaration(path) {
        if (path.node.source.value === 'react') hasReactImport = true;
      },
      FunctionDeclaration(path) {
        if (path.node.id && isReactComponent(path.node)) {
          componentNames.add(path.node.id.name);
        }
      },
      VariableDeclarator(path) {
        if (
          t.isIdentifier(path.node.id) &&
          path.node.init &&
          (t.isArrowFunctionExpression(path.node.init) ||
            t.isFunctionExpression(path.node.init)) &&
          isReactFunction(path.node.init)
        ) {
          componentNames.add(path.node.id.name);
        }
      },
      AssignmentExpression(path) {
        const left = path.node.left;
        const right = path.node.right;

        if (
          t.isMemberExpression(left) &&
          t.isIdentifier(left.property, { name: 'propTypes' }) &&
          t.isIdentifier(left.object) &&
          t.isObjectExpression(right)
        ) {
          const componentName = left.object.name;
          componentHasProps.set(componentName, true);

          const propTypes = right.properties.reduce((acc: any, prop: any) => {
            if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
              acc[prop.key.name] = prop.value;
            }
            return acc;
          }, {});

          interfaces.push(createTypeInterface(componentName, propTypes));
          path.remove(); // remove PropTypes assignment
        }
      },
      ImportDeclaration(path) {
        if (path.node.source.value === 'prop-types') {
          path.remove(); // remove PropTypes import
        }
      },
    });

    // Add typing annotations to components
    traverse(ast, {
      FunctionDeclaration(path) {
        const name = path.node.id?.name;
        if (name && componentNames.has(name)) {
          const hasProps = componentHasProps.get(name) || false;
          addTypeAnnotationToFunction(path, name, hasProps);
          if (!hasProps) interfaces.push(`interface ${name}Props {}`);
        }
      },
      VariableDeclarator(path) {
        const name = t.isIdentifier(path.node.id) ? path.node.id.name : '';
        if (
          name &&
          componentNames.has(name) &&
          path.node.init &&
          (t.isArrowFunctionExpression(path.node.init) || t.isFunctionExpression(path.node.init))
        ) {
          try {
            const hasProps = componentHasProps.get(name) || false;
            addTypeAnnotationToFunction({ node: path.node.init }, name, hasProps);
            if (!hasProps) interfaces.push(`interface ${name}Props {}`);
          } catch (error) {
            console.error(`Annotation failed for ${name}:`, error);
          }
        }
      },
    });

    const output = generate(ast, {
      retainLines: true,
      comments: true,
    });

    return [
      !hasReactImport ? `import React from 'react';\n` : '',
      interfaces.join('\n\n') + '\n\n',
      output.code,
    ].join('');
  } catch (error) {
    console.error('Conversion failed:', error);
    throw new Error(`JSX ➝ TSX failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Checks if a function likely returns JSX
 */
function isReactFunction(node: any): boolean {
  if (t.isBlockStatement(node.body)) {
    let found = false;
    traverse.cheap(node.body, (subNode) => {
      if (t.isJSXElement(subNode) || t.isJSXFragment(subNode)) found = true;
      if (
        t.isReturnStatement(subNode) &&
        (t.isJSXElement(subNode.argument) || t.isJSXFragment(subNode.argument))
      ) {
        found = true;
      }
    });
    return found;
  }
  return t.isJSXElement(node.body) || t.isJSXFragment(node.body);
}

/**
 * Checks if a FunctionDeclaration has JSX
 */
function isReactComponent(node: any): boolean {
  let hasJSX = false;
  traverse.cheap(node, (subNode) => {
    if (t.isJSXElement(subNode) || t.isJSXFragment(subNode)) {
      hasJSX = true;
    }
  });
  return hasJSX;
}
