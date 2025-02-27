<template>
  <div class="walletPage dappPageWrapper">
    <div class="balancesBlock tileBlock">
      <h3 class="tileHeadline h3">
        <total-usd-balance />
      </h3>

      <div v-if="emptyBalances" class="centerBlock">
        <p class="tileText">
          No balances yet, please
          <nuxt-link to="/transaction/deposit">top your wallet up</nuxt-link>
          or <a href="#" @click.prevent="openAccountModal">share your RIF Rollup address</a> to receive a transfer from
          someone!
        </p>
        <i-button
          id="btn-account-deposit"
          block
          class="_margin-top-1 action-button"
          data-cy="account_deposit_button"
          size="md"
          to="/transaction/deposit"
          variant="secondary"
        >
          <img src="../../static/images/deposit_icon.svg" />&nbsp;Deposit
        </i-button>
      </div>
      <div v-else class="balances">
        <template v-if="!showLoader">
          <div
            id="account-buttons"
            class="_display-flex _justify-content-space-between balancesButtonGroup _margin-y-1"
          >
            <i-button
              id="btn-account-send"
              block
              class="action-button _margin-y-0 _margin-right-1 _padding-right-2"
              data-cy="account_send_button"
              size="md"
              variant="secondary"
              to="transaction/transfer"
            >
              <img src="../../static/images/send_icon.svg" class="button-icon" />&nbsp;Send
            </i-button>
            <i-button
              id="btn-account-receive"
              block
              class="action-button _margin-y-0 _margin-right-1 _padding-right-2"
              data-cy="account_receive_button"
              size="md"
              variant="secondary"
              @click="togglePopup"
            >
              <img src="../../static/images/receive_icon.svg" />&nbsp;Receive
            </i-button>
            <i-button
              id="btn-account-deposit"
              block
              class="action-button second-row-button _margin-y-0 _margin-right-1 _padding-right-2"
              data-cy="account_deposit_button"
              size="md"
              to="/transaction/deposit"
              variant="secondary"
            >
              <img src="../../static/images/deposit_icon.svg" />&nbsp;Deposit
            </i-button>
            <i-button
              id="btn-account-transfer"
              block
              class="action-button second-row-button _margin-y-0 _margin-right-1 _padding-right-2"
              data-cy="account_send_zksync_button"
              size="md"
              to="/transaction/withdraw"
              variant="secondary"
            >
              <img src="../../static/images/withdraw_icon.svg" />&nbsp;Withdraw
            </i-button>
          </div>

          <i-input
            id="txt-search-filter-tokens"
            ref="searchInput"
            v-model="search"
            autofocus
            maxlength="6"
            placeholder="Search the token"
          >
            <template #prefix>
              <v-icon name="ri-search-line" />
            </template>
          </i-input>
        </template>

        <div v-if="showLoader" class="centerBlock">
          <loader />
        </div>
        <div v-else-if="showSearching" class="centerBlock">
          <span>
            Your search <strong>"{{ search }}"</strong> did not match any tokens
          </span>
        </div>
        <div v-else class="balancesList">
          <nuxt-link v-for="(item, symbol) in displayedList" :key="symbol" :to="`/token/${symbol}`" class="balanceItem">
            <div class="leftSide _display-flex _align-items-center">
              <token-logo :symbol="symbol" />
              <div>
                <div class="tokenSymbol">
                  {{ symbol }}
                </div>
                <token-name :symbol="symbol" />
              </div>
            </div>
            <div class="rightSide">
              <div class="rowItem">
                <div class="total">
                  {{ fixDecimals(item.balance.toString(), symbol) }}
                  <span class="balancePrice">
                    <token-price :amount="item.balance" :symbol="symbol" />
                  </span>
                </div>
              </div>
              <div v-if="activeDeposits[symbol]" class="rowItem">
                <div class="total small">
                  <span class="balancePrice">
                    Depositing:
                    <token-price :amount="activeDeposits[symbol].amount" :symbol="symbol" />
                  </span>
                  &nbsp;&nbsp;+{{ activeDeposits[symbol].amount | parseBigNumberish(symbol) }}
                </div>
                <div class="status">
                  <loader size="xs" />
                </div>
              </div>
            </div>
          </nuxt-link>
        </div>
      </div>
    </div>
    <block-modals-balance-info />
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { AccountState as WalletAccountState, TokenInfo } from "@rsksmart/rif-rollup-js-sdk/build/types";
import { ZkTokenBalances } from "@rsksmart/rif-rollup-nuxt-core/types";
import { searchByKey, parseBigNumberish } from "@rsksmart/rif-rollup-nuxt-core/utils";
import { RestProvider } from "@rsksmart/rif-rollup-js-sdk";
import { adjustNumberOfDigits } from "../../utils/number";
import BlockModalsBalanceInfo from "@/blocks/modals/BalanceInfo.vue";
import TotalUsdBalance from "@/components/TotalUsdBalance.vue";

export default Vue.extend({
  components: { TotalUsdBalance, BlockModalsBalanceInfo },
  data() {
    return {
      search: "",
    };
  },
  computed: {
    showSearching(): boolean {
      return this.isSearching && !this.hasDisplayedBalances;
    },
    showLoader(): boolean {
      return (
        this.$store.getters["zk-account/accountStateLoading"] &&
        !this.$store.getters["zk-account/accountStateRequested"]
      );
    },
    emptyBalances(): boolean {
      return (
        !this.isSearching &&
        !this.hasDisplayedBalances &&
        (!this.$store.getters["zk-account/accountStateLoading"] ||
          this.$store.getters["zk-account/accountStateRequested"])
      );
    },
    accountStateLoading(): boolean {
      return this.$store.getters["zk-account/accountStateLoading"];
    },
    zkBalances(): ZkTokenBalances {
      return this.$store.getters["zk-balances/balances"];
    },
    zkBalancesWithDeposits(): ZkTokenBalances {
      const tokens = this.$store.getters["zk-tokens/zkTokens"] as TokenInfo[];
      const zkBalancesWithDeposits = this.zkBalances;
      for (const symbol in this.activeDeposits) {
        if (!zkBalancesWithDeposits[symbol]) {
          zkBalancesWithDeposits[symbol] = {
            balance: "0",
            verified: false,
            feeAvailable: tokens[symbol] ? tokens[symbol].enabledForFees : false,
          };
        }
      }
      return zkBalancesWithDeposits;
    },
    displayedList(): ZkTokenBalances {
      return searchByKey(this.zkBalancesWithDeposits, this.search);
    },
    activeDeposits(): WalletAccountState {
      return this.$store.getters["zk-balances/depositingBalances"];
    },
    hasDisplayedBalances(): boolean {
      return Object.keys(this.displayedList).length !== 0 || Object.keys(this.activeDeposits).length !== 0;
    },
    zigZagLink(): string | null {
      switch (this.$store.getters["zk-provider/network"]) {
        case "mainnet":
          return "https://trade.zigzag.exchange/";
        default:
          return null;
      }
    },
    isSearching(): boolean {
      return this.search.trim().length > 0;
    },
    provider(): RestProvider {
      return this.$store.getters["zk-provider/syncProvider"];
    },
  },
  mounted() {
    this.$analytics.track("visit_home");
  },
  methods: {
    openAccountModal(): void {
      this.$accessor.setAccountModalState(true);
    },
    openBalanceInfoModal(): void {
      this.$accessor.openModal("BalanceInfo");
    },
    togglePopup(): void {
      this.$accessor.setAccountModalState(true);
    },
    fixDecimals(value: string, symbol: string | number): string {
      const asBigNumberString = parseBigNumberish(this.provider, symbol, value) as string;

      return adjustNumberOfDigits(asBigNumberString);
    },
  },
});
</script>

<style lang="scss" scoped>
#account-buttons {
  display: grid !important;
  grid-template-rows: 50% 50% !important;
  grid-template-columns: 49.5% 49.5% !important;
  grid-column-gap: 1%;
  grid-row-gap: 6%;
}

.action-button {
  border-radius: 6px;
  font-weight: bold;
}

.second-row-button {
  background-color: black !important;
  border-color: black !important;
}

.button-icon {
  object-position: 20% 20%;
}

@media screen and (max-width: $mobile) {
  #account-buttons {
    display: grid !important;
    grid-template-rows: 50% 50% !important;
    grid-template-columns: 49.5% 49.5% !important;
    grid-column-gap: 1%;
    grid-row-gap: 6%;
  }

  .action-button {
    width: 100% !important;
  }
}
</style>
