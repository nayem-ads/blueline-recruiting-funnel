export const env = (typeof process !== "undefined" ? process.env : {}) as Record<string, unknown>;
export default { env };
