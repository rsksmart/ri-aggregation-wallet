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
          id="btn-account-deposit-empty-balances"
          block
          class="_margin-top-1"
          data-cy="account_deposit_button"
          size="lg"
          to="/transaction/deposit"
          variant="secondary"
        >
          <v-icon class="planeIcon" name="ri-add-fill" />&nbsp;Deposit&nbsp;
        </i-button>
      </div>
      <div v-else class="balances">
        <template v-if="!showLoader">
          <div class="someClass">
            <label class="switch">
              <input v-model="isRollupMode" type="checkbox" />
              <span class="slider round"></span>
            </label>
          </div>
          <div v-if="isRollupMode" class="_display-flex _justify-content-space-between balancesButtonGroup _margin-y-1">
            <i-button
              id="btn-account-deposit"
              block
              class="_margin-y-0 _margin-right-1 _padding-right-2"
              data-cy="account_deposit_button"
              size="md"
              to="/transaction/deposit"
              variant="secondary"
            >
              <img src="../../static/images/rollup_icon_white.svg" />&nbsp;Send with Rollup
            </i-button>
            <i-button
              id="btn-account-transfer"
              block
              class="_margin-y-0"
              data-cy="account_send_zksync_button"
              size="md"
              to="/account/transfer"
              variant="secondary"
            >
              <img src="../../static/images/rollup_icon_white.svg" />&nbsp;Receive with Rollup
            </i-button>
          </div>
          <div v-else class="_display-flex _justify-content-space-between balancesButtonGroup _margin-y-1">
            <i-button
              id="btn-account-deposit"
              block
              class="_margin-y-0 _margin-right-1 _padding-right-2"
              data-cy="account_deposit_button"
              size="md"
              to="/transaction/deposit"
              variant="secondary"
            >
              <img src="../../static/images/l1_icon_white.svg" />&nbsp;<b>Rootstock</b>
              <img src="../../static/images/arrow_forward_white.svg" />
              <img src="../../static/images/rollup_icon_white.svg" />&nbsp;Rollup
            </i-button>
            <i-button
              id="btn-account-transfer"
              block
              class="_margin-y-0"
              data-cy="account_send_zksync_button"
              size="md"
              to="/account/transfer"
              variant="secondary"
            >
              <img src="../../static/images/rollup_icon_white.svg" />&nbsp;<b>Rollup</b>
              <img src="../../static/images/arrow_forward_white.svg" />
              <img src="../../static/images/l1_icon_white.svg" />&nbsp;Rootstock
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
                  {{ item.balance | parseBigNumberish(symbol) }}
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
import { searchByKey } from "@rsksmart/rif-rollup-nuxt-core/utils";
import BlockModalsBalanceInfo from "@/blocks/modals/BalanceInfo.vue";
import TotalUsdBalance from "@/components/TotalUsdBalance.vue";

export default Vue.extend({
  components: { TotalUsdBalance, BlockModalsBalanceInfo },
  data() {
    return {
      search: "",
      isRollupMode: false,
      // emptyBalances: true
      // showLoader: false
      // showSearching: true
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
  },
});
</script>

<style lang="scss" scoped>
.dappPageWrapper .tileBlock {
  max-width: 550px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;

  border: red 2px solid;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  -webkit-transition: 0.4s;
  transition: 0.4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: red;
  -webkit-transition: 0.4s;
  transition: 0.4s;
}

// input:checked + .slider {
//   background-color: #2196f3;
// }

// input:focus + .slider {
//   box-shadow: 0 0 1px #2196f3;
// }

input:checked + .slider:before {
  -webkit-transform: translateX(26px);
  -ms-transform: translateX(26px);
  transform: translateX(26px);
}

/* Rounded sliders */
.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}
</style>
