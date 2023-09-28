<template>
  <div>
    <template v-if="pendingBalance > 0">
      <div class="withdrawTxItem">
        <div class="tokenSymbol">
          <token-logo :symbol="tokenSymbol" />
        </div>
        <i-container>
          <i-row>
            <i-column>
              <i-row>
                {{ pendingBalance | parseBigNumberish(tokenSymbol) }}
              </i-row>
              <i-row class="_margin-top-1">
                {{ tokenSymbol }}
              </i-row>
            </i-column>
            <i-column xs="5" class="_justify-content-end _align-content-center">
              <i-row class="_justify-content-end _margin-bottom-1">
                <i-button
                  v-if="isTwoStepWithdrawEnabled()"
                  class="withdraw-btn"
                  data-cy="account_withdraw_l1_button"
                  variant="secondary"
                  block
                  size="md"
                  @click="withdrawPendingBalance()"
                >
                  withdraw
                </i-button>
                <i-button
                  v-else
                  disabled
                  class="withdraw-btn"
                  data-cy="account_withdraw_l1_button"
                  variant="success"
                  block
                  size="md"
                >
                  completed
                </i-button>
              </i-row>
              <i-row class="_justify-content-end">
                <token-price :symbol="tokenSymbol" :amount="pendingBalance.toString()" />
              </i-row>
            </i-column>
          </i-row>
        </i-container>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import Vue, { PropOptions } from "vue";
import { TokenSymbol } from "@rsksmart/rif-rollup-js-sdk/build/types";
import { copyToClipboard } from "@rsksmart/rif-rollup-nuxt-core/utils";
import { ZkActiveTransaction } from "@rsksmart/rif-rollup-nuxt-core/types";
import TokenLogo from "@/components/TokenLogo.vue";
import TokenPrice from "@/components/TokenPrice.vue";

export default Vue.extend({
  components: { TokenPrice, TokenLogo },
  props: {
    tokenSymbol: {
      type: String,
      default: "RBTC",
      required: true,
    } as PropOptions<TokenSymbol>,
  },
  computed: {
    pendingBalance() {
      return this.$store.getters["zk-balances/pendingBalance"](this.tokenSymbol);
    },
    activeTransaction(): ZkActiveTransaction {
      return this.$store.getters["zk-transaction/activeTransaction"];
    },
  },
  created() {
    if (this.activeTransaction?.type !== "WithdrawPending") this.clearActiveTransaction();
    this.requestPendingBalance(this.tokenSymbol);
  },
  methods: {
    copyAddress(hash: string) {
      copyToClipboard(hash.toLowerCase());
    },
    isTwoStepWithdrawEnabled(): boolean {
      return process.env.IS_TWO_STEP_WITHDRAW_ENABLED?.toUpperCase() === "TRUE";
    },
    async requestPendingBalance(tokenSymbol: TokenSymbol) {
      return await this.$store.dispatch("zk-balances/requestPendingBalance", { symbol: tokenSymbol });
    },
    async withdrawPendingBalance() {
      await this.$store.dispatch("zk-transaction/withdrawPendingTransaction", {
        tokenSymbol: this.tokenSymbol,
      });
    },
    async clearActiveTransaction() {
      await this.$store.commit("zk-transaction/clearActiveTransaction");
    },
  },
});
</script>
