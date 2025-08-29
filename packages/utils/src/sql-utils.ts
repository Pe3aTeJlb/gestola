export namespace sqlutils{

    export function transpose<T extends Record<string, any>>(
      array: T[]
    ): { [K in keyof T]: T[K][] } {
      if (array.length === 0) return {} as { [K in keyof T]: T[K][] };
    
      // Get all unique keys from all objects
      const allKeys = Array.from(
        new Set(array.flatMap(obj => Object.keys(obj)))
      ) as (keyof T)[];
    
      // Initialize result object
      const result = {} as { [K in keyof T]: T[K][] };
    
      // Populate each key with array of values
      allKeys.forEach(key => {
        result[key] = array.map(obj => obj[key]);
      });
    
      return result;
    }
    
}