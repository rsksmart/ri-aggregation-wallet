<template>
  <div class="feeInput">
    <i-container class="_margin-top-0">
      <i-row>
        <i-column class="_padding-0 _margin-right-1-2" xs="4">
          <token-selector :token="feeSymbol" @chooseToken="$emit('chooseFeeToken')" />
        </i-column>
        <i-column class="_padding-0">
          <div class="feeValue">
            <template v-for="item in fees">
              <div :key="item.key" data-cy="fee_block_fee_message">
                <i-container>
                  <i-row>
                    <span class="txFees">Transaction fees</span>
                  </i-row>
                  <i-row>
                    <i-column class="_padding-left-0">
                      <div>
                        <span
                          v-if="
                            (item.key === 'txFee' && !feeLoading) ||
                            (item.key === 'accountActivation' && !activationFeeLoading)
                          "
                        >
                          {{ item.amount.toString() | parseBigNumberish(feeSymbol) }}
                        </span>
                        <span v-else>Loading...</span>
                      </div>
                    </i-column>
                    <i-column class="_padding-right-0 _text-right">
                      <token-price :amount="item.amount.toString()" :symbol="feeSymbol" />
                    </i-column>
                  </i-row>
                </i-container>
              </div>
            </template>
          </div>
        </i-column>
      </i-row>
    </i-container>
    <div v-if="feeSymbol && !enoughBalanceToPayFee" class="errorText _text-center _margin-top-1">
      Not enough <span class="tokenSymbol">{{ feeSymbol }}</span> to pay the fee
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { TokenSymbol } from "@rsksmart/rif-rollup-js-sdk/build/types";
import { ZkFee, ZkFeeType } from "@rsksmart/rif-rollup-nuxt-core/types";
import TokenSelector from "@/components/TokenSelector.vue";
import TokenPrice from "@/components/TokenPrice.vue";

const feeNameDict = new Map([
  ["txFee", "Fee"],
  ["accountActivation", "Account Activation single-time fee"],
]);
export default Vue.extend({
  name: "FeeInputNew",
  components: { TokenPrice, TokenSelector },
  data() {
    return {
      chooseTokenModal: false as false | "mainToken" | "feeToken",
    };
  },
  computed: {
    fees(): ZkFee[] {
      return this.$store.getters["zk-transaction/fees"];
    },
    requiredFees(): ZkFeeType[] {
      return this.$store.getters["zk-transaction/requiredFees"];
    },
    feeError(): Error {
      return this.$store.getters["zk-transaction/feeError"];
    },
    feeSymbol(): TokenSymbol | undefined {
      return this.$store.getters["zk-transaction/feeSymbol"];
    },
    feeLoading(): boolean {
      return this.$store.getters["zk-transaction/feeLoading"];
    },
    enoughBalanceToPayFee(): boolean {
      return this.$store.getters["zk-transaction/enoughBalanceToPayFee"];
    },
    activationFeeLoading(): boolean {
      return this.$store.getters["zk-transaction/activationFeeLoading"];
    },
  },
  methods: {
    getFeeName(key: string): string | undefined {
      return feeNameDict!.has(key) ? feeNameDict.get(key) : "";
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
    color: #3a3a3a !important;
    font-size: 10px !important;
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
</style>
