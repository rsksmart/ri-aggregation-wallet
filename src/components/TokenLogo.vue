<template>
  <div>
    <div v-if="isSupportedToken" class="logo">
      <img :src="tokenIcon" width="32" height="32" class="image" alt="Token logo" />
    </div>
    <div v-else class="tokenLogo">
      {{ symbol.charAt(0) }}
    </div>
  </div>
</template>

<script lang="ts">
import Vue, { PropOptions } from "vue";

import { TokenSymbol } from "@rsksmart/rif-rollup-js-sdk/build/types";

export default Vue.extend({
  data() {
    return {
      supportedTokens: {
        RBTC: "https://s2.coinmarketcap.com/static/img/coins/64x64/3626.png",
        RIF: "https://s2.coinmarketcap.com/static/img/coins/64x64/3701.png",
      },
    };
  },
  props: {
    symbol: {
      type: String,
      default: "",
      required: true,
    } as PropOptions<TokenSymbol>,
  },
  computed: {
    tokenIcon() {
      return this.supportedTokens[this.symbol as string];
    },
    isSupportedToken() {
      return this.supportedTokens[this.symbol as string] !== undefined;
    },
  },
});
</script>

<style scoped lang="scss">
.tokenLogo {
  background: $violet;
  color: $white;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}
.logo {
  margin-right: 12px;
}
</style>
