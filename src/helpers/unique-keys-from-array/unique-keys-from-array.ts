export const uniqueKeysFromArray = <T>(array: T[], field: keyof T): any[] => {
  return array.reduce((keys: any[], elem: T) => {
    if (!keys.includes(elem[field])) {
      keys.push(elem[field]);
    }
    return keys;
  }, []);
};
