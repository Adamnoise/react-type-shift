
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import { createTypeInterface } from './utils/interfaceGenerator';
import { addTypeAnnotationToFunction } from './utils/functionAnnotator';
import { isReactFunction, isReactComponent } from './utils/componentDetector';
import { detectHooksAndProcessTypes } from './utils/hookProcessor';
import { ConversionConfig } from './types';

/**
 * Converts JSX to TSX using AST transformation
 * @param code - The JSX code to convert
 * @param config - Optional conversion configuration
 * @returns The converted TSX code
 */
export const convertJSXToTSX = (code: string, config?: ConversionConfig): string => {
  if (!code) {
    throw new Error('No code provided for conversion');
  }

  try {
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });

    let interfaces: string[] = [];
    const componentNames = new Set<string>();
    const componentHasProps = new Map<string, boolean>();
    let hasReactImport = false;

    // Apply conversion level-specific options
    const conversionLevel = config?.conversionLevel || 'standard';
    const shouldProcessHooks = conversionLevel === 'advanced';
    const useCustomNaming = config?.customInterfaceNaming || false;
    const namingPrefix = config?.interfacePrefix || '';
    const namingSuffix = config?.interfaceSuffix || 'Props';

    // Collect data and strip propTypes
    traverse(ast, {
      ImportDeclaration(path) {
        if (path.node.source.value === 'react') hasReactImport = true;
        if (path.node.source.value === 'prop-types') {
          path.remove();
        }
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
        if (
          t.isMemberExpression(path.node.left) &&
          t.isIdentifier(path.node.left.property, { name: 'propTypes' }) &&
          t.isIdentifier(path.node.left.object) &&
          t.isObjectExpression(path.node.right)
        ) {
          const componentName = path.node.left.object.name;
          componentHasProps.set(componentName, true);
          
          const interfaceName = useCustomNaming 
            ? `${namingPrefix}${componentName}${namingSuffix}`
            : `${componentName}Props`;
            
          const interfaceStr = createTypeInterface(interfaceName, path.node.right.properties);
          
          if (interfaceStr) {
            interfaces.push(interfaceStr);
          }
          path.remove();
        }
      },
    });

    // If we're in advanced mode, detect and process React hooks
    if (shouldProcessHooks) {
      const hookResults = detectHooksAndProcessTypes(ast);
      if (hookResults.interfaces.length > 0) {
        interfaces = [...interfaces, ...hookResults.interfaces];
      }
    }

    // Add typing annotations to components
    traverse(ast, {
      FunctionDeclaration(path) {
        const name = path.node.id?.name;
        if (name && componentNames.has(name)) {
          const hasProps = componentHasProps.get(name) || false;
          const interfaceName = useCustomNaming 
            ? `${namingPrefix}${name}${namingSuffix}`
            : `${name}Props`;
            
          addTypeAnnotationToFunction(path, interfaceName, hasProps);
          
          if (!hasProps) {
            interfaces.push(`interface ${interfaceName} {}`);
          }
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
          const hasProps = componentHasProps.get(name) || false;
          const interfaceName = useCustomNaming 
            ? `${namingPrefix}${name}${namingSuffix}`
            : `${name}Props`;
            
          addTypeAnnotationToFunction({ node: path.node.init }, interfaceName, hasProps);
          
          if (!hasProps) {
            interfaces.push(`interface ${interfaceName} {}`);
          }
        }
      },
    });

    // Generate code with comments
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
    throw new Error(`JSX ➝ TSX failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};
