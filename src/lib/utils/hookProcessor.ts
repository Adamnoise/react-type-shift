
/**
 * Utilities for processing React hooks and generating appropriate TypeScript types
 */
import traverse from '@babel/traverse';
import * as t from '@babel/types';

/**
 * Detect React hooks in the code and generate appropriate types
 * @param ast - The AST to process
 * @returns Object containing generated interfaces and hook usage info
 */
export const detectHooksAndProcessTypes = (ast: any) => {
  const interfaces: string[] = [];
  const hooksUsed: Set<string> = new Set();
  
  // Traverse the AST to find hook usages
  traverse(ast, {
    CallExpression(path) {
      if (t.isIdentifier(path.node.callee) && path.node.callee.name.startsWith('use')) {
        const hookName = path.node.callee.name;
        hooksUsed.add(hookName);
        
        // Process specific hooks
        if (hookName === 'useState') {
          processUseStateHook(path, interfaces);
        } else if (hookName === 'useReducer') {
          processUseReducerHook(path, interfaces);
        } else if (hookName === 'useContext') {
          processUseContextHook(path, interfaces);
        }
      }
    }
  });
  
  return { interfaces, hooksUsed: Array.from(hooksUsed) };
};

/**
 * Process useState hooks and generate appropriate types
 */
const processUseStateHook = (path: any, interfaces: string[]) => {
  // Check for initial state that might indicate the type
  if (path.node.arguments.length > 0) {
    const stateDeclaration = path.findParent((p: any) => 
      t.isVariableDeclaration(p.node) || t.isVariableDeclarator(p.node)
    );
    
    if (stateDeclaration) {
      // Try to infer state type from the initial value
      const initialState = path.node.arguments[0];
      const stateType = inferTypeFromValue(initialState);
      
      // Find the variable name if possible
      let stateName = '';
      
      if (t.isVariableDeclarator(stateDeclaration.node) && t.isArrayPattern(stateDeclaration.node.id)) {
        const elements = stateDeclaration.node.id.elements;
        if (elements.length > 0 && t.isIdentifier(elements[0])) {
          stateName = elements[0].name;
        }
      }
      
      if (stateName && stateType !== 'any') {
        const capitalizedName = stateName.charAt(0).toUpperCase() + stateName.slice(1);
        interfaces.push(`interface ${capitalizedName}State {\n  value: ${stateType};\n}`);
      }
    }
  }
};

/**
 * Process useReducer hooks and generate appropriate types
 */
const processUseReducerHook = (path: any, interfaces: string[]) => {
  // Get the parent variable declaration
  const stateDeclaration = path.findParent((p: any) => 
    t.isVariableDeclaration(p.node) || t.isVariableDeclarator(p.node)
  );
  
  if (stateDeclaration && path.node.arguments.length > 0) {
    // Try to find the reducer function
    const reducerArg = path.node.arguments[0];
    if (t.isIdentifier(reducerArg)) {
      const reducerName = reducerArg.name;
      interfaces.push(
        `interface ${reducerName}State {\n  // TODO: Define the state shape here\n}\n\n` +
        `interface ${reducerName}Action {\n  type: string;\n  payload?: any;\n}`
      );
    }
  }
};

/**
 * Process useContext hooks and generate appropriate types
 */
const processUseContextHook = (path: any, interfaces: string[]) => {
  // If the context is directly referenced, create a type for it
  if (path.node.arguments.length > 0) {
    const contextArg = path.node.arguments[0];
    if (t.isIdentifier(contextArg)) {
      const contextName = contextArg.name;
      interfaces.push(`interface ${contextName}Value {\n  // TODO: Define the context value shape here\n}`);
    }
  }
};

/**
 * Infer TypeScript type from a value node in the AST
 */
const inferTypeFromValue = (node: any): string => {
  if (!node) return 'any';
  
  if (t.isStringLiteral(node)) return 'string';
  if (t.isNumericLiteral(node)) return 'number';
  if (t.isBooleanLiteral(node)) return 'boolean';
  if (t.isNullLiteral(node)) return 'null';
  if (t.isObjectExpression(node)) return 'Record<string, any>';
  if (t.isArrayExpression(node)) return 'any[]';
  if (t.isIdentifier(node) && node.name === 'undefined') return 'undefined';
  
  // Handle some common patterns
  if (t.isCallExpression(node)) {
    if (t.isIdentifier(node.callee) && node.callee.name === 'Array') return 'any[]';
    if (t.isIdentifier(node.callee) && node.callee.name === 'Object') return 'Record<string, any>';
    if (t.isIdentifier(node.callee) && node.callee.name === 'String') return 'string';
    if (t.isIdentifier(node.callee) && node.callee.name === 'Number') return 'number';
    if (t.isIdentifier(node.callee) && node.callee.name === 'Boolean') return 'boolean';
  }
  
  return 'any';
};
