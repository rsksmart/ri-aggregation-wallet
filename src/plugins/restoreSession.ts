import { Context, Plugin } from "@nuxt/types";
import { zkSyncNetworkConfig } from "@rsksmart/rif-rollup-nuxt-core/utils/config";

const restoreSessionPlugin: Plugin = async ({ app, store, route }: Context) => {
  if (
    typeof route.query.network === "string" &&
    Object.prototype.hasOwnProperty.call(zkSyncNetworkConfig, route.query.network)
  ) {
    await store.dispatch("zk-provider/changeNetwork", route.query.network);
  }
  const tracklogin = localStorage.getItem("lastSelectedWallet");

  if (tracklogin && isValidWallet(tracklogin)) {
    store.dispatch("zk-onboard/restoreLogin").then(() => {
      if (route.path === "/") {
        app.router?.push("/account");
      }
    });
  } else {
    await store.dispatch("zk-onboard/restoreLastNetwork");
  }
};

const isValidWallet = (wallet: string) => {
  const acceptedWallets = ["metamask", "walletconnect", "liquality"];
  return acceptedWallets.includes(wallet.toLowerCase());
};

export default restoreSessionPlugin;
