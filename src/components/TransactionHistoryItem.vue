<template>
  <div class="transaction">
    <token-logo :symbol="tokenSymbol" />
    <div class="mainInfo" :class="{ noInfo: isNFT || isSwap }">
      <div class="actionType">
        <span>{{ transactionTypeData.type }}</span>
        <div v-if="transactionTypeData.showAddress && isSameAddress(displayedAddress)" class="actionValue">
          Your own account
        </div>
        <nuxt-link
          v-else-if="transactionTypeData.showAddress && displayedAddress"
          class="actionValue"
          :to="`/contacts/${displayedAddress}`"
        >
          {{ getAddressName(displayedAddress) }}
        </nuxt-link>
      </div>
      <i-tooltip>
        <div class="createdAt">{{ timeAgo }}</div>
        <template #body>{{ transaction.createdAt | formatDateTime }}</template>
      </i-tooltip>
    </div>
    <div class="actionInfo">
      <div v-if="!isNFT && !isSwap" :class="{ small: smallAmountText }" class="amount">
        {{ itReducesMyBalance }} {{ amount | parseBigNumberish(tokenSymbol) }} {{ tokenSymbol }}
      </div>
      <token-price :symbol="tokenSymbol" :amount="amount" />
      <template v-if="!isMintNFT && !isSwap">
        <span v-if="isNFT && tokenSymbol">NFT-</span>
        <div v-else-if="isNFT && transaction.tx && transaction.tx.contentHash" class="nft">
          <span class="contentHash">{{ transaction.tx.contentHash }}</span>
          <i-tooltip
            placement="left"
            trigger="click"
            class="copyContentHash"
            @click.native="copy(transaction.tx.contentHash)"
          >
            <div class="iconContainer">
              <v-icon name="ri-clipboard-line" />
              <span>Copy hash</span>
            </div>
            <template #body>Copied!</template>
          </i-tooltip>
        </div>
      </template>
      <a
        v-if="isL1Transaction()"
        :href="getL1ExplorerTransactionLink"
        target="_blank"
        class="linkText"
        @click.passive="$analytics.track('view_transaction_in_blockexplorer')"
      >
        <svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clip-path="url(#clip0_533_189)">
            <path
              d="M7.50415 4.39763C8.7658 4.39763 9.78857 3.41319 9.78857 2.19882C9.78857 0.984444 8.7658 0 7.50415 0C6.2425 0 5.21973 0.984444 5.21973 2.19882C5.21973 3.41319 6.2425 4.39763 7.50415 4.39763Z"
              :fill="linkColor"
            />
            <path
              d="M13.8559 8.99557C12.7627 8.38899 11.366 8.75022 10.7358 9.80251C10.5188 10.1646 10.4214 10.5611 10.4306 10.9503C10.4535 11.9194 9.54816 12.4237 8.68731 11.9232C8.65336 11.9033 8.61852 11.8837 8.58324 11.8655C7.71269 11.3977 7.71313 10.4015 8.58412 9.9341C9.29723 9.56226 9.78189 8.83512 9.78189 7.99974C9.78189 7.98276 9.78101 7.9662 9.78057 7.94965L9.78145 7.95092C9.75896 6.98056 10.6666 6.4767 11.5283 6.98098C12.2185 7.38424 13.1102 7.42202 13.8586 7.0056C14.9509 6.39817 15.3249 5.05298 14.6938 4.00154C14.0628 2.9501 12.6652 2.59014 11.5728 3.19757C10.8249 3.61356 10.4143 4.37466 10.4315 5.15104C10.454 6.11928 9.54948 6.62314 8.68952 6.12353C8.34244 5.91893 7.93495 5.80092 7.49836 5.80092C7.06176 5.80092 6.65427 5.91893 6.30763 6.1231C5.44943 6.62102 4.54757 6.11801 4.5705 5.15189C4.58815 4.37381 4.17536 3.61102 3.42521 3.19545C2.33151 2.59014 0.934837 2.95265 0.30596 4.00536C-0.322917 5.05808 0.0537032 6.40241 1.1474 7.00772C1.89491 7.42159 2.78398 7.38296 3.47284 6.98098C4.33236 6.47882 5.23775 6.98225 5.21482 7.95007L5.2157 7.9488C5.2157 7.96578 5.21438 7.98276 5.21438 8.00016C5.21438 8.83597 5.6986 9.56268 6.41215 9.93453C7.28358 10.4023 7.28314 11.3998 6.41127 11.8668C6.37599 11.885 6.34159 11.9045 6.30763 11.9245C5.44943 12.4216 4.54801 11.9181 4.57095 10.952C4.58065 10.5611 4.4823 10.1625 4.264 9.79912C3.6316 8.7481 2.23405 8.38984 1.14211 8.99812C0.0479701 9.6064 -0.32424 10.9516 0.307724 12.0026C0.940129 13.0536 2.33768 13.4119 3.42962 12.8036C3.44373 12.7955 3.4574 12.787 3.47151 12.779L3.47019 12.7807C4.3306 12.2781 5.23599 12.782 5.21261 13.7502L5.21349 13.7489C5.21349 13.7668 5.21217 13.785 5.21217 13.8028C5.21349 15.0173 6.23707 16.0008 7.4988 15.9995C8.76052 15.9983 9.78234 15.013 9.78101 13.7986C9.78101 13.7825 9.78013 13.7663 9.77969 13.7502L9.78057 13.7515C9.75764 12.7807 10.6657 12.2764 11.5278 12.7807L11.5265 12.7786C11.5424 12.7879 11.5574 12.7972 11.5733 12.8061C12.6665 13.4127 14.0632 13.0515 14.6934 11.9992C15.3236 10.9469 14.9483 9.60258 13.855 8.996L13.8559 8.99557Z"
              :fill="linkColor"
            />
          </g>
          <defs>
            <clipPath id="clip0_533_189">
              <rect width="15" height="16" fill="white" />
            </clipPath>
          </defs>
        </svg>
      </a>
    </div>
    <a
      class="button -md -secondary -link externalLink"
      target="_blank"
      :href="getL2ExplorerTransactionLink"
      @click.passive="$analytics.track('view_transaction_in_zkscan')"
    >
      <v-icon name="ri-external-link-line" scale="0.8" />
    </a>
  </div>
</template>

<script lang="ts">
import { utils } from "@rsksmart/rif-rollup-js-sdk";

import moment from "moment-timezone";
import Vue, { PropOptions } from "vue";
import { BigNumberish } from "@ethersproject/bignumber";
import { Address, ApiTransaction, TokenSymbol } from "@rsksmart/rif-rollup-js-sdk/build/types";
import { Token, ZkConfig, ZkContact } from "@rsksmart/rif-rollup-nuxt-core/types";
import { copyToClipboard } from "@rsksmart/rif-rollup-nuxt-core/utils";
import { getAddress } from "ethers/lib/utils";
import TokenPrice from "@/components/TokenPrice.vue";
import TokenLogo from "@/components/TokenLogo.vue";

let getTimeAgoInterval: ReturnType<typeof setInterval>;
export default Vue.extend({
  components: { TokenLogo, TokenPrice },
  props: {
    transaction: {
      type: Object,
      default: () => {},
      required: true,
    } as PropOptions<ApiTransaction>,
  },
  data() {
    return {
      timeAgo: "",
      l1TransactionHash: "",
      config: this.$store.getters["zk-onboard/config"] as ZkConfig,
    };
  },
  computed: {
    isFeeTransaction(): boolean {
      return (
        this.transaction.op.type === "ChangePubKey" ||
        this.transaction.op.type === "FullExit" ||
        this.transaction.op.type === "Close" ||
        (this.transaction.op.type === "Transfer" &&
          this.transaction.op.amount === "0" &&
          this.transaction.op.from === this.transaction.op.to)
      );
    },
    walletAddressFull(): Address {
      return this.$store.getters["zk-account/address"];
    },
    displayedAddress(): Address {
      const op = this.transaction.op;
      if (op.type === "Transfer") {
        if (this.isSameAddress(op.to)) {
          return op.from;
        } else {
          return op.to;
        }
      } else if (op.type === "Deposit" || op.type === "Withdraw" || op.type === "WithdrawNFT") {
        return op.from;
      } else if (op.type === "MintNFT") {
        return op.recipient;
      } else if (op.type === "ForcedExit") {
        return op.target;
      } else if (op.type === "Close") {
        return op.account;
      } else if (op.type === "Swap") {
        if (this.isSameAddress(op.orders[0].recipient)) {
          return op.orders[1].recipient;
        } else {
          return op.orders[0].recipient;
        }
      }
      return "";
    },
    transactionStatus(): { text: string; icon: string; class: string } {
      if (this.transaction.failReason) {
        return {
          text: this.transaction.failReason ? this.transaction.failReason : "Rejected",
          icon: "ri-close-circle-fill",
          class: "rejected",
        };
      }
      if (this.transaction.status === "finalized") {
        return {
          text: "Verified",
          icon: "ri-check-double-line",
          class: "verified",
        };
      } else if (this.transaction.status === "committed") {
        return {
          text: "Committed",
          icon: "ri-check-line",
          class: "committed",
        };
      } else {
        return {
          text: "Initiated",
          icon: "ri-loader-5-line",
          class: "inProgress",
        };
      }
    },
    transactionTypeData(): { type: string; showAddress: boolean; modal: false | { icon: string; key: string } } {
      switch (this.transaction.op.type) {
        case "Withdraw":
          return {
            type: "Withdrawn to:",
            showAddress: true,
            modal: false,
          };
        case "WithdrawNFT":
          return {
            type: "Withdraw NFT to:",
            showAddress: true,
            modal: false,
          };
        case "ForcedExit":
          return {
            type: "Forced Exited to:",
            showAddress: true,
            modal: false,
          };
        case "FullExit":
          return {
            type: "Full Exited to:",
            showAddress: true,
            modal: false,
          };
        case "Close":
          return {
            type: "Close Account",
            showAddress: false,
            modal: false,
          };
        case "Swap":
          return {
            type: "Pair Swap",
            showAddress: true,
            modal: false,
          };
        case "ChangePubKey":
          return {
            type: "Account activation",
            showAddress: false,
            modal: {
              icon: "ri-information-fill",
              key: "AccountActivation",
            },
          };
        case "Deposit":
          return {
            type: "From:",
            showAddress: true,
            modal: false,
          };
        case "MintNFT":
          return {
            type: "Mint NFT to:",
            showAddress: true,
            modal: false,
          };
        case "Transfer":
          if (this.isFeeTransaction) {
            return {
              type: "Fee transaction",
              showAddress: false,
              modal: false,
            };
          } else {
            if (this.isSameAddress(this.transaction.op.to)) {
              return {
                type: "Received from:",
                showAddress: true,
                modal: false,
              };
            }
            return {
              type: "To:",
              showAddress: true,
              modal: false,
            };
          }
        default:
          return {
            // @ts-ignore
            type: this.transaction.op.type.toString(),
            showAddress: true,
            modal: false,
          };
      }
    },
    tokenSymbol(): TokenSymbol | number {
      let tokenID = 0;
      switch (this.transaction.op.type) {
        case "Withdraw":
        case "WithdrawNFT":
        case "ForcedExit":
        case "Transfer":
          tokenID = this.transaction.op.token;
          break;
        case "Deposit":
        case "FullExit":
          tokenID = this.transaction.op.tokenId;
          break;
        case "Close":
        case "Swap":
          return "";
        case "ChangePubKey":
        case "MintNFT":
          tokenID = this.transaction.op.feeToken;
          break;
      }
      const token: Token = this.$store.getters["zk-tokens/zkTokenByID"](tokenID);
      if (token) {
        return token.symbol;
      }
      return tokenID;
    },
    isMintNFT(): boolean {
      return this.transaction.op.type === "MintNFT";
    },
    isSwap(): boolean {
      return this.transaction.op.type === "Swap";
    },
    isNFT(): boolean {
      if (this.isMintNFT || typeof this.tokenSymbol === "number") {
        return true;
      }
      return utils.isNFT(this.tokenSymbol);
    },
    amount(): BigNumberish | undefined {
      switch (this.transaction.op.type) {
        case "Withdraw":
        case "Transfer":
        case "Deposit":
          if (!this.isNFT) {
            if (this.transaction.op.type === "Transfer" && this.isFeeTransaction) {
              return this.transaction.op.fee;
            }
            return this.transaction.op.amount;
          } else {
            return undefined;
          }
        case "WithdrawNFT":
        case "FullExit":
        case "Close":
        case "Swap":
          return undefined;
        case "ForcedExit":
        case "ChangePubKey":
        case "MintNFT":
          return this.transaction.op.fee;
      }
      return undefined;
    },
    smallAmountText(): boolean {
      if (this.isNFT || !this.amount || !this.tokenSymbol) {
        return false;
      }
      const amount = this.$options.filters?.parseBigNumberish(this.amount, this.tokenSymbol);
      if (!amount) {
        return false;
      }
      return `${amount} ${this.tokenSymbol}`.length > 15;
    },
    getL1ExplorerTransactionLink(): string {
      return `${this.config.ethereumNetwork.rskExplorer}tx/${this.l1TransactionHash}`;
    },
    getL2ExplorerTransactionLink(): string {
      if (this.transaction.op.type === "Deposit") {
        return `${this.config.zkSyncNetwork.rollupExplorer}transactions/${this.l1TransactionHash}`;
      }
      return `${this.config.zkSyncNetwork.rollupExplorer}transactions/${this.transaction.txHash}`;
    },
    itReducesMyBalance(): string {
      if (
          this.transaction.op.type === "Transfer" ||
          this.transaction.op.type === "Deposit" ||
          this.transaction.op.type === "FullExit"
      ) {
        return "-";
      }
      return this.transaction.op.type;
    },
    linkColor(): string {
      return this.$inkline.config.variant === "dark" ? "#FFF" : "#A5ADF7";
    },
  },
  mounted() {
    this.timeAgo = this.getTimeAgo(this.transaction.createdAt);
    getTimeAgoInterval = setInterval(() => {
      if (!this.transaction) {
        return clearInterval(getTimeAgoInterval);
      }
      this.timeAgo = this.getTimeAgo(this.transaction.createdAt);
    }, 30000);
    this.getL1TransactionHash();
  },
  beforeDestroy() {
    clearInterval(getTimeAgoInterval);
  },
  methods: {
    isSameAddress(address: Address): boolean {
      return getAddress(address) === getAddress(this.walletAddressFull);
    },
    getTimeAgo(time?: string): string {
      if (!time) {
        return "";
      }
      return moment(time).tz("UTC").fromNow();
    },
    getAddressName(address: string): string {
      const contactFromStore: ZkContact = this.$store.getters["zk-contacts/contactByAddress"](address);
      return contactFromStore && !contactFromStore.deleted
        ? contactFromStore.name
        : address.replace(address.slice(6, address.length - 3), "...");
    },
    async getL1TransactionHash() {
      const tx = this.transaction;
      if (tx.op.type === "Withdraw" || tx.op.type === "WithdrawNFT" || tx.op.type === "ForcedExit") {
        const withdrawalEthTxHash = await this.$store.dispatch("zk-history/getWithdrawalEthTxHash", tx.txHash);
        if (withdrawalEthTxHash) {
          this.l1TransactionHash = withdrawalEthTxHash;
        }
      } else if (tx.op.type === "Deposit" || tx.op.type === "FullExit") {
        this.l1TransactionHash = tx.op.ethHash;
      }
    },
    copy(value: string) {
      copyToClipboard(value);
    },
    isL1Transaction() {
      return ["Deposit", "Withdraw"].includes(this.transaction.op.type);
    },
  },
});
</script>
