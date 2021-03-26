export function emptyToUndefined(obj: any) {
  return Object.keys(obj).length > 0 ? obj : undefined;
}
