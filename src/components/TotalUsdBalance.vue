<template>
  <div>
    <h3>$ {{ totalUsdBalance }}</h3>
    <v-icon
      id="eye"
      class="icon-container _display-flex iconInfo"
      name="eye-outline"
      scale="0.9"
      @click.native="changeShowBalance"
    />
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { parseBigNumberish } from "@rsksmart/rif-rollup-nuxt-core/utils";
import { ZkTokenBalances, ZkTokenPrices } from "@rsksmart/rif-rollup-nuxt-core/types";
import { RestProvider } from "@rsksmart/rif-rollup-js-sdk";

export default Vue.extend({
  data() {
    return {
      showBalance: false,
    };
  },
  computed: {
    balances(): ZkTokenBalances {
      return this.$store.getters["zk-balances/balances"];
    },
    tokenPrices(): ZkTokenPrices {
      return this.$store.getters["zk-tokens/tokenPrices"];
    },
    provider(): RestProvider {
      return this.$store.getters["zk-provider/syncProvider"];
    },
    totalUsdBalance(): string {
      let total = 0;
      for (const symbol in this.balances) {
        const balanceInBigNumberish = parseBigNumberish(this.provider, symbol, this.balances[symbol].balance as string);
        const balance = balanceInBigNumberish === undefined ? 0 : balanceInBigNumberish;
        const price = this.tokenPrices[symbol] === undefined ? 0 : this.tokenPrices[symbol];
        total += +balance * price;
      }
      return this.showBalance ? total.toFixed(2) : "--.--";
    },
  },
  methods: {
    changeShowBalance(): boolean {
      return !this.showBalance;
    },
  },
});
</script>
