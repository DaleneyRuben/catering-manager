export const toVoid = (p: Promise<unknown>): Promise<void> => p.then(() => {});
