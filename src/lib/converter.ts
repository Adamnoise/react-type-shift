
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
    if (t.isMemberExpression(propType) && 
        t.isIdentifier(propType.object) && 
        propType.object.name === 'PropTypes') {
      
      if (t.isIdentifier(property)) {
        switch (property.name) {
          case 'string': return 'string';
          case 'number': return 'number';
          case 'bool': return 'boolean';
          case 'func': return 'Function';
          case 'array': return 'any[]';
          case 'object': return 'Record<string, unknown>';
          case 'node': return 'React.ReactNode';
          case 'element': return 'React.ReactElement';
          case 'any': return 'unknown';
          case 'arrayOf': 
            // Handle array types if possible
            return 'Array<unknown>';
          case 'shape':
            // Complex shapes would need more processing
            return 'Record<string, unknown>'; 
          case 'oneOf':
          case 'oneOfType':
            // Union types would need more processing
            return 'unknown';
          default:
            return 'unknown';
        }
      }
    }
  }
  return 'unknown';
};

/**
 * Creates a TypeScript interface from propTypes
 */
const createTypeInterface = (componentName: string, propTypes: any): string => {
  const properties: string[] = [];
  
  Object.entries(propTypes).forEach(([key, value]: [string, any]) => {
    // Check if prop is required
    const isRequired = t.isMemberExpression(value) && 
                      t.isIdentifier(value.property) &&
                      value.property.name === 'isRequired';
    
    const type = propTypeToTSType(isRequired ? value.object : value);
    properties.push(`  ${key}${isRequired ? '' : '?'}: ${type};`);
  });

  return `interface ${componentName}Props {\n${properties.join('\n')}\n}`;
};

/**
 * Adds TypeScript type annotations to React components
 */
const addTypeAnnotationToFunction = (path: any, componentName: string, hasProps: boolean) => {
  // Biztosítsuk, hogy a node és a megfelelő tulajdonságok léteznek
  if (!path || !path.node) {
    console.log("Warning: Trying to add type annotation to undefined node");
    return;
  }

  // Add type annotation to the function parameters
  if (hasProps) {
    if (path.node.params && path.node.params.length > 0) {
      if (t.isArrowFunctionExpression(path.node)) {
        // For destructured props
        if (t.isObjectPattern(path.node.params[0])) {
          const paramName = 'props';
          const props = path.node.params[0];
          path.node.params[0] = t.identifier(`${paramName}: ${componentName}Props`);
          
          // Ensure body is a block statement
          if (!t.isBlockStatement(path.node.body)) {
            path.node.body = t.blockStatement([
              t.variableDeclaration('const', [
                t.variableDeclarator(props, t.identifier(paramName))
              ]),
              t.returnStatement(path.node.body)
            ]);
          } else {
            path.node.body.body.unshift(
              t.variableDeclaration('const', [
                t.variableDeclarator(props, t.identifier(paramName))
              ])
            );
          }
        } else {
          path.node.params[0] = t.identifier(`props: ${componentName}Props`);
        }
      } else if (t.isFunctionDeclaration(path.node)) {
        if (t.isObjectPattern(path.node.params[0])) {
          const paramName = 'props';
          const props = path.node.params[0];
          path.node.params[0] = t.identifier(`${paramName}: ${componentName}Props`);
          path.node.body.body.unshift(
            t.variableDeclaration('const', [
              t.variableDeclarator(props, t.identifier(paramName))
            ])
          );
        } else {
          path.node.params[0] = t.identifier(`props: ${componentName}Props`);
        }
      }
    }
  } else {
    // Add empty props interface for components with no props
    if (t.isArrowFunctionExpression(path.node)) {
      if (path.node.params.length === 0) {
        path.node.params.push(t.identifier(`props: ${componentName}Props`));
      }
    } else if (t.isFunctionDeclaration(path.node)) {
      if (path.node.params.length === 0) {
        path.node.params.push(t.identifier(`props: ${componentName}Props`));
      }
    }
  }

  // Add return type annotation - csak akkor ha a node megfelelő típusú
  if (t.isArrowFunctionExpression(path.node) || t.isFunctionDeclaration(path.node)) {
    path.node.returnType = t.tsTypeAnnotation(
      t.tsTypeReference(
        t.identifier('JSX.Element')
      )
    );
  }
};

/**
 * Helper function to check if a node is likely a React component
 */
function isReactComponent(node: any): boolean {
  // Check if function has JSX in its body
  let hasJSX = false;
  
  traverse.cheap(node, (subNode) => {
    if (t.isJSXElement(subNode) || t.isJSXFragment(subNode)) {
      hasJSX = true;
    }
  });
  
  return hasJSX;
}

/**
 * Helper function to check if a function is likely a React function component
 */
function isReactFunction(node: any): boolean {
  // Check if function returns JSX
  let hasJSX = false;
  
  if (t.isBlockStatement(node.body)) {
    traverse.cheap(node.body, (subNode) => {
      if (t.isJSXElement(subNode) || t.isJSXFragment(subNode) || t.isReturnStatement(subNode)) {
        if (t.isReturnStatement(subNode) && subNode.argument && 
          (t.isJSXElement(subNode.argument) || t.isJSXFragment(subNode.argument))) {
          hasJSX = true;
        } else if (t.isJSXElement(subNode) || t.isJSXFragment(subNode)) {
          hasJSX = true;
        }
      }
    });
  } else if (t.isJSXElement(node.body) || t.isJSXFragment(node.body)) {
    hasJSX = true;
  }
  
  return hasJSX;
}

/**
 * Main conversion function
 */
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
    let componentNames = new Set<string>();
    let componentHasProps = new Map<string, boolean>();

    // First pass - collect component names and detect PropTypes
    traverse(ast, {
      ImportDeclaration(path) {
        if (path.node.source.value === 'react') {
          hasReactImport = true;
        }
        if (path.node.source.value === 'prop-types') {
          hasPropTypesImport = true;
        }
      },
      FunctionDeclaration(path) {
        if (path.node.id && t.isIdentifier(path.node.id) && 
            isReactComponent(path.node)) {
          componentNames.add(path.node.id.name);
        }
      },
      VariableDeclarator(path) {
        if (t.isIdentifier(path.node.id) && 
            path.node.init &&
            (t.isArrowFunctionExpression(path.node.init) || 
             t.isFunctionExpression(path.node.init)) && 
            isReactFunction(path.node.init)) {
          componentNames.add(path.node.id.name);
        }
      },
      AssignmentExpression(path) {
        if (
          t.isMemberExpression(path.node.left) &&
          t.isIdentifier(path.node.left.property) &&
          path.node.left.property.name === 'propTypes' &&
          t.isIdentifier(path.node.left.object)
        ) {
          const componentName = path.node.left.object.name;
          componentHasProps.set(componentName, true);
          
          // Get the properties from the right side
          if (t.isObjectExpression(path.node.right)) {
            const propTypes = path.node.right.properties.reduce((acc: any, prop: any) => {
              if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
                acc[prop.key.name] = prop.value;
              }
              return acc;
            }, {});
            
            const interfaceStr = createTypeInterface(componentName, propTypes);
            interfaces.push(interfaceStr);
          }
          
          // Remove PropTypes assignment
          path.remove();
        }
      }
    });

    // Remove PropTypes import
    traverse(ast, {
      ImportDeclaration(path) {
        if (path.node.source.value === 'prop-types') {
          path.remove();
        }
      }
    });

    // Second pass - add type annotations to components
    traverse(ast, {
      FunctionDeclaration(path) {
        if (path.node.id && t.isIdentifier(path.node.id)) {
          const componentName = path.node.id.name;
          if (componentNames.has(componentName)) {
            const hasProps = componentHasProps.get(componentName) || false;
            addTypeAnnotationToFunction(path, componentName, hasProps);
            
            // If no PropTypes were found but component exists, add empty interface
            if (!componentHasProps.has(componentName) && !interfaces.some(i => i.includes(`interface ${componentName}Props`))) {
              interfaces.push(`interface ${componentName}Props {}`);
            }
          }
        }
      },
      VariableDeclarator(path) {
        if (
          t.isIdentifier(path.node.id) &&
          path.node.init &&
          (t.isArrowFunctionExpression(path.node.init) || t.isFunctionExpression(path.node.init))
        ) {
          const componentName = path.node.id.name;
          if (componentNames.has(componentName)) {
            const hasProps = componentHasProps.get(componentName) || false;
            try {
              addTypeAnnotationToFunction(path.node.init, componentName, hasProps);
              
              // If no PropTypes were found but component exists, add empty interface
              if (!componentHasProps.has(componentName) && !interfaces.some(i => i.includes(`interface ${componentName}Props`))) {
                interfaces.push(`interface ${componentName}Props {}`);
              }
            } catch (error) {
              console.error(`Error adding type annotation to ${componentName}:`, error);
            }
          }
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
    throw new Error(`Failed to convert JSX to TSX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
