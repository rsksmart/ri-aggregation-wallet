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
    <template v-if="hasAccountActivationFee & !activationFeeLoading">
      <i-container class="_margin-top-1">
        <i-row>
          <i-column xs="7" class="_padding-left-0">
            <i-tooltip>
              <v-icon class="infoIcon" name="ri-question-mark" scale="0.8" />
              <template #body>Added to your transaction fee only once</template>
            </i-tooltip>
            <span>Account activation fee:</span>
          </i-column>
          <i-column xs="3" class="_padding-left-0 _padding-right-0 _text-right">
            {{ accountActivationFee | parseBigNumberish(feeSymbol) }}
          </i-column>
          <i-column xs="2" class="_padding-right-0 _text-right">
            <token-price :amount="accountActivationFee" :symbol="feeSymbol" />
          </i-column>
        </i-row>
      </i-container>
    </template>
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
import { ZkFee } from "@rsksmart/rif-rollup-nuxt-core/types";
import { BigNumberish } from "@web3-onboard/common/node_modules/@ethersproject/bignumber";
import TokenSelector from "@/components/TokenSelector.vue";
import TokenPrice from "@/components/TokenPrice.vue";

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
      return this.$store.getters["zk-transaction/totalFee"];
    },
    fees(): ZkFee[] {
      return this.$store.getters["zk-transaction/fees"];
    },
    hasAccountActivationFee(): boolean {
      return this.fees.filter((f: ZkFee) => f.key === "accountActivation").length > 0;
    },
    accountActivationFee(): string | undefined {
      const [accountActivation] = this.fees.filter((f: ZkFee) => f.key === "accountActivation");
      return this.activationFeeLoading ? "Loading..." : accountActivation?.amount?.toString();
    },
    activationFeeLoading(): boolean {
      return this.$store.getters["zk-transaction/activationFeeLoading"];
    },
  },
  methods: {
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
  .infoIcon {
    background-color: #ffffff30;
    border: 1.25px solid #ffffff30 !important;
  }
}

.infoIcon {
  margin-left: 0;
  background-color: $white;
  border: 1.25px solid $white !important;
  border-radius: 10px;
}
</style>
