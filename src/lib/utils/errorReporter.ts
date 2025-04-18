
/**
 * Error reporting utilities for the JSX to TSX converter
 */
import { ConversionErrorDetails } from '../types';

/**
 * Parse an error and extract line and column information if available
 */
const parseErrorLineAndColumn = (error: any): { line: number; column: number } => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Try to extract line and column numbers from the error message using regex
  const lineMatch = errorMessage.match(/line:?\s*(\d+)/i);
  const columnMatch = errorMessage.match(/column:?\s*(\d+)/i);
  
  const line = lineMatch ? parseInt(lineMatch[1], 10) : 0;
  const column = columnMatch ? parseInt(columnMatch[1], 10) : 0;
  
  return { line, column };
};

/**
 * Get a code snippet around the error location
 */
const getCodeSnippet = (code: string, line: number, column: number): string | undefined => {
  if (!code || line <= 0) return undefined;
  
  const lines = code.split('\n');
  
  if (line > lines.length) return undefined;
  
  // Get 3 lines before and after the error, if available
  const startLine = Math.max(0, line - 3);
  const endLine = Math.min(lines.length - 1, line + 2);
  
  return lines.slice(startLine, endLine + 1)
    .map((l, i) => `${startLine + i + 1}${startLine + i + 1 === line ? ' > ' : '   '} ${l}`)
    .join('\n');
};

/**
 * Generate error suggestions based on the error message
 */
const generateSuggestions = (error: any): string[] => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const suggestions: string[] = [];
  
  // Check for common errors and provide suggestions
  if (errorMessage.includes('Unexpected token')) {
    suggestions.push('Check for syntax errors like missing brackets or parentheses.');
    suggestions.push('Verify that all JSX tags are properly closed.');
  }
  
  if (errorMessage.includes('propTypes')) {
    suggestions.push('Make sure propTypes are defined correctly.');
    suggestions.push('Consider using TypeScript interfaces instead of PropTypes.');
  }
  
  if (errorMessage.includes('import') || errorMessage.includes('require')) {
    suggestions.push('Verify that all imported modules are available.');
    suggestions.push('Check the import syntax and path correctness.');
  }
  
  // If no specific suggestions were added, add generic ones
  if (suggestions.length === 0) {
    suggestions.push('Review the code for syntax errors.');
    suggestions.push('Ensure the JSX code is valid before conversion.');
  }
  
  return suggestions;
};

/**
 * Map error codes based on error message patterns
 */
const mapErrorToCode = (error: any): string => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  if (errorMessage.includes('Unexpected token')) return 'SYNTAX_ERROR';
  if (errorMessage.includes('propTypes')) return 'PROP_TYPES_ERROR';
  if (errorMessage.includes('import') || errorMessage.includes('require')) return 'IMPORT_ERROR';
  if (errorMessage.includes('JSX')) return 'JSX_ERROR';
  
  return 'CONVERSION_ERROR';
};

/**
 * Generate detailed error information from an error object
 */
export const generateErrorDetails = (error: any, code: string): ConversionErrorDetails => {
  const { line, column } = parseErrorLineAndColumn(error);
  const codeSnippet = getCodeSnippet(code, line, column);
  const suggestions = generateSuggestions(error);
  const errorCode = mapErrorToCode(error);
  
  return {
    message: error instanceof Error ? error.message : String(error),
    line,
    column,
    severity: 'error',
    code: errorCode,
    codeSnippet,
    suggestions
  };
};
