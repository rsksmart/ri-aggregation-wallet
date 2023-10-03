<template>
  <div>
    <div class="withdrawsPage">
      <div class="centerBlock">
        <div class="withdrawBlock">
          <span class="title">Withdrawals</span>
          <template v-if="tokens">
            <div style="margin-top: 35px">
              <div v-for="(token, idx) in tokens" :key="idx">
                <withdraw-item :token-symbol="token" />
              </div>
            </div>
          </template>
          <template v-else>
            <div style="display: flex; justify-content: center; align-content: center; text-align: center">
              <p>No Withdrawals yet</p>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Token } from "@rsksmart/rif-rollup-nuxt-core/types";
import { ApiTransaction, TokenSymbol } from "@rsksmart/rif-rollup-js-sdk/build/types";
import { WithdrawData } from "@rsksmart/rif-rollup-js-sdk/src/types";
import WithdrawItem from "@/pages/withdrawals/withdrawItem.vue";

export default Vue.extend({
  components: { WithdrawItem },
  computed: {
    tokens(): string[] {
      const tokens = this.$store.getters["zk-tokens/zkTokens"];
      if (tokens) {
        return Object.keys(tokens);
      }
      return [];
    },
  },
  async mounted() {
    await this.getTokens();
    await this.updateLatest();
  },
  methods: {
    async updateLatest() {
      await this.$store.dispatch("zk-tokens/loadZkTokens");
    },
    getTokenSymbol(tx: ApiTransaction): TokenSymbol | number {
      const txData: WithdrawData = tx.op as WithdrawData;
      const tokenId = txData.token;
      const token: Token = this.$store.getters["zk-tokens/zkTokenByID"](tokenId);
      if (token) {
        return token.symbol;
      }
      return tokenId;
    },
    async getTokens() {
      await this.$store.dispatch("zk-tokens/loadZkTokens");
    },
  },
});
</script>
