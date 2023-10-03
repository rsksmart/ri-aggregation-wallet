<template>
  <div>
    <template v-if="pendingBalance">
      <div class="withdrawalTokenItem">
        <div class="token-info">
          <token-logo class="token-logo" :symbol="tokenSymbol" />
          <div class="tokenSymbol">
            {{ tokenSymbol }}
          </div>
        </div>

        <div class="tokenDetails">
          <p class="availableText">Available</p>
          <p class="availableAmount">
            {{ pendingBalance | parseBigNumberish(tokenSymbol) }}
            ( <token-price :symbol="tokenSymbol" :amount="pendingBalance.toString()" /> )
          </p>
        </div>

        <div class="withdrawBtnSection">
          <div v-if="txPending">
            <button class="withdrawBtn withdrawBtnCompleted" disabled data-cy="account_withdraw_l1_button">
              pending
            </button>
            <span class="tooltip">
              &#9432;
              <span class="tooltiptext">
                you currently have a pending L1 transaction, please wait for it to be confirmed
              </span>
            </span>
          </div>
          <button
            v-else-if="isTwoStepWithdrawEnabled() && pendingBalance > 0 && !txPending"
            class="withdrawBtn withdrawBtnPending"
            data-cy="account_withdraw_l1_button"
            @click="withdrawPendingBalance()"
          >
            withdraw
          </button>
          <button v-else class="withdrawBtn withdrawBtnDisabled" disabled data-cy="account_withdraw_l1_button">
            withdraw
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import Vue, { PropOptions } from "vue";
import { TokenSymbol } from "@rsksmart/rif-rollup-js-sdk/build/types";
import { copyToClipboard } from "@rsksmart/rif-rollup-nuxt-core/utils";
import { providers } from "ethers";
import { ethereumNetworkConfig } from "@rsksmart/rif-rollup-nuxt-core/utils/config";
import TokenLogo from "@/components/TokenLogo.vue";
import TokenPrice from "@/components/TokenPrice.vue";

let updateListInterval: ReturnType<typeof setInterval>;

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
      txPending: false,
    };
  },
  computed: {
    network(): string {
      return this.$store.getters["zk-provider/network"];
    },
    pendingBalance() {
      return this.$store.getters["zk-balances/pendingBalance"](this.tokenSymbol);
    },
  },
  async mounted() {
    this.requestPendingBalance(this.tokenSymbol);
    await this.checkPendingTx();

    setInterval(async () => {
      this.requestPendingBalance(this.tokenSymbol);
      await this.checkPendingTx();
    }, 10000);
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
      const doesPendingTxExist = await this.checkPendingTx();

      if (doesPendingTxExist) {
        alert("You have a pending transaction, please wait for it to be confirmed");
        return;
      }

      this.$store.dispatch("zk-transaction/withdrawPendingTransaction", {
        tokenSymbol: this.tokenSymbol,
      });

      this.txPending = true;
    },
    async checkPendingTx() {
      const networkConfig = ethereumNetworkConfig("")[this.network];

      const customProvider = new providers.JsonRpcProvider(networkConfig.rpc_url);

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });

      const pendingNonce = await customProvider.getTransactionCount(accounts[0], "pending");

      const latestNonce = await customProvider.getTransactionCount(accounts[0], "latest");

      const isTxPending = pendingNonce > latestNonce;

      if (this.pendingBalance > 0 && isTxPending) {
        this.txPending = true;
      } else {
        this.txPending = false;
      }

      return isTxPending;
    },

    clearActiveTransaction() {
      this.$store.commit("zk-transaction/clearActiveTransaction");
    },

    async updateLatest() {
      clearInterval(updateListInterval);
      await this.checkPendingTx();
      updateListInterval = setInterval(async () => {
        await this.checkPendingTx();
      }, 30000);
    },
  },
});
</script>

<style scoped>
.withdrawalTokenItem {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  background-color: white;
  border-radius: 5px;
  padding: 10px;
  margin-top: 5%;
}

.token-info {
  display: flex !important;
  align-content: center;
  justify-content: flex-start;
}

.availableText {
  color: rgb(114, 122, 121);
}
.availableAmount {
  margin-top: -10px;
  font-size: 12px;
  color: darkslategray;
}

.withdrawBtnSection {
  display: flex;
  justify-content: center;
  align-content: center;
}
.withdrawBtn {
  width: 120px;
  height: 30px;
  border: none;
  border-radius: 20px;
  color: white;
  padding: 5px;
  text-align: center;
  text-decoration: none;
  font-size: 12px;
  cursor: pointer;
}
.withdrawBtnCompleted {
  background-color: #4caf4f65;
}
.withdrawBtnPending {
  background-color: #4b5cf0;
}
.withdrawBtnDisabled {
  background-color: #4b5cf04b;
}

.tooltip {
  position: relative;
  /* display: inline-block; */
}
.tooltip .tooltiptext {
  visibility: hidden;
  width: 320px;
  background-color: #555;
  color: #fff;
  text-align: start;
  padding: 5px;
  border-radius: 6px;
  font-size: 10px;

  /* Position the tooltip text */
  position: absolute;
  z-index: 1;
  bottom: 125%;
  left: 50%;
  margin-left: -85px;

  /* Fade in tooltip */
  opacity: 0;
  transition: opacity 0.3s;
}

/* Tooltip arrow */
.tooltip .tooltiptext::after {
  content: "";
  position: absolute;
  top: 100%;
  /* left: 50%; */
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: #555 transparent transparent transparent;
}

/* Show the tooltip text when you mouse over the tooltip container */
.tooltip:hover .tooltiptext {
  visibility: visible;
  opacity: 1;
}
</style>
