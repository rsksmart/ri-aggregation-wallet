<template>
  <i-modal v-model="opened" size="md">
    <template #header>RIF Rollup is a Layer-2 protocol</template>
    <p>
      Your RIF Rollup balances live in a separate space called Layer-2 (L2 for short). You won’t see them on
      <a
        :href="`https://${rskDomain}/address/${$store.getters['zk-account/address']}`"
        rel="noopener noreferrer"
        target="_blank"
        >{{ rskDomain }}</a
      >
      or in your Rootstock wallet, only in RIF Rollup wallet and block explorer. Nevertheless, balances in RIF Rollup
      are as secure as if though they were in L1 (the Rootstock mainnet).
    </p>
    <p>
      You can move your balances <b>from L1</b> into RIF Rollup by making a
      <nuxt-link class="logoLinkContainer" to="/transaction/deposit">Deposit</nuxt-link>
    </p>
    <p>
      To move them back from RIF Rollup <b>to L1</b> you can make a
      <nuxt-link class="logoLinkContainer" to="/transaction/withdraw">Withdraw</nuxt-link>
    </p>
  </i-modal>
</template>

<script lang="ts">
import Vue from "vue";
import { Network } from "@rsksmart/rif-rollup-js-sdk/build/types";

export default Vue.extend({
  name: "BlockModalsBalanceInfo",
  computed: {
    opened: {
      set(val): void {
        if (val === false) {
          this.$accessor.closeActiveModal();
        }
      },
      get(): boolean {
        return this.$accessor.currentModal !== null && this.$accessor.currentModal === "BalanceInfo";
      },
    },
    rskDomain(): string {
      const network: Network = this.$store.getters["zk-provider/network"];
      switch (network) {
        case "localhost":
        case "testnet":
          return "explorer.testnet.rsk.co";
        case "mainnet":
        default:
          return "explorer.rsk.co";
      }
    },
  },
});
</script>
