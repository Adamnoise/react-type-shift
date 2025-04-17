
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';

const propTypeToTSType = (propType: any): string => {
  if (t.isMemberExpression(propType)) {
    const property = propType.property as t.Identifier;
    const object = propType.object as t.MemberExpression;
    
    // Handle isRequired
    const isFromPropTypes = object && 
      t.isMemberExpression(object) && 
      (object.object as t.Identifier).name === 'PropTypes';
    
    if (isFromPropTypes) {
      switch (property.name) {
        case 'isRequired':
          return propTypeToTSType(object);
        case 'string':
          return 'string';
        case 'number':
          return 'number';
        case 'bool':
          return 'boolean';
        case 'func':
          return 'Function';
        case 'array':
          return 'any[]';
        case 'object':
          return 'Record<string, unknown>';
        case 'node':
          return 'React.ReactNode';
        case 'element':
          return 'React.ReactElement';
        case 'any':
          return 'unknown';
        default:
          return 'unknown';
      }
    }
  }
  return 'unknown';
};

const createTypeInterface = (componentName: string, propTypes: any): string => {
  const properties: string[] = [];
  
  Object.entries(propTypes).forEach(([key, value]: [string, any]) => {
    const isRequired = t.isMemberExpression(value) && 
                      t.isMemberExpression(value.object) && 
                      (value.object.property as t.Identifier).name === 'isRequired';
    
    const type = propTypeToTSType(isRequired ? value.object : value);
    properties.push(`  ${key}${isRequired ? '' : '?'}: ${type};`);
  });

  return `interface ${componentName}Props {\n${properties.join('\n')}\n}`;
};

const addTypeAnnotationToFunction = (path: any, componentName: string) => {
  // Add return type annotation
  path.node.returnType = t.tsTypeAnnotation(
    t.tsTypeReference(
      t.identifier('JSX.Element')
    )
  );

  // Add type annotation to the function
  if (t.isArrowFunctionExpression(path.node)) {
    path.node.params[0] = t.identifier(`props: ${componentName}Props`);
  } else if (t.isFunctionDeclaration(path.node)) {
    path.node.params[0] = t.identifier(`props: ${componentName}Props`);
  }
};

export const convertJSXToTSX = (code: string): string => {
  try {
    // Parse JSX code into an AST
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });

    let interfaces: string[] = [];
    let hasReactImport = false;
    let hasPropTypesImport = false;

    // Transform PropTypes to TypeScript interfaces
    traverse(ast, {
      ImportDeclaration(path) {
        if (path.node.source.value === 'react') {
          hasReactImport = true;
        }
        if (path.node.source.value === 'prop-types') {
          hasPropTypesImport = true;
          path.remove();
        }
      },

      // Convert PropTypes to TypeScript interfaces
      AssignmentExpression(path) {
        if (
          t.isMemberExpression(path.node.left) &&
          t.isIdentifier(path.node.left.property) &&
          path.node.left.property.name === 'propTypes'
        ) {
          const componentName = (path.node.left.object as t.Identifier).name;
          const propTypes = path.node.right.properties;
          
          const interfaceStr = createTypeInterface(
            componentName,
            propTypes.reduce((acc: any, prop: any) => {
              acc[prop.key.name] = prop.value;
              return acc;
            }, {})
          );
          
          interfaces.push(interfaceStr);
          path.remove();
        }
      },

      // Add TypeScript annotations to function components
      FunctionDeclaration(path) {
        if (path.node.id) {
          const componentName = path.node.id.name;
          addTypeAnnotationToFunction(path, componentName);
        }
      },

      // Handle arrow function components
      VariableDeclarator(path) {
        if (
          t.isIdentifier(path.node.id) &&
          t.isArrowFunctionExpression(path.node.init)
        ) {
          const componentName = path.node.id.name;
          addTypeAnnotationToFunction(path.node.init, componentName);
        }
      }
    });

    // Generate TypeScript code from transformed AST
    const output = generate(ast, {
      retainLines: true,
      comments: true,
    });

    // Construct the final output
    let result = '';
    
    // Add React import if needed
    if (!hasReactImport) {
      result += `import React from 'react';\n\n`;
    }

    // Add interfaces
    if (interfaces.length > 0) {
      result += `${interfaces.join('\n\n')}\n\n`;
    }

    // Add the main component code
    result += output.code;

    return result;
  } catch (error) {
    console.error('Error converting JSX to TSX:', error);
    throw new Error('Failed to convert JSX to TSX');
  }
};
