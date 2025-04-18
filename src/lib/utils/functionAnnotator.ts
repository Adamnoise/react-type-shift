
import * as t from '@babel/types';

/**
 * Adds TS annotations to function-based React components
 */
export const addTypeAnnotationToFunction = (path: any, componentName: string, hasProps: boolean) => {
  if (!path?.node) return;

  const applyProps = () => t.identifier(`props: ${componentName}Props`);

  const wrapDestructuredProps = (props: t.ObjectPattern) => {
    const paramName = 'props';
    return {
      param: t.identifier(`${paramName}: ${componentName}Props`),
      unpack: t.variableDeclaration('const', [
        t.variableDeclarator(props, t.identifier(paramName)),
      ]),
    };
  };

  const annotate = (fn: any) => {
    if (!fn) return;

    if (hasProps) {
      if (fn.params && fn.params.length > 0) {
        if (t.isObjectPattern(fn.params[0])) {
          const { param, unpack } = wrapDestructuredProps(fn.params[0]);
          fn.params[0] = param;

          if (t.isBlockStatement(fn.body)) {
            fn.body.body.unshift(unpack);
          } else {
            fn.body = t.blockStatement([unpack, t.returnStatement(fn.body)]);
          }
        } else {
          fn.params[0] = applyProps();
        }
      } else {
        fn.params = [applyProps()];
      }
    } else if (fn.params.length === 0) {
      fn.params = [t.identifier('props: Record<string, never>')];
    }

    if (fn.body) {
      fn.returnType = t.tsTypeAnnotation(t.tsTypeReference(t.identifier('JSX.Element')));
    }
  };

  annotate(path.node);
};
