declare module "midtrans-client" {
  type SnapConfig = {
    isProduction: boolean;
    serverKey?: string;
    clientKey?: string;
  };

  type SnapTransaction = {
    token: string;
    redirect_url: string;
  };

  const midtransClient: {
    Snap: new (config: SnapConfig) => {
      createTransaction(parameter: unknown): Promise<SnapTransaction>;
    };
  };

  export default midtransClient;
}
