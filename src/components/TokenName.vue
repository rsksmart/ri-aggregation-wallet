<template>
  <div class="tokenName">
    {{ tokenName }}
  </div>
</template>

<script lang="ts">
import Vue, { PropOptions } from "vue";

import { TokenSymbol } from "@rsksmart/rif-rollup-js-sdk/build/types";

export default Vue.extend({
  props: {
    symbol: {
      type: String,
      default: "",
      required: true,
    } as PropOptions<TokenSymbol>,
  },
  computed: {
    tokenName() {
      switch (this.symbol) {
        case "RBTC":
          return "Rootstock Smart Bitcoin";
        case "RIF":
          return "RIF";
        case "RDOC":
          return "RIF Dollar on Chain";
        default:
          return this.symbol;
      }
    },
  },
});
</script>
