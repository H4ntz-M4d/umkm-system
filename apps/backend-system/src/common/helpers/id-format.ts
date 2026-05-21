export function idFormat(prefix: string) {
  const date = new Date();
  const randWord = Math.random().toString(36).substring(2, 6).toUpperCase();
  const orderId = `${prefix}-${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}-${randWord}`;
  return orderId;
}
