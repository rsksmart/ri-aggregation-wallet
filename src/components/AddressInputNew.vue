<template>
  <div>
    <div class="txAddressInput" @click.self="focusInput()">
      <div class="addressValidation">
        <div :class="isValid ? 'valid' : 'error'">
          {{ isValid ? "Address is valid" : "Address is invalid" }}
        </div>
      </div>
      <input
        id="addressInput"
        ref="addressInput"
        v-model="inputtedWallet"
        placeholder="Recipient address"
        type="text"
        autocomplete="none"
        data-cy="address_block_wallet_address_input"
        spellcheck="false"
        maxlength="100"
        @keyup.enter="$emit('enter')"
        @change="$emit('change', $event)"
        @input="getDomainAddress"
      />
    </div>
    <div :class="{ error: error }">
      <transition name="fadeFast">
        <div v-if="rnsDomain" class="text-xs text-left flex domainAddress">
          <img height="16" width="16" src="/images/rootstock.png" alt="RNS Domain Logo" />
          {{ domainSubText }}
        </div>
        <div v-if="domainFetchingInProgress">
          <img src="../static/rif-loading.gif" alt="domain fetching in progress icon" />
        </div>
      </transition>
    </div>
  </div>
</template>

<script lang="ts">
import Vue, { PropOptions } from "vue";
import { Address, TokenSymbol } from "@rsksmart/rif-rollup-js-sdk/build/types";
import { validateAddress } from "@rsksmart/rif-rollup-nuxt-core/utils";

export default Vue.extend({
  name: "AddressInputNew",
  props: {
    value: {
      type: String,
      default: "",
      required: false,
    } as PropOptions<Address>,
    token: {
      type: String,
      required: false,
      default: "RBTC",
    } as PropOptions<TokenSymbol>,
  },
  data() {
    return {
      inputtedWallet: this.value ?? "",
      domainFetchingInProgress: false,
      debounceTimer: null as NodeJS.Timeout | null,
    };
  },
  computed: {
    isValid(): boolean {
      return validateAddress(this.inputtedWallet) || this.isValidDomain;
    },
    error(): string {
      if (this.domainFetchingInProgress) {
        return "";
      }
      if (this.inputtedWallet && !this.isValid) {
        return "Invalid address";
      } else {
        return "";
      }
    },
    isValidDomain(): boolean {
      return !!this.getDomain && !this.domainFetchingInProgress;
    },
    getDomain(): string | null {
      return this.$store.getters["rns/getDomain"](this.inputtedWallet, this.token);
    },
    domainSubText(): string {
      const domain = this.rnsDomain;
      if (domain) {
        return domain.substring(0, 6) + "..." + domain.substring(domain.length - 6, domain.length);
      } else {
        return "";
      }
    },
    rnsDomain(): string | null {
      return this.getDomain;
    },
  },
  watch: {
    inputtedWallet(val) {
      const trimmed = val.trim().replace("zksync:", "");
      this.inputtedWallet = trimmed;
      if (val !== trimmed) {
        return;
      }
      this.$emit("input", this.isValid ? val : "");
    },
    getDomain(val) {
      val && this.$emit("input", val);
    },
    value(val) {
      if (this.isValid || (!this.isValid && !!val)) {
        this.inputtedWallet = val;
      }
    },
    token() {
      this.getDomainAddress();
    },
  },
  methods: {
    focusInput(): void {
      if (this.$refs.input) {
        (this.$refs.input as HTMLElement).focus();
      }
    },
    getDomainAddress() {
      this.$emit("clearError");
      if (this.debounceTimer) clearTimeout(this.debounceTimer);

      this.debounceTimer = setTimeout(async () => {
        if (!this.isValidDomain) {
          try {
            this.domainFetchingInProgress = true;
            await this.$store.dispatch("rns/lookupDomain", { address: this.inputtedWallet });
          } catch (error) {
            console.warn("RNS lookup failed", error);
          } finally {
            this.domainFetchingInProgress = false;
          }
        }
      }, 500); // Adjust the debounce delay as needed
    },
  },
});
</script>

<style lang="scss" scoped>
#addressInput,
#addressInput::placeholder {
  font-size: 13px;
}
.txAddressInput {
  input {
    color: $black;
    width: 100%;
    height: 78px;
    border-radius: 6px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    background: #fff;
    padding: 16px;
  }
  input::placeholder {
    color: #b8b8b8;
    margin: 0 !important;
  }
  .addressValidation {
    margin: 0 0 -25px 15px;
    font-size: 12px;
    font-weight: 400;
    line-height: 140%;
    position: relative;
    z-index: 1;

    .error {
      color: #e94141;
    }

    .valid {
      color: #58cb8d;
    }
  }
}
.inkline.-light {
  input:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 1000px $white inset !important;
  }
}

.inkline.-dark {
  input {
    color: $white !important;
    background: #ffffff30 !important;
  }
  input:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 1000px transparentize($color: #252e78, $amount: 0.1) inset !important;
    -webkit-text-fill-color: $white !important;
  }
}
</style>
