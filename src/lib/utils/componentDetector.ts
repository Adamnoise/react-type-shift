
import * as t from '@babel/types';
import traverse from '@babel/traverse';

/**
 * Checks if a function likely returns JSX
 */
export const isReactFunction = (node: any): boolean => {
  if (!node) return false;
  
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
};

/**
 * Checks if a FunctionDeclaration has JSX
 */
export const isReactComponent = (node: any): boolean => {
  if (!node) return false;
  
  let hasJSX = false;
  traverse.cheap(node, (subNode) => {
    if (t.isJSXElement(subNode) || t.isJSXFragment(subNode)) {
      hasJSX = true;
    }
  });
  return hasJSX;
};
