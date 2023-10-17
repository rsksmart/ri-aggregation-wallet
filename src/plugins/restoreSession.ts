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
  const exists = acceptedWallets.includes(wallet.toLowerCase());

  if (exists) {
    return true;
  }

  // validate that the wallet does not contain malicious code
  // also this takes care of the case where the user has a wallet that is not
  // included in the acceptedWallets array but is supported
  const regex = /^[a-z0-9]+$/i;
  return regex.test(wallet);
};

export default restoreSessionPlugin;
