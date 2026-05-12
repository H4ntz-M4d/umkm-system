export function toStartOfDay(date: string, timezone = '+07:00') {
  return new Date(`${date}T00:00:00${timezone}`);
}

export function toEndOfDay(date: string, timezone = '+07:00') {
  return new Date(`${date}T23:59:59${timezone}`);
}
