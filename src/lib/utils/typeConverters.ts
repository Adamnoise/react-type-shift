
import * as t from '@babel/types';

/**
 * Maps PropTypes to TypeScript types
 */
export const propTypeToTSType = (propType: any): string => {
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
          return 'any[]';
        case 'shape':
          return 'Record<string, any>';
        case 'oneOf':
          return 'any';
        case 'oneOfType':
          return 'any';
        default:
          return 'any';
      }
    }
  }
  return 'any';
};
