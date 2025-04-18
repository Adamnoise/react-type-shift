
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import { propTypeToTSType } from './utils/typeConverters';
import { createTypeInterface } from './utils/interfaceGenerator';
import { addTypeAnnotationToFunction } from './utils/functionAnnotator';
import { isReactFunction, isReactComponent } from './utils/componentDetector';

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
          interfaces.push(createTypeInterface(componentName, path.node.right.properties));
          path.remove();
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
          const hasProps = componentHasProps.get(name) || false;
          addTypeAnnotationToFunction({ node: path.node.init }, name, hasProps);
          if (!hasProps) interfaces.push(`interface ${name}Props {}`);
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
