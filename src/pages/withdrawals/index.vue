<template>
  <div>
    <div
      v-if="activeTransaction && activeTransaction.step !== 'initial' && activeTransaction.type === 'WithdrawPending'"
    >
      <div class="transactionPage dappPageWrapper">
        <div class="transactionBlock">
          <!--          <div class="withdrawBlock">-->
          <loading-block v-if="activeTransaction.step !== 'finished'" />
          <success-block v-else />
          <!--          </div>-->
        </div>
      </div>
    </div>
    <div v-else class="withdrawsPage">
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
import { Token, ZkActiveTransaction, ZkTransactionHistoryLoadingState } from "@rsksmart/rif-rollup-nuxt-core/types";
import { ApiTransaction, TokenSymbol } from "@rsksmart/rif-rollup-js-sdk/build/types";
import { WithdrawData } from "@rsksmart/rif-rollup-js-sdk/src/types";
import WithdrawItem from "@/pages/withdrawals/withdrawItem.vue";
import LoadingBlock from "@/blocks/LoadingBlock.vue";
import SuccessBlock from "@/blocks/SuccessBlock.vue";

let updateListInterval: ReturnType<typeof setInterval>;
export default Vue.extend({
  components: { SuccessBlock, LoadingBlock, WithdrawItem },
  computed: {
    transactions(): ApiTransaction[] {
      return this.$store.getters["zk-history/transactionHistory"];
    },
    transactionHistoryRequested(): boolean {
      return this.$store.getters["zk-history/transactionHistoryRequested"];
    },
    loadingStatus(): ZkTransactionHistoryLoadingState {
      return this.$store.getters["zk-history/transactionHistoryLoading"];
    },
    transactionHistoryAllLoaded(): boolean {
      return this.$store.getters["zk-history/transactionHistoryAllLoaded"];
    },
    withdrawTxs(): ApiTransaction[] {
      return this.transactions.filter((t) => t.op.type === "Withdraw") || [];
    },
    tokens(): string[] {
      const tokens = this.$store.getters["zk-tokens/zkTokens"];
      if (tokens) {
        return Object.keys(tokens);
      }
      return [];
    },
    activeTransaction(): ZkActiveTransaction {
      return this.$store.getters["zk-transaction/activeTransaction"];
    },
  },
  async mounted() {
    await this.getTokens();
    if (!this.transactionHistoryRequested) {
      await this.$store.dispatch("zk-history/getTransactionHistory");
    }
    await this.updateLatest();
  },
  methods: {
    async updateLatest() {
      await this.$store.dispatch("zk-tokens/loadZkTokens");
      await this.$store.dispatch("zk-history/getNewTransactionHistory");
      clearInterval(updateListInterval);
      updateListInterval = setInterval(async () => {
        if (!this.transactionHistoryAllLoaded) {
          await this.$store.dispatch("zk-history/getNewTransactionHistory");
        }
      }, 30000);
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
