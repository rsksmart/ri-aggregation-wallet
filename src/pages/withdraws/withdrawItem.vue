<template>
  <div class="withdrawTxItem">
    <div class="tokenSymbol">
      <token-logo :symbol="tokenSymbol" />
    </div>
    <i-container>
      <i-row>
        <i-column xs="8">
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
        <i-column xs="4" class="_align-content-space-around">
          <i-row class="_justify-content-end">
            <i-button data-cy="account_withdraw_l1_button" size="sm" variant="secondary"> Withdraw </i-button>
          </i-row>
          <i-row class="_justify-content-end">
            {{ transaction.op.amount | parseBigNumberish(tokenSymbol) }}
          </i-row>
          <i-row class="_justify-content-end">
            {{ tokenSymbol }}
          </i-row>
        </i-column>
      </i-row>
    </i-container>
  </div>
</template>

<script lang="ts">
import Vue, { PropOptions } from "vue";
import { ApiTransaction, TokenSymbol } from "@rsksmart/rif-rollup-js-sdk/build/types";
import { Token } from "@rsksmart/rif-rollup-nuxt-core/types";
import { copyToClipboard } from "@rsksmart/rif-rollup-nuxt-core/utils";
import TokenLogo from "@/components/TokenLogo.vue";
export default Vue.extend({
  components: { TokenLogo },
  props: {
    transaction: {
      type: Object,
      default: () => {},
      required: true,
    } as PropOptions<ApiTransaction>,
  },
  computed: {
    tokenSymbol(): TokenSymbol | number {
      const tokenId = this.transaction.op.token;
      const token: Token = this.$store.getters["zk-tokens/zkTokenByID"](tokenId);
      if (token) {
        return token.symbol;
      }
      return tokenId;
    },
  },
  methods: {
    copyAddress(hash: string) {
      copyToClipboard(hash.toLowerCase());
    },
    trimHash(hash: string) {
      return `${hash.substr(0, 4)}...${hash.substr(hash.length - 4, hash.length)}`;
    },
  },
});
</script>
