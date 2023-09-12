<template>
  <div>
    <i-button
      v-if="!token"
      id="btn-token-select"
      data-cy="amount_block_token_select_button"
      block
      link
      @click="$emit('chooseToken')"
    >
      Select token
    </i-button>
    <i-button
      v-else
      id="btn-token-select"
      data-cy="amount_block_token_select_button"
      block
      class="selectedTokenBtn"
      link
      @click="$emit('chooseToken')"
    >
      <div class="tokenSelector">
        <token-logo :symbol="token" class="_padding-left-1" />
        <span class="tokenSymbol">{{ token }}</span>
        <v-icon name="ri-arrow-down-s-line" />
      </div>
    </i-button>
  </div>
</template>

<script lang="ts">
import Vue, { PropOptions } from "vue";
import { TokenSymbol } from "@rsksmart/rif-rollup-js-sdk/build/types";
import TokenLogo from "@/components/TokenLogo.vue";
export default Vue.extend({
  name: "TokenSelector",
  components: { TokenLogo },
  props: {
    token: {
      type: String,
      required: false,
      default: "RBTC",
    } as PropOptions<TokenSymbol>,
  },
});
</script>

<style lang="scss" scoped>
.tokenSelector {
  display: grid;
  grid-template-columns: 20% 60% 20%;
  grid-template-rows: 100%;
  align-items: center;
  color: #b8b8b8;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 100%;
}
.button {
  padding: 0 !important;
  border-radius: 6px;
  height: 78px;
  &.-light.-link {
    border: 1px solid rgba(0, 0, 0, 0.2);
    background-color: $white;
    &:not(:disabled):not(.-disabled):hover,
    &:not(:disabled):not(.-disabled).-hovered {
      background-color: $white !important;
      border: 1px solid rgba(0, 0, 0, 0.2);
    }
  }
  &.-dark.-link {
    background-color: #ffffff30;
  }
}
</style>
