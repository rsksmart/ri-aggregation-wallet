<template>
  <div class="amountInputNew" :class="{ error: error }">
    <i-container>
      <i-row>
        <i-column class="_padding-0 _margin-right-1-2" xs="4">
          <token-selector :token="token" @chooseToken="$emit('chooseToken')" />
        </i-column>
        <i-column class="_padding-0">
          <i-input
            ref="amountInput"
            v-model="inputtedAmount"
            data-cy="amount_block_token_input"
            maxlength="35"
            size="lg"
            type="text"
            @keyup.enter="$emit('enter')"
          >
            <template #suffix>
              <div v-if="token" class="maxValue" data-cy="amount_block_token_max_amount" @click="chooseMaxAmount()">
                Max
              </div>
            </template>
          </i-input>
        </i-column>
      </i-row>
    </i-container>
    <div class="error _padding-top-0 _justify-content-end" data-cy="amount_block_token_error_message">
      {{ error }}
    </div>
  </div>
</template>

<script lang="ts">
import Vue, { PropOptions } from "vue";
import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { TokenSymbol } from "@rsksmart/rif-rollup-js-sdk/build/types";
import { isTransactionAmountPackable } from "@rsksmart/rif-rollup-js-sdk/build/utils";
import { DecimalBalance, ZkTransactionType } from "@rsksmart/rif-rollup-nuxt-core/types";
import TokenSelector from "@/components/TokenSelector.vue";

export default Vue.extend({
  name: "AmountInputNew",
  components: { TokenSelector },
  props: {
    value: {
      type: String,
      default: "",
      required: false,
    } as PropOptions<DecimalBalance>,
    type: {
      type: String,
      default: "Transfer",
      required: false,
    } as PropOptions<ZkTransactionType>,
    typeName: {
      type: String,
      default: "Transfer",
      required: false,
    },
    maxAmount: {
      type: String,
      default: "",
      required: false,
    } as PropOptions<BigNumberish>,
    token: {
      type: String,
      required: false,
      default: undefined,
    } as PropOptions<TokenSymbol>,
    autofocus: {
      type: Boolean,
      default: false,
      required: false,
    },
  },
  data() {
    return {
      inputtedAmount: this.value ? this.value : "",
      error: "",
    };
  },
  computed: {
    inputtedAmountBigNumber(): BigNumber {
      if (this.inputtedAmount) {
        try {
          return this.$options.filters!.parseDecimal(this.inputtedAmount, this.token);
        } catch (error) {}
      }
      return BigNumber.from("0");
    },
  },
  watch: {
    token: {
      deep: true,
      handler() {
        if (!this.inputtedAmount) {
          return;
        }
        this.emitValue(this.inputtedAmount);
      },
    },
    maxAmount: {
      deep: true,
      handler() {
        if (!this.inputtedAmount) {
          return;
        }
        this.emitValue(this.inputtedAmount);
      },
    },
    inputtedAmount(val) {
      if (val?.includes(",")) {
        this.inputtedAmount = val.replace(",", ".");
        return;
      }
      this.emitValue(val);
    },
    value(val) {
      if (!this.error || (this.error && !!val)) {
        this.inputtedAmount = val;
      }
    },
  },
  mounted() {
    if (this.autofocus && !this.$accessor.currentModal) {
      (this.$refs.amountInput as Vue)?.$el?.querySelector("input")?.focus();
    }
    if (!this.token) {
      this.$store.dispatch("zk-transaction/fillEmptySymbol");
    }
  },
  methods: {
    emitValue(val: string): void {
      const trimmed = val.trim();
      this.inputtedAmount = trimmed;
      if (val !== trimmed) {
        return;
      }
      this.validateAmount(val);
      if (!this.error) {
        this.$emit("input", val);
      } else {
        this.$emit("input", "");
      }
    },
    validateAmount(val: string) {
      if (!val || !parseFloat(val)) {
        this.error = "Wrong amount inputted";
        return;
      }
      if (!this.token) {
        this.error = "";
        return;
      }

      let inputAmount = null;
      try {
        inputAmount = this.$options.filters!.parseDecimal(val, this.token);
      } catch ({ message }) {
        let errorInfo =
          "Amount processing error. Common reason behind it — inaccurate amount. Try again paying attention to the decimal amount number format — it should help";
        if ((message as string).search("fractional component exceeds decimals") !== -1) {
          errorInfo = `Precision exceeded: ${this.token} doesn't support that many decimal digits`;
        }
        this.error = errorInfo;
        return;
      }

      if (inputAmount.lte(0)) {
        this.error = "Wrong amount inputted";
        return;
      }

      if (this.maxAmount) {
        if (inputAmount.gt(this.maxAmount)) {
          this.error = `Not enough ${this.token} to ${this.typeName} requested amount`;
          return;
        }
      }

      if (this.type === "Transfer" && !isTransactionAmountPackable(inputAmount.toString())) {
        this.error = "Max supported precision for transfers exceeded";
        return;
      }
      this.error = "";
    },
    chooseMaxAmount() {
      console.log("maxAmount: ", this.maxAmount);
      try {
        this.inputtedAmount = this.$options.filters!.parseBigNumberish(this.maxAmount, this.token);
      } catch (error) {
        console.warn("Error choose max amount\n", error);
      }
    },
  },
});
</script>
