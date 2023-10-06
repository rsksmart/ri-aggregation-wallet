<template>
  <div class="successBlock tileBlock">
    <checkmark />
    <div class="tileHeadline h3">
      <span>{{ activeTransaction.type === "WithdrawPending" ? "Successful withdraw" : activeTransaction.type }}</span>
    </div>
    <div class="additionalInfo _margin-top-2">
      <p class="_text-center">
        <span>&#9432; </span>
        <template v-if="activeTransaction.type === 'Withdraw' && isTwoStepWithdrawEnabled()">
          Your withdrawal process has been initiated. Once the Rollup Tx is committed, you will be able to proceed with
          the final step from the <nuxt-link style="color: aquamarine" to="/withdrawals">Withdrawals tab.</nuxt-link>
        </template>
        <template v-if="activeTransaction.type === 'Withdraw' && !isTwoStepWithdrawEnabled()">
          Your withdrawal process has been initiated. Once the Rollup Tx is committed, your funds should become
          available your L1 wallet
        </template>
        <template v-if="activeTransaction.type === 'WithdrawPending' && isTwoStepWithdrawEnabled()">
          Your withdrawal process has been completed. Your funds should be available your L1 wallet.
        </template>
        <template v-else-if="activeTransaction.type === 'Deposit'">
          Your deposit transaction has been mined and will be processed after required number of confirmations. Use the
          transaction link to track the progress.
        </template>
        <template v-else-if="activeTransaction.type === 'Allowance' && activeTransaction.data">
          Token <span class="tokenSymbol">{{ activeTransaction.data.token }}</span> was successfully approved
          <span v-if="activeTransaction.data.allowance.lt(unlimitedUnlockAmount)">
            for {{ activeTransaction.data.allowance.toString() | parseBigNumberish(activeTransaction.data.token) }}
            <span class="tokenSymbol">{{ activeTransaction.data.token }}</span>
          </span>
          <br />
          Now you can proceed to deposit.
        </template>
      </p>
    </div>

    <div class="pageDetails _margin-top-1">
      <div class="txLink _margin-top-1">
        <a
          v-if="isL1Transaction()"
          id="btn-link-to-transaction"
          :href="getL1ExplorerTransactionLink()"
          class="_display-block _text-center"
          target="_blank"
          >Rootstock transaction
          <v-icon name="ri-external-link-line"></v-icon>
        </a>
        <a
          v-if="isL2Transaction()"
          id="btn-link-to-transaction"
          :href="getL2ExplorerTransactionLink()"
          class="_display-block _text-center"
          target="_blank"
          >Rollup transaction
          <v-icon name="ri-external-link-line"></v-icon>
        </a>
      </div>

      <div v-if="activeTransaction.address" class="newInfoBlockItem smaller _margin-top-2">
        <div class="amount">
          <span>Sent to: </span>
          <span v-if="isOwnAddress" class="secondaryText">Own account</span>
          <span v-else-if="openedContact" class="secondaryText">{{ openedContact.name }}</span>
        </div>
        <wallet-address :wallet="activeTransaction.address" />
      </div>

      <div v-if="activeTransaction.amount" class="infoAmountBlockItem _margin-top-1">
        <div class="headline">Amount</div>
        <div class="amount">
          <span v-if="typeof activeTransaction.token === 'string'">
            <span class="tokenSymbol">{{ activeTransaction.token }}</span>
            {{ activeTransaction.amount | parseBigNumberish(activeTransaction.token) }}
            <span class="secondaryText">
              <token-price :symbol="activeTransaction.token" :amount="activeTransaction.amount" />
            </span>
          </span>
          <span v-else>NFT-{{ activeTransaction.token }}</span>
        </div>
      </div>
      <div v-if="activeTransaction.fee" class="infoFeeBlockItem smaller _margin-top-1">
        <div class="headline">Fee</div>
        <div class="amount">
          <span class="tokenSymbol">{{ activeTransaction.feeToken }}</span>
          {{ activeTransaction.fee | parseBigNumberish(activeTransaction.feeToken) }}
          <span class="secondaryText">
            <token-price :symbol="activeTransaction.feeToken" :amount="activeTransaction.fee" />
          </span>
        </div>
      </div>
      <div v-if="activeTransaction.type === 'Allowance' && type === 'Deposit' && commitAllowed">
        <div class="border-line _margin-top-1"></div>
        <div class="infoBlockItem smaller _margin-top-1">
          <div class="headline">Amount to deposit:</div>
          <div class="amount">
            <span class="tokenSymbol">{{ chosenToken }}</span>
            {{ amountBigNumber.toString() | parseBigNumberish(chosenToken) }}
            <span class="secondaryText">
              <token-price :symbol="chosenToken" :amount="amountBigNumber.toString()" />
            </span>
          </div>
        </div>
        <div class="goBackContinueBtns _margin-top-1">
          <i-button
            data-cy="deposit_arrow_back_button"
            size="lg"
            variant="secondary"
            circle
            @click="clearActiveTransaction()"
          >
            <v-icon name="ri-arrow-left-line" />
          </i-button>
          <i-button
            data-cy="deposit_proceed_to_deposit_button"
            block
            size="lg"
            variant="secondary"
            @click="commitTransaction()"
            >Proceed to deposit
          </i-button>
        </div>
      </div>
      <i-button
        v-else-if="
          (activeTransaction.type === 'Allowance' && type === 'Deposit') || activeTransaction.type === 'WithdrawPending'
        "
        data-cy="success_unlock_ok_button"
        block
        size="sm"
        variant="secondary"
        class="_margin-top-2"
        @click="clearActiveTransaction()"
      >
        Ok
      </i-button>
      <i-button
        v-else
        data-cy="success_block_ok_button"
        block
        size="lg"
        variant="secondary"
        class="_margin-top-2"
        :to="continueBtnLink"
        >Ok
      </i-button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { BigNumber } from "@ethersproject/bignumber";
import { ZkActiveTransaction, ZkConfig, ZkContact, ZkTransactionType } from "@rsksmart/rif-rollup-nuxt-core/types";
import { TokenLike } from "@rsksmart/rif-rollup-js-sdk/build/types";
import { ERC20_APPROVE_TRESHOLD } from "@rsksmart/rif-rollup-js-sdk/build/utils";
import { getAddress } from "@ethersproject/address";

export default Vue.extend({
  name: "SuccessBlock",
  data() {
    return {
      displayAllowanceDeposit: false,
      l1TransactionHash: "", // Used only for withdraw transactions
    };
  },
  computed: {
    config(): ZkConfig {
      return this.$store.getters["zk-onboard/config"];
    },
    activeTransaction(): ZkActiveTransaction {
      return this.$store.getters["zk-transaction/activeTransaction"];
    },
    isOwnAddress(): boolean {
      return getAddress(this.$store.getters["zk-account/address"]) === getAddress(this.activeTransaction.address || "");
    },
    openedContact(): ZkContact {
      return this.$store.getters["zk-contacts/contactByAddress"](this.activeTransaction.address);
    },
    continueBtnLink(): string {
      switch (this.activeTransaction.type) {
        case "MintNFT":
        case "TransferNFT":
        case "WithdrawNFT":
          return "/account/nft";
        default:
          return "/account";
      }
    },
    amountBigNumber(): BigNumber | undefined {
      return this.$store.getters["zk-transaction/amountBigNumber"];
    },
    type(): ZkTransactionType {
      return this.$store.getters["zk-transaction/type"];
    },
    chosenToken(): TokenLike {
      return this.$store.getters["zk-transaction/symbol"];
    },
    commitAllowed(): boolean {
      return this.$store.getters["zk-transaction/commitAllowed"];
    },
    unlimitedUnlockAmount(): BigNumber {
      return ERC20_APPROVE_TRESHOLD;
    },
  },
  methods: {
    async commitTransaction() {
      if (!this.commitAllowed) {
        return;
      }
      await this.$store.dispatch("zk-transaction/commitTransaction", { requestFees: false });
    },
    clearActiveTransaction() {
      this.$store.commit("zk-transaction/clearActiveTransaction");
    },
    getL1ExplorerTransactionLink(): string {
      return this.config.ethereumNetwork.rskExplorer + "tx/" + this.activeTransaction.txHash;
    },
    getL2ExplorerTransactionLink(): string {
      return this.config.zkSyncNetwork.rollupExplorer + "transactions/" + this.activeTransaction.txHash;
    },
    isL1Transaction(): boolean {
      return ["Deposit", "Allowance", "Mint", "WithdrawPending"].includes(this.activeTransaction.type);
    },
    isL2Transaction(): boolean {
      return ["Deposit", "Transfer", "Withdraw"].includes(this.activeTransaction.type);
    },
    isTwoStepWithdrawEnabled(): boolean {
      return process.env.IS_TWO_STEP_WITHDRAW_ENABLED?.toUpperCase() === "TRUE";
    },
  },
});
</script>

<style>
.additionalInfo {
  background-color: #6170f2;
  padding: 10px;
  font-size: 12px;
  color: white;
  border-radius: 5px;
}
.pageDetails {
  background-color: #ffff;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  justify-content: start;
}
.txLink {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  font-size: 12px;
}

.newInfoBlockItem {
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: center;
  padding-left: 30px;
  padding-right: 30px;
}
.infoAmountBlockItem {
  display: flex;
  flex-direction: column;
  text-align: center;
}
.infoFeeBlockItem {
  display: flex;
  flex-direction: column;
  text-align: center;
}
</style>
