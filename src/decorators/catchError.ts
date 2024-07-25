export function catchError<T>(defaultValue: T) {
  return function catchError(target: Function, context: DecoratorContext) {
    if (context.kind === 'method') {
      return function (...args: any[]) {
        try {
          // @ts-ignore
          return target.apply(this, args);
        } catch (error: unknown) {
          return defaultValue;
        }
      }
    }
  };
}
