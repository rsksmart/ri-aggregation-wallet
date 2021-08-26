import onboardConfig from "@/configs/onboard";
import { APP_ZKSYNC_BLOCK_EXPLORER, ETHER_NETWORK_ID } from "@/plugins/build";
import { walletData } from "@/plugins/walletData";

import Onboard from "bnc-onboard";
import { API, Subscriptions, UserState, Wallet as OnboardWallet } from "bnc-onboard/dist/src/interfaces";
import { ethers } from "ethers";

import { actionTree, getterTree, mutationTree } from "typed-vuex";
import { Address } from "zksync/build/types";

function getNameFromAddress(userAddress: Address): string {
  const walletName: string = window.localStorage.getItem(userAddress) || "";
  if (walletName.trim().length > 1 && walletName !== userAddress) {
    return walletName;
  }
  return userAddress.substr(0, 5) + "..." + userAddress.substr(userAddress.length - 5, userAddress.length - 1);
}

export declare type tProviderState = "ready" | "selectWallet" | "checkWallet" | "connecting" | "authorized";

export const state = () => ({
  onboard: Onboard({
    ...onboardConfig,
    subscriptions: <Subscriptions>{
      address: async (address: Address | undefined): Promise<void> => {
        console.log("subscription: address", address);
        const windowProvider = process.client ? window.$nuxt!.$accessor!.provider : undefined;
        if (windowProvider!.loggedIn) {
          if ((address !== undefined && windowProvider!.address !== address) || (windowProvider!.address === undefined && address === undefined)) {
            window.$nuxt!.$toast.global?.zkException({
              message: "Account switching spotted",
            });
            window.$nuxt!.$accessor.wallet.logout(false);
            await window.$nuxt!.$router.push("/");
          }
        }
      },
      /**
       * Core method effecting the loggedIn status
       * @param {Wallet} wallet
       */
      wallet: (wallet: OnboardWallet) => {
        if (!process.client) {
          return;
        }
        console.log("subscription: wallet", wallet);
        const windowProvider = window.$nuxt!.$accessor!.provider;
        if (wallet.provider) {
          windowProvider?.storeSelectedWallet(wallet.name || "");
          const ethersProvider: ethers.providers.Web3Provider = new ethers.providers.Web3Provider(wallet.provider);
          windowProvider.storeProvider(ethersProvider);
        } else {
          windowProvider?.storeSelectedWallet("");
          windowProvider?.storeProvider(undefined);
        }
      },
      network: async (networkId: number | undefined) => {
        if (!process.client) {
          return;
        }
        const windowProvider = process.client ? window.$nuxt!.$accessor!.provider : undefined;
        console.log("subscription: network", networkId);
        if (windowProvider!.loggedIn) {
          if (networkId !== undefined && networkId !== ETHER_NETWORK_ID) {
            window.$nuxt!.$toast.global?.zkException({
              message: "ETH Network change spotted",
            });
            if (!walletData.get().syncWallet) {
              window.$nuxt!.$accessor.wallet.logout(false);
              await window.$nuxt.$router.push("/");
            } else {
              await windowProvider!.walletCheck();
            }
          }
        }
      },
    },
  }) as API,
  accountName: <string>"",
  authStep: (<tProviderState>"ready") as tProviderState,
  selectedWallet: (<string>localStorage.getItem("onboardSelectedWallet")) as string,
  loadingHint: <string>"",
  ethProvider: <ethers.providers.Web3Provider | undefined>undefined,
});

export type ProviderModuleState = ReturnType<typeof state>;

export const mutations = mutationTree(state, {
  setAuthStage(state: ProviderModuleState, currentStep: tProviderState) {
    state.authStep = currentStep;
  },
  storeSelectedWallet(state: ProviderModuleState, selectedWallet: string) {
    //    localStorage.setItem("onboardSelectedWallet", selectedWallet);
    state.selectedWallet = selectedWallet;
  },
  setLoadingHint(state: ProviderModuleState, text: string) {
    state.loadingHint = text;
  },
  setName(state: ProviderModuleState, newName: string) {
    state.accountName = newName;
  },
  storeProvider(state: ProviderModuleState, ethProvider: ethers.providers.Web3Provider | undefined) {
    state.ethProvider = ethProvider;
  },
});

export const getters = getterTree(state, {
  loggedIn: (state): boolean => state.authStep === "authorized" && !!state.ethProvider && !!state.onboard.getState().address,
  storedOnboardWallet: (state): string => state.selectedWallet,
  name: (state): string | undefined => state.accountName,
  loader: (state): boolean => ![<tProviderState>"ready", <tProviderState>"authorized", <tProviderState>"selectWallet"].includes(state.authStep),
  address: (state): Address | undefined => (state.onboard!.getState().address.length ? (state.onboard!.getState().address as Address) : undefined),
  loadingHint: (state): string => state.loadingHint,
  zkScanUrl: (state): string | undefined => (state.onboard.getState().address ? `${APP_ZKSYNC_BLOCK_EXPLORER}/accounts/${state.onboard.getState().address}` : undefined),
});

export const actions = actionTree(
  { state, getters, mutations },
  {
    authState({ state }): UserState {
      const accountState = state.onboard.getState();
      console.warn("current account state", accountState);
      return accountState;
    },

    saveName({ state, commit }, name?: string): void {
      const currentAddress = state.onboard.getState().address;
      if (currentAddress) {
        if (!name) {
          if (!state.accountName) {
            name = window.localStorage.getItem(currentAddress) as string;
          }
          name = getNameFromAddress(currentAddress);
          window.localStorage.removeItem(currentAddress);
        }
        window.localStorage.setItem(currentAddress, name);
        commit("setName", name);
      }
    },

    async walletSelect({ state, commit }): Promise<boolean> {
      const result: boolean = await state.onboard.walletSelect(state.selectedWallet || undefined);
      commit("setAuthStage", result ? "selectWallet" : "ready");
      return result;
    },

    async walletCheck({ state, commit, dispatch }): Promise<boolean> {
      commit("setAuthStage", "checkWallet");
      //      commit("setLoadingHint", "Follow the instructions in your Ethereum wallet");
      const checkStatus: boolean = await state.onboard.walletCheck();
      if (checkStatus) {
        commit("setAuthStage", "authorized");
      } else {
        dispatch("reset");
      }
      return checkStatus;
    },

    async accountSelect({ state, commit }): Promise<boolean> {
      const result = await state.onboard.accountSelect();
      if (result) {
        commit("setAuthStage", "connecting");
      }
      return result;
    },

    reset({ state, commit }) {
      console.log("reset called");
      state.onboard.walletReset();
      commit("setAuthStage", "ready");
    },

    processWrongNetwork({ commit }) {
      commit("setAuthStage", "connecting");
    },

    async login({ state, dispatch, commit, getters }, forceReset = false): Promise<UserState> {
      if (forceReset) {
        alert("forced");
        dispatch("reset");
      }
      if (getters.loggedIn) {
        console.log("authorized");
        return dispatch("authState");
      }
      console.log("before wallet select");
      const stateRequireSelect: tProviderState[] = ["checkWallet", "selectWallet", "authorized", "connecting"];
      if (!stateRequireSelect.includes(state.authStep)) {
        const selectResult: boolean = await dispatch("walletSelect");
        if (!selectResult) {
          return dispatch("authState");
        }
        commit("setAuthStage", "ready");
      }
      const checkResult: boolean = await dispatch("walletCheck");
      dispatch("authState");
      if (!checkResult) {
        return dispatch("authState");
      }
      console.log("before auth state");
      const authState: UserState = await dispatch("authState");
      if (authState.wallet!.type === "hardware") {
        console.log("special call for the hardware wallet");
        const accountSelection: boolean = await dispatch("accountSelect");
        dispatch("authState");
        if (!accountSelection) {
          dispatch("reset");
        }
      }
      return dispatch("authState");
    },
  },
);
