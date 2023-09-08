<template>
  <div class="chooseTokenBlock">
    <div v-if="mainLoading" class="centerBlock">
      <loader />
    </div>
    <template v-else>
      <div class="select-token-header">
        <p>Select token</p>
      </div>
      <div class="searchContainer">
        <i-input
          ref="tokenSymbolInput"
          v-model="search"
          data-cy="choose_token_block_token_input"
          placeholder="Search token"
          maxlength="10"
        >
          <template #prefix>
            <i>
              <v-icon name="ri-search-line" />
            </i>
          </template>
        </i-input>
      </div>
      <div class="tokenListContainer genericListContainer _margin-top-05">
        <template v-for="(balance, symbolOrID) in displayedList">
          <div
            :id="`btn-token-item-${symbolOrID}`"
            :key="symbolOrID"
            class="tokenItem"
            :class="{ disabled: feeAcceptable && !allowedFeeTokens[symbolOrID] }"
            :data-cy="`token_item_${symbolOrID}`"
            @click="chooseToken(symbolOrID)"
          >
            <div class="token-info">
              <div>
                <token-logo class="token-logo" :symbol="symbolOrID" />
              </div>
              <div id="token-description">
                <div class="tokenSymbol">
                  {{ symbolOrID }}
                </div>
                <token-name :symbol="symbolOrID" />
              </div>
            </div>

            <div class="rightSide">
              <div class="rowItem">
                <div class="total">
                  {{ parseBigNumber(balance.toString()) }}
                  <span class="balancePrice">
                    <token-price :amount="balance" :symbol="symbolOrID" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </template>
        <div v-if="isSearching && !hasDisplayedBalances" class="centerBlock">
          <span>
            Your search <b>"{{ search }}"</b> did not match any tokens
          </span>
        </div>
        <div v-else-if="!hasDisplayedBalances" class="centerBlock">
          <span v-if="tokensType === 'L2-NFT'"
            >No available NFT tokens yet. You can either <nuxt-link to="/transaction/nft/mint">mint</nuxt-link> or
            request them from someone!</span
          >
          <span v-else>No balances yet. Please make a deposit or request money from someone!</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import Vue, { PropOptions } from "vue";
import { searchByKey, searchInObject } from "@rsksmart/rif-rollup-nuxt-core/utils";
import {
  ZkEthereumBalances,
  ZkNFTBalances,
  ZkTokenBalances,
  ZkTransactionMainToken,
} from "@rsksmart/rif-rollup-nuxt-core/types";
import { BigNumberish, formatFixed } from "@ethersproject/bignumber";
import { Tokens } from "@rsksmart/rif-rollup-js-sdk/build/types";

export default Vue.extend({
  props: {
    onlyMintTokens: {
      type: Boolean,
      default: false,
      required: false,
    },
    feeAcceptable: {
      type: Boolean,
      default: false,
      required: false,
    },
    tokensType: {
      type: String,
      default: "L2-Tokens",
      required: false,
    } as PropOptions<ZkTransactionMainToken>,
  },
  data() {
    return {
      search: "",
    };
  },
  computed: {
    accountStateLoading(): boolean {
      return this.$store.getters["zk-account/accountStateLoading"];
    },
    accountStateRequested(): boolean {
      return this.$store.getters["zk-account/accountStateRequested"];
    },
    ethereumBalanceLoadingAll(): boolean {
      return this.$store.getters["zk-balances/ethereumBalanceLoadingAll"];
    },
    ethereumBalancesRequested(): boolean {
      return this.$store.getters["zk-balances/ethereumBalancesRequested"];
    },
    zkTokens(): Tokens {
      return this.$store.getters["zk-tokens/zkTokens"];
    },
    zkTokensLoading(): boolean {
      return this.$store.getters["zk-tokens/zkTokensLoading"];
    },
    mintTokens(): Tokens {
      if (this.zkTokensLoading) {
        return {};
      }
      return Object.fromEntries(
        Object.entries(this.zkTokens ? this.zkTokens : {}).filter(([symbol]) => symbol !== "RBTC")
      );
    },
    zkBalances(): ZkTokenBalances {
      return this.$store.getters["zk-balances/balances"];
    },
    nftBalances(): ZkNFTBalances {
      return this.$store.getters["zk-balances/nfts"];
    },
    ethereumBalances(): ZkEthereumBalances {
      /* eslint-disable no-unused-expressions */
      this.ethereumBalanceLoadingAll;
      return this.$store.getters["zk-balances/ethereumBalances"];
    },
    mainLoading(): boolean {
      if (this.onlyMintTokens) {
        return this.zkTokensLoading;
      }
      if (this.tokensType === "L1-Tokens") {
        return this.ethereumBalanceLoadingAll && !this.ethereumBalancesRequested;
      }
      return this.accountStateLoading && !this.accountStateRequested;
    },
    secondaryLoading(): boolean {
      if (this.tokensType === "L1-Tokens") {
        return this.ethereumBalanceLoadingAll;
      }
      return this.accountStateLoading;
    },
    displayedList(): { [symbolOrID: string]: BigNumberish } {
      if (this.onlyMintTokens) {
        return searchByKey(
          Object.fromEntries(Object.entries(this.mintTokens).map(([symbol]) => [symbol, "0"])),
          this.search
        );
      } else if (this.tokensType === "L1-Tokens") {
        return searchByKey(
          Object.fromEntries(
            Object.entries(this.ethereumBalances).map(([symbol, balance]) => [symbol, balance.toString()])
          ),
          this.search
        );
      } else if (this.tokensType === "L2-Tokens") {
        return searchByKey(
          Object.fromEntries(
            Object.entries(this.zkBalances).map(([symbol, token]) => [symbol, token.balance.toString()])
          ),
          this.search
        );
      } else if (this.tokensType === "L2-NFT") {
        return Object.fromEntries(
          Object.entries(searchInObject(this.nftBalances, this.search, ([tokenID, _]) => `NFT-${tokenID}`)).map(
            ([tokenID, _]) => [tokenID, 1]
          )
        );
      }
      return {};
    },
    allowedFeeTokens(): { [symbol: string]: boolean } {
      return Object.fromEntries(Object.entries(this.zkBalances).map(([symbol, token]) => [symbol, token.feeAvailable]));
    },
    hasDisplayedBalances(): boolean {
      return Object.keys(this.displayedList).length !== 0;
    },
    isSearching(): boolean {
      return !!this.search.trim();
    },
    displayTokenBalance(): boolean {
      return !this.onlyMintTokens && (this.tokensType === "L1-Tokens" || this.tokensType === "L2-Tokens");
    },
  },
  methods: {
    updateBalances() {
      if (this.tokensType === "L1-Tokens") {
        this.$store.dispatch("zk-balances/requestEthereumBalances", true);
      } else {
        this.$store.dispatch("zk-account/updateAccountState", true);
      }
    },
    chooseToken(symbolOrID: string) {
      if (this.feeAcceptable && !this.allowedFeeTokens[symbolOrID]) {
        return;
      }
      if (this.tokensType === "L2-NFT") {
        return this.$emit("chosen", parseInt(symbolOrID));
      }
      return this.$emit("chosen", symbolOrID);
    },
    parseBigNumber(value: string) {
      return formatFixed(value, 18);
    },
  },
});
</script>

<style lang="scss" scoped>
.select-token-header {
  font-weight: bold;
  margin-top: 30px;
  margin-left: 5px;
  font-size: 1.2rem;
}

.tokenListContainer {
  margin-bottom: 30px;
  overflow-y: scroll;
}
.tokenItem {
  padding-left: 0px !important;
  padding-right: 0px !important;
  margin-top: 10px !important;
  height: 80px !important;

  &.-light {
    background-color: white !important;
  }
}
.token-logo {
  text-align: left;
  padding-left: 0px !important;
  padding-right: 0px !important;
  margin-right: 0px !important;
}

.token-info {
  display: flex !important;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  height: 60px;
  margin-left: 10px;

  &.-light {
    background-color: white !important;
  }
}

.tokenName {
  font-size: 0.8rem;
}

.rightSide {
  margin-right: 10px;
}
</style>
