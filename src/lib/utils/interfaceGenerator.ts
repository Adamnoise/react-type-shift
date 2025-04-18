
import * as t from '@babel/types';
import { propTypeToTSType } from './typeConverters';

/**
 * Creates a TypeScript interface from propTypes
 */
export const createTypeInterface = (componentName: string, propTypes: any): string => {
  const properties: string[] = [];

  Object.entries(propTypes).forEach(([key, value]: [string, any]) => {
    const isRequired =
      t.isMemberExpression(value) &&
      t.isIdentifier(value.property) &&
      value.property.name === 'isRequired';

    const type = propTypeToTSType(isRequired ? value.object : value);
    properties.push(`  ${key}${isRequired ? '' : '?'}: ${type};`);
  });

  return `interface ${componentName}Props {\n${properties.join('\n')}\n}`;
};
