<template>
  <div class="walletContainer">
    <user-img :wallet="wallet" @click="$emit('clickPicture')" />
    <span class="walletValue walletAddress">{{ wallet }}</span>
    <i-tooltip placement="left" trigger="click">
      <i class="copy" @click="copyAddress()">
        <v-icon name="ri-clipboard-line" />
      </i>
      <template #body>Copied!</template>
    </i-tooltip>
  </div>
</template>

<script lang="ts">
import Vue, { PropOptions } from "vue";
import { Address } from "@rsksmart/rif-rollup-js-sdk/build/types";
import { copyToClipboard } from "@rsksmart/rif-rollup-nuxt-core/utils";

export default Vue.extend({
  name: "WalletAddress",
  props: {
    wallet: {
      type: String,
      default: "",
      required: true,
    } as PropOptions<Address>,
  },
  methods: {
    copyAddress() {
      copyToClipboard(this.wallet);
    },
  },
});
</script>
