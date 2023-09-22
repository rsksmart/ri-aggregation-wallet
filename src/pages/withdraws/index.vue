<template>
  <div class="withdrawsPage">
    <div class="centerBlock">
      <div class="withdrawBlock">
        <span class="title">Withdraw</span>
        <template v-if="withdrawTxs">
          <div v-for="(tx, idx) in withdrawTxs" :key="idx">
            <withdraw-item :transaction="tx" />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { ZkTransactionHistoryLoadingState } from "@rsksmart/rif-rollup-nuxt-core/types";
import { ApiTransaction } from "@rsksmart/rif-rollup-js-sdk/build/types";
import WithdrawItem from "@/pages/withdraws/withdrawItem.vue";

let updateListInterval: ReturnType<typeof setInterval>;
export default Vue.extend({
  components: { WithdrawItem },
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
      return this.transactionHistoryAllLoaded ? this.transactions.filter((t) => t.op.type === "Withdraw") : [];
    },
  },
  async mounted() {
    if (!this.transactionHistoryRequested) {
      await this.$store.dispatch("zk-history/getTransactionHistory");
    }
    await this.updateLatest();
  },
  methods: {
    async updateLatest() {
      await this.$store.dispatch("zk-history/getNewTransactionHistory");
      clearInterval(updateListInterval);
      updateListInterval = setInterval(async () => {
        if (!this.transactionHistoryAllLoaded) {
          await this.$store.dispatch("zk-history/getNewTransactionHistory");
        }
      }, 30000);
    },
  },
});
</script>
