<template>
  <div class="withdrawTxItem">
    <div class="tokenSymbol">
      <token-logo :symbol="tokenSymbol" />
    </div>
    <i-container>
      <i-row>
        <i-column class="withdrawTxt" xs="8">
          <i-row>
            <span>Tx hash: {{ trimHash(transaction.txHash) }}</span>
            <i class="copy" @click="copyAddress(transaction.txHash)">
              <v-icon name="ri-clipboard-line" />
            </i>
          </i-row>
          <i-row>
            <span>From: {{ trimHash(transaction.op.from) }}</span>
            <i class="copy" @click="copyAddress(transaction.op.from)">
              <v-icon name="ri-clipboard-line" />
            </i>
          </i-row>
          <i-row>
            <span>To: {{ trimHash(transaction.op.to) }}</span>
            <i class="copy" @click="copyAddress(transaction.op.to)">
              <v-icon name="ri-clipboard-line" />
            </i>
          </i-row>
        </i-column>
        <i-column xs="4" class="details">
          <i-row class="_justify-content-end"> - {{ transaction.op.amount | parseBigNumberish(tokenSymbol) }} </i-row>
          <i-row class="_justify-content-end">
            {{ tokenSymbol }}
          </i-row>
          <i-row class="_justify-content-end">
            <token-price :symbol="tokenSymbol" :amount="transaction.op.amount" />
          </i-row>
        </i-column>
      </i-row>
      <i-row>
        <i-column class="_padding-0">
          <div class="createdAt">{{ timeAgo }}</div>
          <i-tooltip placement="bottom-start" class="status">
            <v-icon :name="transactionStatus.icon" :class="transactionStatus.class" />
            <template #body>{{ transactionStatus.text }}</template>
          </i-tooltip>
        </i-column>
      </i-row>
      <i-row class="_justify-content-end">
        <i-button
          v-if="isTwoStepWithdrawEnabled()"
          class="withdraw-btn"
          data-cy="account_withdraw_l1_button"
          variant="secondary"
        >
          complete withdrawal
        </i-button>
        <i-button v-else disabled class="withdraw-btn" data-cy="account_withdraw_l1_button" variant="success">
          withdrawal complete
        </i-button>
      </i-row>
    </i-container>
  </div>
</template>

<script lang="ts">
import Vue, { PropOptions } from "vue";
import { ApiTransaction, TokenSymbol } from "@rsksmart/rif-rollup-js-sdk/build/types";
import { Token } from "@rsksmart/rif-rollup-nuxt-core/types";
import { copyToClipboard } from "@rsksmart/rif-rollup-nuxt-core/utils";
import moment from "moment-timezone";
import { WithdrawData } from "@rsksmart/rif-rollup-js-sdk/src/types";
import TokenLogo from "../../components/TokenLogo.vue";
import TokenPrice from "../../components/TokenPrice.vue";

export default Vue.extend({
  components: { TokenPrice, TokenLogo },
  props: {
    transaction: {
      type: Object,
      default: () => {},
      required: true,
    } as PropOptions<ApiTransaction>,
  },
  computed: {
    tokenSymbol(): TokenSymbol | number {
      console.log("tx:", this.transaction);
      const txData: WithdrawData = this.transaction.op as WithdrawData;
      const tokenId = txData.token;
      const token: Token = this.$store.getters["zk-tokens/zkTokenByID"](tokenId);
      if (token) {
        return token.symbol;
      }
      return tokenId;
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
    timeAgo(): string {
      if (!this.transaction.createdAt) {
        return "";
      }
      return moment(this.transaction.createdAt).tz("UTC").fromNow();
    },
  },
  methods: {
    copyAddress(hash: string) {
      copyToClipboard(hash.toLowerCase());
    },
    trimHash(hash: string) {
      return `${hash.substr(0, 4)}...${hash.substr(hash.length - 4, hash.length)}`;
    },
    isTwoStepWithdrawEnabled(): boolean {
      return process.env.IS_TWO_STEP_WITHDRAW_ENABLED?.toUpperCase() === "TRUE";
    },
  },
});
</script>
