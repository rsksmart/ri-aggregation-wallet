<template>
  <div>
    <template v-if="pendingBalance">
      <!-- <div class="withdrawTxItem">
        <div class="tokenSymbol">
          <token-logo :symbol="tokenSymbol" />
          <p>{{ tokenSymbol }}</p>
        </div>
        <i-container>
          <i-row>
            <i-column>
              <i-row>
                {{ pendingBalance | parseBigNumberish(tokenSymbol) }}
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
      </div> -->
      <div class="withdrawalTokenItem">
        <div class="tokenItem">
          <token-logo :symbol="tokenSymbol" />
          <p class="tokenName">{{ tokenSymbol.trim() }}</p>
        </div>

        <div class="tokenDetails">
          <div class="availableText">
            <p>Available</p>
            <p>
              {{ pendingBalance | parseBigNumberish(tokenSymbol) }}
              ( <token-price :symbol="tokenSymbol" :amount="pendingBalance.toString()" /> )
            </p>
          </div>

          <div v-if="processingForWithdrawal > 0" class="availableText">
            <p>Processing for Withdrawal</p>
            <p>{{ processingForWithdrawal | parseBigNumberish(tokenSymbol) }}</p>
          </div>
        </div>

        <div class="withdrawBtn">
          <button
            v-if="isTwoStepWithdrawEnabled() && pendingBalance > 0"
            data-cy="account_withdraw_l1_button"
            @click="withdrawPendingBalance()"
          >
            withdraw
          </button>
          <button
            v-else-if="isTwoStepWithdrawEnabled() && processingForWithdrawal > 0"
            disabled
            data-cy="account_withdraw_l1_button"
          >
            withdraw in progress
          </button>
          <button v-else disabled data-cy="account_withdraw_l1_button">completed</button>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import Vue, { PropOptions } from "vue";
import { TokenSymbol } from "@rsksmart/rif-rollup-js-sdk/build/types";
import { copyToClipboard } from "@rsksmart/rif-rollup-nuxt-core/utils";
import { BigNumber } from "@ethersproject/bignumber";
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
  data() {
    return {
      processingForWithdrawal: BigNumber.from(0) as BigNumber,
    };
  },
  computed: {
    pendingBalance() {
      return this.$store.getters["zk-balances/pendingBalance"](this.tokenSymbol);
    },
    activeTransaction() {
      const activeTx = this.$store.getters["zk-transaction/activeTransaction"];
      if (activeTx) {
        console.log("processing withdrwal in active tx", this.processingForWithdrawal);
        console.log("pending balance in active tx", this.pendingBalance);
        const storageKey = JSON.stringify(this.tokenSymbol);
        let tokenActiveTx: any = localStorage.getItem(storageKey);
        tokenActiveTx = JSON.parse(tokenActiveTx);
        console.log(
          `activeTx: ${activeTx?.type === "WithdrawPending"}, tokenActive: ${
            tokenActiveTx?.processingForWithdrawal === 0
          }`
        );

        if (activeTx?.type === "WithdrawPending") {
          if (!tokenActiveTx || tokenActiveTx?.processingForWithdrawal === 0)
            localStorage.setItem(
              storageKey,
              JSON.stringify({ ...activeTx, processingForWithdrawal: this.processingForWithdrawal })
            );
        }
      }
      return this.processingForWithdrawal;
    },
  },
  mounted() {
    // if (this.activeTransaction?.type !== "WithdrawPending") this.clearActiveTransaction();
    this.requestPendingBalance(this.tokenSymbol);
    this.renderActiveTransaction();
  },
  created() {
    // if (this.activeTransaction?.type !== "WithdrawPending") this.clearActiveTransaction();
    // this.requestPendingBalance(this.tokenSymbol);
  },
  methods: {
    copyAddress(hash: string) {
      copyToClipboard(hash.toLowerCase());
    },
    isTwoStepWithdrawEnabled(): boolean {
      return process.env.IS_TWO_STEP_WITHDRAW_ENABLED?.toUpperCase() === "TRUE";
    },
    renderActiveTransaction() {
      // checks the local storage for an active transaction for current token
      const storageKey = JSON.stringify(this.tokenSymbol);
      let tokenActiveTx: any = localStorage.getItem(storageKey);
      tokenActiveTx = JSON.parse(tokenActiveTx);
      if (this.pendingBalance < 0) {
        // if there's no pending balance, it means any previous tx has been completed
        this.processingForWithdrawal = BigNumber.from(0);
        localStorage.removeItem(storageKey);
      } else if (tokenActiveTx?.processingForWithdrawal > 0) {
        this.processingForWithdrawal = tokenActiveTx!.processingForWithdrawal;
      }
      return this.processingForWithdrawal;
    },
    async requestPendingBalance(tokenSymbol: TokenSymbol) {
      return await this.$store.dispatch("zk-balances/requestPendingBalance", { symbol: tokenSymbol });
    },
    async withdrawPendingBalance() {
      this.processingForWithdrawal = this.pendingBalance;
      console.log("processing withdrwal", this.processingForWithdrawal);
      console.log("pending balance", this.pendingBalance);

      await this.$store.dispatch("zk-transaction/withdrawPendingTransaction", {
        tokenSymbol: this.tokenSymbol,
      });

      console.log("processing withdrwal after", this.processingForWithdrawal);
      console.log("pending balance after", this.pendingBalance);
    },

    async clearActiveTransaction() {
      await this.$store.commit("zk-transaction/clearActiveTransaction");
    },
  },
});
</script>

<style scoped>
.withdrawalTokenItem {
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  align-content: center;
  background-color: white;
  border-radius: 5px;
  padding: 10px;
  margin-top: 5%;
}
.tokenItem {
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-content: center;
  border-right: 1px solid aquamarine;
  padding-right: 20px;
  text-align: center;
}
.tokenName {
  margin-top: -1px;
}

.withdrawBtn {
  display: flex;
  justify-content: center;
  align-content: center;
}
</style>
