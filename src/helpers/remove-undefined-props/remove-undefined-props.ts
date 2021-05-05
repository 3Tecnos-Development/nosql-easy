export const removeUndefinedProps = <T>(data: T): T => {
  const obj = data as any;
  Object.keys(obj).forEach((key) => {
    if (obj[key] === undefined) {
      delete obj[key];
      return;
    }
    const propertyIsAnObject =
      obj[key] && typeof obj[key] === "object" && !(obj[key] instanceof Date);
    if (propertyIsAnObject) {
      removeUndefinedProps(obj[key]);
      const objectWithoutProperties = !Object.keys(obj[key]).length;
      if (objectWithoutProperties) delete obj[key];
    }
  });
  return data;
};
