declare module "discord-rpc" {
  export interface LoginOptions {
    clientId: string;
  }

  export interface SetActivityOptions {
    details?: string;
    state?: string;
    startTimestamp?: number;
    largeImageKey?: string;
    largeImageText?: string;
    smallImageKey?: string;
    smallImageText?: string;
  }

  export class Client {
    constructor(options: { transport: "ipc" | string });
    on(event: "ready", handler: () => void): void;
    login(options: LoginOptions): Promise<void>;
    setActivity(options: SetActivityOptions): Promise<void>;
    clearActivity(): Promise<void>;
  }

  export function register(clientId: string): void;

  const RPC: {
    Client: typeof Client;
    register: typeof register;
  };

  export default RPC;
}
