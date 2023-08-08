<template>
  <div>
    <div v-if="isSupportedToken" class="logo">
      <img :src="tokenIcon" width="32" height="32" class="image" alt="Token logo" />
    </div>
    <div v-else class="roundAvatar">
      {{ symbol.charAt(0) }}
    </div>
  </div>
</template>

<script lang="ts">
import Vue, { PropOptions } from "vue";

import { TokenSymbol } from "@rsksmart/rif-rollup-js-sdk/build/types";

declare interface SupportedTokenIcons {
  RBTC: string;
  RIF: string;
}

export default Vue.extend({
  name: "TokenLogo",
  data() {
    return {
      supportedTokens: {
        RBTC: "https://s2.coinmarketcap.com/static/img/coins/64x64/3626.png",
        RIF: "https://s2.coinmarketcap.com/static/img/coins/64x64/3701.png",
      } as SupportedTokenIcons,
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
    tokenIcon(): string | undefined {
      return this.supportedTokens[this.symbol as string];
    },
    isSupportedToken(): boolean {
      return this.tokenIcon !== undefined;
    },
  },
});
</script>

<style scoped lang="scss">
.logo {
  margin-right: 12px;
}
</style>
