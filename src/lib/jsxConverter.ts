
/**
 * JSX to TSX Converter Module
 * This module handles the conversion of JSX code to TypeScript TSX
 */
export class JSXConverter {
  /**
   * Converts JSX code to TypeScript TSX
   * @param jsxCode - The JSX code to convert
   * @returns The converted TSX code
   */
  static async convertJSXtoTSX(jsxCode: string): Promise<string> {
    try {
      // Simple implementation for now - will be enhanced with proper AST parsing
      return JSXConverter.performBasicConversion(jsxCode);
    } catch (error) {
      console.error("Error in JSX to TSX conversion:", error);
      throw new Error("Failed to convert JSX to TSX");
    }
  }

  /**
   * Performs a basic conversion of JSX to TSX
   * In a real implementation, this would use proper AST parsing libraries
   */
  private static performBasicConversion(jsxCode: string): string {
    // Basic extraction of component names and props
    const componentMatches = jsxCode.match(/function\s+(\w+)\s*\((?:props|\{.*?\})\)/g) || 
                             jsxCode.match(/const\s+(\w+)\s*=\s*\((?:props|\{.*?\})\)/g) ||
                             jsxCode.match(/class\s+(\w+)\s+extends\s+React\.Component/g);

    // Extract PropTypes declarations
    const propTypesPattern = /(\w+)\.propTypes\s*=\s*\{([^}]+)\}/gs;
    const propTypesMatches = [...jsxCode.matchAll(propTypesPattern)];
    
    let tsxCode = jsxCode;

    // Add TypeScript imports if React is imported
    if (jsxCode.includes('import React')) {
      tsxCode = tsxCode.replace(
        /import\s+React(.*?)from\s+['"]react['"];?/,
        'import React$1from "react";\nimport { ReactNode, FC } from "react";'
      );
    }

    // Find component prop destructuring
    const propDestructuringPattern = /(function|const)\s+(\w+)\s*=?\s*\(\s*\{([^}]*)\}\s*\)/g;
    const propDestructuringMatches = [...jsxCode.matchAll(propDestructuringPattern)];
    
    // Process each component with props
    for (const match of propDestructuringMatches) {
      const componentName = match[2];
      const propsString = match[3];
      
      if (propsString && propsString.trim()) {
        // Create interface for component props
        const propsArray = propsString.split(',').map(prop => prop.trim());
        const interfaceProps = propsArray.map(prop => {
          // Extract default values
          const [propName, defaultValue] = prop.split('=').map(p => p.trim());
          // Handle optional props (those with default values)
          const isOptional = defaultValue !== undefined;
          return `  ${propName}${isOptional ? '?' : ''}: any;`;
        }).join('\n');
        
        // Build interface declaration
        const interfaceDeclaration = `\ninterface ${componentName}Props {\n${interfaceProps}\n}\n`;
        
        // Insert interface before component
        const componentPattern = new RegExp(`(function|const)\\s+${componentName}\\s*=?\\s*\\(`, 'g');
        tsxCode = tsxCode.replace(
          componentPattern, 
          `${interfaceDeclaration}$1 ${componentName}: FC<${componentName}Props> = (`
        );
      } else {
        // Component without props
        const componentPattern = new RegExp(`(function|const)\\s+${componentName}\\s*=?\\s*\\(\\s*\\)`, 'g');
        tsxCode = tsxCode.replace(
          componentPattern, 
          `$1 ${componentName}: FC = ()`
        );
      }
    }

    // Convert PropTypes to TypeScript interfaces
    for (const match of propTypesMatches) {
      const componentName = match[1];
      const propTypesContent = match[2];
      
      // Parse propTypes content
      const propLines = propTypesContent.split(',').map(line => line.trim()).filter(Boolean);
      const typeProps = propLines.map(line => {
        const propMatch = line.match(/(\w+)\s*:\s*PropTypes\.(\w+)(?:\.isRequired)?/);
        if (propMatch) {
          const [_, propName, propType] = propMatch;
          const isRequired = line.includes('.isRequired');
          const tsType = JSXConverter.mapPropTypeToTSType(propType);
          return `  ${propName}${isRequired ? '' : '?'}: ${tsType};`;
        }
        return null;
      }).filter(Boolean).join('\n');
      
      if (typeProps) {
        // Create or update interface
        const interfaceDeclaration = `\ninterface ${componentName}Props {\n${typeProps}\n}\n`;
        
        // Remove propTypes
        const propTypesRegex = new RegExp(`${componentName}\\.propTypes\\s*=\\s*\\{[^}]+\\};?`, 'gs');
        tsxCode = tsxCode.replace(propTypesRegex, '');
        
        // Insert interface before component
        const componentPattern = new RegExp(`(function|const|class)\\s+${componentName}`);
        tsxCode = tsxCode.replace(componentPattern, `${interfaceDeclaration}$1 ${componentName}`);
      }
    }

    // Convert export default to typed export
    tsxCode = tsxCode.replace(
      /export\s+default\s+(\w+);?/g,
      (match, componentName) => {
        if (tsxCode.includes(`${componentName}: FC<`)) {
          return match; // Already typed
        }
        return `export default ${componentName} as FC;`;
      }
    );

    // Add component typing for class components
    tsxCode = tsxCode.replace(
      /class\s+(\w+)\s+extends\s+React\.Component\s*\{/g,
      'class $1 extends React.Component<$1Props> {'
    );

    // Handle children in functional components
    tsxCode = tsxCode.replace(
      /(\w+)\.defaultProps\s*=\s*\{([^}]+)\};?/gs,
      ''
    );

    // Ensure .jsx extension is replaced with .tsx in imports
    tsxCode = tsxCode.replace(/from\s+['"](.+?)\.jsx['"]/g, 'from "$1.tsx"');
    
    // Add file type declaration at the top
    return tsxCode;
  }

  private static mapPropTypeToTSType(propType: string): string {
    const typeMappings: Record<string, string> = {
      'string': 'string',
      'number': 'number',
      'bool': 'boolean',
      'func': '(...args: any[]) => any',
      'array': 'any[]',
      'object': 'Record<string, any>',
      'symbol': 'symbol',
      'node': 'ReactNode',
      'element': 'React.ReactElement',
      'any': 'any',
    };
    
    return typeMappings[propType] || 'any';
  }
}
