
/**
 * Types for the JSX to TSX converter
 */

export type ConversionLevel = 'basic' | 'standard' | 'advanced';

export interface ConversionConfig {
  /**
   * Level of conversion to perform
   * - basic: Simple JSX to TSX conversion with minimal type annotations
   * - standard: Default conversion with prop type interfaces
   * - advanced: Full conversion with React hooks optimization and detailed typing
   */
  conversionLevel: ConversionLevel;
  
  /**
   * Whether to use custom interface naming
   */
  customInterfaceNaming?: boolean;
  
  /**
   * Prefix to add to interface names
   */
  interfacePrefix?: string;
  
  /**
   * Suffix to add to interface names
   */
  interfaceSuffix?: string;
  
  /**
   * Whether to include JSDoc comments in the output
   */
  includeJSDoc?: boolean;
  
  /**
   * Whether to preserve original formatting
   */
  preserveFormatting?: boolean;
}

export interface ConversionErrorDetails {
  /**
   * Error message
   */
  message: string;
  
  /**
   * Line number where the error occurred
   */
  line: number;
  
  /**
   * Column number where the error occurred
   */
  column: number;
  
  /**
   * Error severity: 'error', 'warning', or 'info'
   */
  severity: 'error' | 'warning' | 'info';
  
  /**
   * Error code for reference
   */
  code: string;
  
  /**
   * Code snippet where the error occurred
   */
  codeSnippet?: string;
  
  /**
   * Suggestions for fixing the error
   */
  suggestions?: string[];
}
