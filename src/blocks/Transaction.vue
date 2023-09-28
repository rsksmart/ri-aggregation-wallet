<template>
  <div class="transactionBlock">
    <block-modals-allowance />
    <block-modals-content-hash />
    <block-modals-fee-req-error />
    <block-modals-transfer-warning />
    <block-modals-destination-is-erc-20-warning :address="inputtedAddress" />
    <block-modals-withdraw-warning />
    <block-modals-fee-changed />

    <!-- Choose token -->
    <i-modal v-model="chooseTokenModalOpened" :value="chooseTokenModalOpened" size="md">
      <choose-token
        v-if="mainToken || chooseTokenModal === 'feeToken'"
        :fee-acceptable="chooseTokenModal === 'feeToken'"
        :only-mint-tokens="type === 'Mint'"
        :tokens-type="mainToken && chooseTokenModal !== 'feeToken' ? mainToken : 'L2-Tokens'"
        @chosen="chooseToken($event)"
      />
    </i-modal>

    <!-- Main Block -->
    <div v-if="activeTransaction && activeTransaction.step !== 'initial'">
      <block-loading-block v-if="activeTransaction.step !== 'finished'" />
      <block-success-block v-else />
    </div>
    <div v-else class="transactionTile tileBlock">
      <div class="tileHeadline withBtn h3">
        <nuxt-link :to="routeBack" class="_icon-wrapped -rounded -sm returnBtn _display-flex _align-items-initial">
          <v-icon name="ri-arrow-left-line" scale="1" />
        </nuxt-link>
        <template v-if="type === 'Transfer' || type === 'Deposit' || type === 'Withdraw'">
          <div class="transfer">
            <div class="back">Back</div>
            <div v-if="type === 'Transfer'" class="title">Send</div>
            <div v-else-if="type === 'Deposit'" class="title">Deposit</div>
            <div v-else-if="type === 'Withdraw'" class="title">Withdraw</div>
          </div>
        </template>
      </div>

      <template v-if="displayAddressInput">
        <template v-if="type === 'Transfer' || type === 'Deposit' || type === 'Withdraw'">
          <address-input-new
            ref="addressInput"
            v-model="inputtedAddress"
            :token="chosenToken ? chosenToken : undefined"
            @enter="commitTransaction()"
            @input="clearError"
          />
        </template>
      </template>

      <template v-if="displayAmountInput">
        <template v-if="type === 'Transfer' || type === 'Deposit' || type === 'Withdraw'">
          <amount-input-new
            ref="amountInput"
            v-model="inputtedAmount"
            :max-amount="type !== 'Mint' ? maxAmount.toString() : undefined"
            :token="chosenToken ? chosenToken : undefined"
            :type="type"
            :type-name="transactionActionName"
            autofocus
            @chooseToken="chooseTokenModal = 'mainToken'"
            @enter="commitTransaction()"
          />
        </template>
      </template>

      <div v-if="type === 'Transfer' || type === 'Withdraw'">
        <fee-input :type="type" @chooseFeeToken="showChangeFeeTokenModal" />
      </div>
      <!-- <div v-if="type === 'Withdraw'">

      </div> -->
      <template v-if="displayContentHashInput">
        <div class="_padding-top-1 inputLabel _display-flex _align-items-center">
          <div>Content Address</div>
          <div class="icon-container _display-flex" @click="$accessor.openModal('ContentHash')">
            <v-icon class="iconInfo" name="ri-question-mark" scale="0.9" />
          </div>
        </div>
        <hash-input
          ref="hashInput"
          v-model="contentHash"
          autofocus
          class="_margin-bottom-2"
          @enter="commitTransaction()"
        />
      </template>
      <template v-if="displayNFTTokenSelect">
        <div class="_padding-top-1 inputLabel">Token</div>
        <i-input :value="chosenToken ? `NFT-${chosenToken}` : ''" disabled size="lg" type="text">
          <template #append>
            <i-button block link variant="secondary" @click="chooseTokenModal = 'mainToken'"
              >Select{{ chosenToken ? " another " : " " }}NFT
            </i-button>
          </template>
        </i-input>
      </template>

      <div v-if="type === 'CPK' && cpkStatus === true" class="_text-center _margin-top-1">
        Your account is already activated
      </div>

      <div v-if="error" class="errorText _text-center _margin-top-1" data-cy="transaction_error_text">{{ error }}</div>
      <div v-if="nftTokenIsntVerified" class="errorText _text-center _margin-top-1">
        Mint transaction for <span class="tokenSymbol">NFT-{{ chosenToken }}</span> isn't verified yet. <br />Try again
        once <span class="tokenSymbol">NFT-{{ chosenToken }}</span> gets verified.
      </div>

      <!-- Commit button -->
      <i-button
        block
        class="flex-row _margin-top-1 _display-flex"
        data-cy="commit_transaction_button"
        size="lg"
        variant="secondary"
        @click="commitTransaction()"
      >
        <div class="_display-flex _justify-content-center _align-items-center">
          <v-icon v-if="!hasSigner && requireSigner" name="md-vpnkey-round" />&nbsp;&nbsp;
          <div>{{ hasSigner || !requireSigner ? "" : "Authorize to " }}{{ transactionActionName }}</div>
          <loader v-if="buttonLoader" class="_margin-left-1" size="xs" />
        </div>
      </i-button>

      <div v-if="amountOrAddressEmpty" class="errorText _text-center _margin-top-1">
        Address or amount not specified
      </div>

      <div v-if="addressIsMyOwn" class="errorText _text-center _margin-top-1">
        Address must be different from your own
      </div>

      <!-- Requesting signer -->
      <div v-if="requestingSigner" class="_text-center _margin-top-1" data-cy="requesting_signer_text">
        Follow the instructions in your Rootstock wallet
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { RawLocation } from "vue-router/types";
import { BigNumber } from "@ethersproject/bignumber";
import { Address, TokenLike, Tokens, TokenSymbol } from "@rsksmart/rif-rollup-js-sdk/build/types";
import {
  ZkActiveTransaction,
  ZkCPKStatus,
  ZkFee,
  ZkFeeType,
  ZkTransactionMainToken,
  ZkTransactionType,
} from "@rsksmart/rif-rollup-nuxt-core/types";
import { getAddress } from "@ethersproject/address";
import { RestProvider } from "@rsksmart/rif-rollup-js-sdk";
import { warningCanceledKey } from "@/blocks/modals/TransferWarning.vue";
import { DO_NOT_SHOW_WITHDRAW_WARNING_KEY } from "@/blocks/modals/WithdrawWarning.vue";
import AddressInputNew from "@/components/AddressInputNew.vue";
import FeeInput from "@/components/FeeInputNew.vue";

const feeNameDict = new Map([
  ["txFee", "Fee"],
  ["accountActivation", "Account Activation single-time fee"],
]);

export default Vue.extend({
  components: { FeeInput, AddressInputNew },
  data() {
    return {
      inputtedAmount: this.$store.getters["zk-transaction/amount"],
      inputtedAddress: this.$store.getters["zk-transaction/address"],
      chooseTokenModal: false as false | "mainToken" | "feeToken",
      contentHash: this.$store.getters["zk-transaction/contentHash"],
      loading: true,
      requestingSigner: false,
      amountOrAddressEmpty: false,
      addressIsMyOwn: false,
    };
  },
  computed: {
    isMainnet(): boolean {
      return this.$store.getters["zk-provider/network"] === "mainnet";
    },
    isSubmitDisabled(): boolean {
      return (!this.commitAllowed && (this.hasSigner || !this.requireSigner)) || this.requestingSigner || this.loading;
    },
    buttonLoader(): boolean {
      return (
        this.allowanceLoading || (!this.nftExists && this.nftExistsLoading) || this.loading || this.requestingSigner
      );
    },
    nftTokenIsntVerified(): boolean {
      return Boolean(this.chosenToken && this.mainToken === "L2-NFT" && !this.nftExists && !this.nftExistsLoading);
    },
    routeBack(): RawLocation {
      if (
        this.fromRoute &&
        this.fromRoute.fullPath !== this.$route.fullPath &&
        this.fromRoute.path !== "/transaction/withdraw"
      ) {
        return { path: this.fromRoute.path, query: this.fromRoute.query, params: this.fromRoute.params };
      }

      return "/account";
    },
    type(): ZkTransactionType {
      return this.$store.getters["zk-transaction/type"];
    },
    transactionActionName(): string | undefined {
      return this.$store.getters["zk-transaction/transactionActionName"];
    },
    mainToken(): ZkTransactionMainToken {
      return this.$store.getters["zk-transaction/mainToken"];
    },
    chosenToken(): TokenLike | undefined {
      return this.$store.getters["zk-transaction/symbol"];
    },
    feeSymbol(): TokenSymbol | undefined {
      return this.$store.getters["zk-transaction/feeSymbol"];
    },
    enoughBalanceToPayFee(): boolean {
      return this.$store.getters["zk-transaction/enoughBalanceToPayFee"];
    },
    displayAddressInput(): boolean {
      return this.type !== "CPK";
    },
    displayAmountInput(): boolean {
      switch (this.type) {
        case "Deposit":
        case "Mint":
        case "Transfer":
        case "Withdraw":
          return true;

        default:
          return false;
      }
    },
    displayContentHashInput(): boolean {
      return this.type === "MintNFT";
    },
    displayNFTTokenSelect(): boolean {
      switch (this.type) {
        case "TransferNFT":
        case "WithdrawNFT":
          return true;

        default:
          return false;
      }
    },
    nftExists(): boolean {
      return this.$store.getters["zk-transaction/nftExists"];
    },
    nftExistsLoading(): boolean {
      return this.$store.getters["zk-transaction/nftExistsLoading"];
    },
    commitAllowed(): boolean {
      return this.$store.getters["zk-transaction/commitAllowed"];
    },
    error(): Error {
      return this.$store.getters["zk-transaction/error"];
    },
    feeError(): Error {
      return this.$store.getters["zk-transaction/feeError"];
    },
    amountBigNumber(): BigNumber | undefined {
      return this.$store.getters["zk-transaction/amountBigNumber"];
    },
    zeroAllowance(): boolean {
      if (!this.chosenToken) {
        return false;
      }
      this.$store.getters["zk-balances/tokensAllowanceForceUpdate"];
      const tokenAllowance: BigNumber | undefined = this.$store.getters["zk-balances/tokenAllowance"](this.chosenToken);
      if (!tokenAllowance) {
        return false;
      }
      return tokenAllowance.eq("0");
    },
    maxAmount(): BigNumber {
      return this.$store.getters["zk-transaction/maxAmount"];
    },
    allowance(): BigNumber | undefined {
      this.$store.getters["zk-balances/tokensAllowanceForceUpdate"];
      return this.$store.getters["zk-balances/tokenAllowance"](this.chosenToken);
    },
    enoughAllowance(): boolean {
      return this.$store.getters["zk-transaction/enoughAllowance"];
    },
    allowanceLoading(): boolean {
      this.$store.getters["zk-balances/tokensAllowanceForceUpdate"];
      if (this.type === "Deposit" && this.chosenToken !== undefined) {
        return !!this.$store.getters["zk-balances/tokensAllowanceLoading"][this.chosenToken];
      }
      return false;
    },
    displayTokenUnlock(): boolean {
      return (
        this.type === "Deposit" &&
        this.chosenToken !== undefined &&
        (!this.enoughAllowance || this.zeroAllowance) &&
        (!this.allowanceLoading || this.zeroAllowance)
      );
    },
    displayOwnAddress(): boolean {
      return ["Deposit", "Withdraw", "Mint", "WithdrawNFT", "MintNFT"].includes(this.type);
    },
    activeTransaction(): ZkActiveTransaction {
      return this.$store.getters["zk-transaction/activeTransaction"];
    },
    fees(): ZkFee[] {
      return this.$store.getters["zk-transaction/fees"];
    },
    requiredFees(): ZkFeeType[] {
      return this.$store.getters["zk-transaction/requiredFees"];
    },
    hasSigner(): boolean {
      return this.$store.getters["zk-wallet/hasSigner"];
    },
    requireSigner(): boolean {
      return this.mainToken === "L2-Tokens" || this.mainToken === "L2-NFT" || this.type === "MintNFT";
    },
    feeLoading(): boolean {
      return this.$store.getters["zk-transaction/feeLoading"];
    },
    activationFeeLoading(): boolean {
      return this.$store.getters["zk-transaction/activationFeeLoading"];
    },
    isDeposit(): boolean {
      return this.type === "Deposit";
    },
    chooseTokenModalOpened: {
      get(): boolean {
        return this.chooseTokenModal !== false;
      },
      set(value) {
        if (!value) {
          this.chooseTokenModal = false;
        }
      },
    },
    cpkStatus(): ZkCPKStatus {
      return this.$store.getters["zk-wallet/cpk"];
    },
    inputtedAddressWithDomain(): string {
      const domainAddress = this.$store.getters["rns/getDomain"](this.inputtedAddress, this.chosenToken);
      return domainAddress || this.inputtedAddress;
    },
  },
  watch: {
    inputtedAmount: {
      immediate: true,
      handler(val, oldVal) {
        if (oldVal === undefined) {
          this.$nextTick(() => {
            this.$store.commit("zk-transaction/setAmount", val);
          });
        } else {
          this.$store.commit("zk-transaction/setAmount", val);
        }
      },
    },
    inputtedAddressWithDomain(val) {
      const domainAddress = this.$store.getters["rns/getDomain"](val, this.chosenToken);
      this.$store.dispatch("zk-transaction/setAddress", domainAddress || val);
    },
    contentHash(val) {
      this.$store.commit("zk-transaction/setContentHash", val);
    },
  },
  async mounted() {
    if (!this.$store.getters["zk-account/loggedIn"]) {
      return;
    }
    if (!this.$store.getters["zk-account/accountStateRequested"]) {
      await this.$store.dispatch("zk-account/updateAccountState");
    }
    this.checkCPK();
    if (this.$route.query.token) {
      if (this.mainToken === "L2-NFT") {
        this.chooseToken(parseInt(this.$route.query.token.toString()));
      } else {
        this.chooseToken(this.$route.query.token.toString());
      }
    }
    if (this.$route.query.address) {
      this.inputtedAddress = this.$route.query.address;
    }
    this.loading = false;
  },
  beforeDestroy() {
    this.$store.commit("zk-transaction/setAmount", undefined);
    this.$store.commit("zk-transaction/setContentHash", undefined);
  },
  methods: {
    clearError() {
      this.addressIsMyOwn = false;
      this.amountOrAddressEmpty = false;
    },
    chooseToken(token: TokenLike) {
      if (!this.chooseTokenModal || this.chooseTokenModal === "mainToken") {
        this.$store.dispatch("zk-transaction/setSymbol", token);
      } else if (this.chooseTokenModal === "feeToken") {
        this.$store.dispatch("zk-transaction/setFeeSymbol", token);
        this.$analytics.track("change_fee_token");
      }
      this.chooseTokenModal = false;
    },
    async checkWithdraw(): Promise<boolean> {
      const doNotShowWarning = localStorage.getItem(DO_NOT_SHOW_WITHDRAW_WARNING_KEY);

      if (doNotShowWarning) {
        return true;
      }

      const result = await this.$accessor.openDialog("WithdrawWarning");
      return !!result;
    },
    async checkTransfer(): Promise<boolean> {
      const transferWithdrawWarning = localStorage.getItem(warningCanceledKey);

      if (
        transferWithdrawWarning ||
        getAddress(this.inputtedAddressWithDomain) === this.$store.getters["zk-account/address"]
      ) {
        return true;
      }

      const accountUnlocked = await this.checkInputtedAccountUnlocked();
      if (accountUnlocked) {
        return true;
      }

      const result = await this.$accessor.openDialog("TransferWarning");
      return !!result;
    },
    async checkIfDestinationIsERC20Address(): Promise<boolean> {
      const tokens: Tokens = this.$store.getters["zk-tokens/zkTokens"];
      if (!this.inputtedAddress || !tokens) {
        return true;
      }
      const tokensAddresses = Object.entries(tokens).map(([_, token]) => token.address.toLowerCase());
      if (tokensAddresses.includes(this.inputtedAddress?.toLowerCase())) {
        const result = await this.$accessor.openDialog("DestinationIsERC20Warning");
        return !!result;
      }
      return true;
    },
    async commitTransaction() {
      if (!this.inputtedAddress || !this.inputtedAmount) {
        this.amountOrAddressEmpty = true;
        return;
      }
      if (this.inputtedAddress === this.$store.getters["zk-account/address"] && this.type === "Transfer") {
        this.addressIsMyOwn = true;
        return;
      }
      this.addressIsMyOwn = false;
      this.amountOrAddressEmpty = false;

      if (!this.hasSigner && this.requireSigner) {
        try {
          this.requestingSigner = true;
          await this.$store.dispatch("zk-wallet/requestSigner");
          this.checkCPK();
          this.$analytics.track("request_signer");
        } catch (err) {
          this.$analytics.track("request_signer_fail");
          this.$sentry.captureException(err, { tags: { "operation.type": "requestSigner" } });
        }
        this.requestingSigner = false;
      } else {
        if (this.type !== "Deposit" && (!this.commitAllowed || this.loading)) {
          return;
        }

        /* Transfer != Withdraw warning */
        try {
          this.loading = true;

          if (this.type === "Withdraw") {
            if (!(await this.checkWithdraw())) {
              return;
            }
          }
          if (this.type === "Transfer" || this.type === "TransferNFT") {
            if (!(await this.checkTransfer())) {
              return;
            }
          }

          if (!(await this.checkIfDestinationIsERC20Address())) {
            return;
          }

          // Only for Deposit
          if (this.displayTokenUnlock) {
            this.unlockToken();
          }

          /*
           * Step below becomes redundant as the withdrawals page reacts as appropriate
           * depending on the flag set for the IS_TWO_STEP_WITHDRAW_ENABLED env variable
           */
          // // Two step withdraw verification
          // const isTwoStepWithdrawEnabled = process.env.IS_TWO_STEP_WITHDRAW_ENABLED?.toUpperCase() === "TRUE";
          // if (this.type === "Withdraw" && isTwoStepWithdrawEnabled) {
          //   alert("correct behaviour not yet implemented as two step withdrawal is enabled"); //TODO: Implement correct behaviour
          // }

          const result = await this.$store.dispatch("zk-transaction/commitTransaction", { requestFees: true });

          this.trackTransaction(!result);
        } catch (error) {
          this.$sentry.captureException(error, { tags: { "operation.type": this.type } });
          this.$store.commit("zk-transaction/setError", error);
          this.trackTransaction(true);
        } finally {
          this.loading = false;
          if (this.$store.getters["zk-transaction/error"]) {
            this.checkCPK();
          }
        }
      }
    },
    trackTransaction(failed = false): void {
      const status = failed ? "_fail" : "";
      switch (this.type) {
        case "Deposit":
          this.$analytics.track("deposit" + status, {
            amount: this.inputtedAmount,
            opToken: this.chosenToken,
          });
          break;
        case "Mint":
          this.$analytics.track("mint" + status, {
            amount: this.inputtedAmount,
            opToken: this.chosenToken,
          });
          break;
        case "MintNFT":
          this.$analytics.track("mint_nft" + status, {
            feeToken: this.feeSymbol,
          });
          break;
        case "TransferNFT":
          this.$analytics.track("transfer_nft" + status, {
            feeToken: this.feeSymbol,
          });
          break;
        case "WithdrawNFT":
          this.$analytics.track("withdraw_nft" + status, {
            feeToken: this.feeSymbol,
          });
          break;
        case "Transfer":
          this.$analytics.track("transfer" + status, {
            amount: this.inputtedAmount,
            opToken: this.chosenToken,
            feeToken: this.feeSymbol,
          });
          break;
        case "Withdraw":
          this.$analytics.track(
            (getAddress(this.inputtedAddressWithDomain) === this.$store.getters["zk-account/address"]
              ? "l1_withdraw"
              : "l1_transfer") + status,
            {
              amount: this.inputtedAmount,
              opToken: this.chosenToken,
              feeToken: this.feeSymbol,
            }
          );
          break;
        default:
          this.$analytics.track(this.type + status);
          break;
      }
    },
    async checkInputtedAccountUnlocked(): Promise<boolean> {
      const syncProvider: RestProvider = await this.$store.dispatch("zk-provider/requestProvider");
      const state = await syncProvider.getState(this.inputtedAddressWithDomain);
      return state.id != null;
    },
    async unlockToken(unlimited = false) {
      await this.$store.dispatch("zk-transaction/setAllowance", unlimited);
    },
    chooseAddress(address: Address) {
      this.inputtedAddress = address;
    },
    setAllowanceMax() {
      this.inputtedAmount = this.$options.filters!.parseBigNumberish(this.allowance, this.chosenToken);
    },
    getFeeName(key: string): string | undefined {
      return feeNameDict!.has(key) ? feeNameDict.get(key) : "";
    },
    async requestFees() {
      await this.$store.dispatch("zk-transaction/requestAllFees", true);
    },
    checkCPK() {
      if (this.mainToken !== "L1-Tokens" && this.$store.getters["zk-wallet/cpk"] !== true && this.type !== "CPK") {
        if (this.$store.getters["zk-wallet/cpk"] === false) {
          this.$accessor.openModal("SignPubkey");
        }
        if (!this.$store.getters["zk-transaction/accountActivationFee"]) {
          this.$store.dispatch("zk-transaction/requestAccountActivationFee");
        }
      }
    },
    showChangeFeeTokenModal() {
      this.chooseTokenModal = "feeToken";
      this.$analytics.track("visit_change_fee_token");
    },
  },
});
</script>

<style lang="scss">
.dappPageWrapper {
  .estimatedFee {
    margin: 3px 0;
  }

  .orDivider {
    width: 100%;
    height: max-content;
    display: grid;
    grid-template-columns: 1fr max-content 1fr;
    grid-template-rows: 100%;
    grid-gap: 17px;
    align-items: center;
    padding: 23px 0;

    .line {
      width: 100%;
      height: 1px;
      background-color: #eeeeee;
      transition: background-color $transition1;
      will-change: background-color;
    }

    .orText {
      font-size: 18px;
      font-weight: 700;
      color: #eeeeee;
      text-align: center;
      transition: color $transition1;
      will-change: color;
    }
  }
}

.inkline.-dark {
  .dappPageWrapper {
    .tileSmallHeadline {
      color: $white;
    }

    .orDivider {
      .line {
        background-color: transparentize($color: $gray, $amount: 0.5);
      }

      .orText {
        color: transparentize($color: $gray, $amount: 0.3);
      }
    }

    .transfer {
      color: #fff !important;
    }
  }
}

h4.tileSmallHeadline {
  font-weight: 700;
  font-size: 16px;
  line-height: 22px;
  margin: 0 0 1rem;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;

  & > * {
    display: flex;
    flex-flow: nowrap row;
    justify-content: space-between;
    align-items: flex-start;
  }
}
.transfer {
  grid-template-rows: 50% 50%;
  color: #000;
  font-style: normal;
  text-align: left;
  .back {
    font-size: 16px;
    font-weight: 400;
    line-height: 100%;
    margin-top: 7px;
  }
  .title {
    font-size: 42px;
    font-weight: 600;
    line-height: 140%;
    margin: 10px 0 0 -40px;
  }
}
</style>
