<template>
  <div class="feeInput">
    <i-container class="_margin-top-0">
      <i-row>
        <i-column class="_padding-0 _margin-right-1-2" xs="4">
          <token-selector
            :token="type === 'Deposit' ? 'RBTC' : feeSymbol"
            @chooseToken="type !== 'Deposit' ? $emit('chooseFeeToken') : null"
          />
        </i-column>
        <i-column class="_padding-0">
          <div class="feeValue">
            <template>
              <i-container>
                <i-row>
                  <span class="txFees">Transaction fees</span>
                </i-row>
                <i-row>
                  <i-column class="_padding-left-0">
                    <span>
                      {{ totalFee.toString() | parseBigNumberish(feeSymbol) }}
                    </span>
                  </i-column>
                  <i-column class="_padding-right-0 _text-right">
                    <token-price :amount="totalFee.toString()" :symbol="feeSymbol" />
                  </i-column>
                </i-row>
              </i-container>
            </template>
          </div>
        </i-column>
      </i-row>
    </i-container>
    <div v-if="feeSymbol && !enoughBalanceToPayFee" class="errorText _text-center _margin-top-1">
      Not enough <span class="tokenSymbol">{{ feeSymbol }}</span> to pay the fee
    </div>
    <div
      v-if="feeError"
      class="_display-flex _justify-content-center _align-items-center _padding-left-2 _margin-top-1"
    >
      <div class="errorText _text-center">
        <span>{{ feeError }}</span>
        <div class="_text-decoration-underline _cursor-pointer" @click="requestFees()">Try again</div>
      </div>
      <v-icon
        id="questionMark"
        class="iconInfo _margin-left-1"
        name="ri-question-mark"
        scale="0.9"
        @click.native="$accessor.openModal('FeeReqError')"
      />
    </div>
  </div>
</template>

<script lang="ts">
import Vue, { PropOptions } from "vue";
import { ZkTransactionType } from "@rsksmart/rif-rollup-nuxt-core/types";
import { TokenSymbol } from "@rsksmart/rif-rollup-js-sdk/build/types";
import { BigNumberish } from "@ethersproject/bignumber";
import TokenSelector from "@/components/TokenSelector.vue";
import TokenPrice from "@/components/TokenPrice.vue";

const feeNameDict = new Map([
  ["txFee", "Fee"],
  ["accountActivation", "Account Activation single-time fee"],
]);
export default Vue.extend({
  name: "FeeInputNew",
  components: { TokenPrice, TokenSelector },
  props: {
    type: {
      type: String,
      default: "Transfer",
      required: false,
    } as PropOptions<ZkTransactionType>,
  },
  data() {
    return {
      chooseTokenModal: false as false | "mainToken" | "feeToken",
    };
  },
  computed: {
    feeError(): Error {
      return this.$store.getters["zk-transaction/feeError"];
    },
    feeSymbol(): TokenSymbol | undefined {
      return this.$store.getters["zk-transaction/feeSymbol"];
    },
    enoughBalanceToPayFee(): boolean {
      return this.$store.getters["zk-transaction/enoughBalanceToPayFee"];
    },
    totalFee(): any | BigNumberish {
      console.log("totalFee: ", this.$store.getters["zk-transaction/totalFee"].toString());
      return this.$store.getters["zk-transaction/totalFee"];
    },
  },
  methods: {
    getFeeName(key: string): string | undefined {
      return feeNameDict!.has(key) ? feeNameDict.get(key) : "";
    },
    async requestFees() {
      await this.$store.dispatch("zk-transaction/requestAllFees", true);
    },
  },
});
</script>

<style lang="scss">
.feeInput {
  font-style: normal;
  font-weight: 400;
  line-height: 140%;
  .txFees {
    color: #3a3a3a;
    font-size: 10px;
  }
  .feeValue {
    border-radius: $borderRadiusSm 0 0 $borderRadiusSm !important;
    height: 78px;
    padding: 12px 16px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    background-color: $white;
    font-size: 1.15rem;
  }
}
body.inkline.-dark {
  .feeValue {
    background-color: #ffffff30;
  }
  .txFees {
    color: $white;
  }
}
</style>
