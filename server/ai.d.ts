export function createAiHandler(getKey?: () => string): (request: any, response: any) => Promise<any>;
export function validateRequest(body: unknown): any;
export function validateReply(reply: unknown, kind: string, mode: string): any;
declare const handler: (request: any, response: any) => Promise<any>;
export default handler;
