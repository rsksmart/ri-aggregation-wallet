<template>
  <img class="userImg" :src="walletImg" alt="avatar" @click="$emit('click')" />
</template>

<script lang="ts">
import { Address } from "@rsksmart/rif-rollup-js-sdk/build/types";
import * as blockies from "blockies-ts";
import Vue, { PropOptions } from "vue";

export default Vue.extend({
  name: "UserImg",
  props: {
    wallet: {
      type: String,
      default: "",
      required: true,
    } as PropOptions<Address>,
  },
  computed: {
    walletImg(): string {
      return blockies.create({ seed: (this.wallet as string).toLowerCase() }).toDataURL();
    },
  },
});
</script>
<style lang="scss">
.userImg {
  display: block;
  width: 27px;
  height: 27px;
  border-radius: 50%;
}
</style>
