<template>
  <div class="accountModalContainer">
    <i-modal v-model="renameWalletModal" class="prevent-close" size="md">
      <template #header>Rename wallet</template>
      <div>
        <i-input
          id="txt-rename-wallet"
          ref="nameInput"
          v-model="walletName"
          size="lg"
          placeholder="Name"
          type="name"
          maxlength="18"
          @keyup.enter="renameWallet()"
        />
        <i-button
          id="btn-confirm-rename-wallet"
          block
          size="lg"
          variant="secondary"
          class="_margin-top-1"
          :disabled="!isNameValid"
          @click="renameWallet()"
          >Save
        </i-button>
      </div>
    </i-modal>

    <i-modal v-model="accountModal" class="receive" size="md">
      <template #header>
        <div class="title">Receive</div>
      </template>
      <div class="receiveDisclaimer">
        <span>Make sure to only share this address with wallets that have their layer 2 account activated.</span>
      </div>
      <div class="addressInput">
        <div class="addressValidation">Your address</div>
        <input
          id="addressInput"
          ref="addressInput"
          v-model="accountAddress"
          placeholder="Your address"
          type="text"
          autocomplete="none"
          data-cy="address_block_wallet_address_input"
          spellcheck="false"
          maxlength="100"
          @keyup.enter="$emit('enter')"
          @change="$emit('change', $event)"
        />
      </div>
      <div class="_justify-content-center">
        <vue-qrcode v-if="accountAddress" class="addressQR" :value="accountAddress" :margin="1" :scale="6" />
      </div>
    </i-modal>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import VueQrcode from "vue-qrcode";

export default Vue.extend({
  components: { VueQrcode },
  data() {
    return {
      renameWalletModal: false,
      walletName: this.$store.getters["zk-account/name"],
    };
  },
  computed: {
    accountName(): string {
      return this.$store.getters["zk-account/name"] as string;
    },
    accountAddress(): string {
      return this.$store.getters["zk-account/address"];
    },
    accountZkScanUrl(): string {
      return (this.$store.getters["zk-onboard/config"].zkSyncNetwork.rollupExplorer +
        "explorer/accounts/" +
        this.accountAddress) as string;
    },
    accountModal: {
      get(): boolean {
        return this.$accessor.getAccountModalState;
      },
      set(val: boolean): boolean {
        this.$accessor.setAccountModalState(val);
        return val;
      },
    },
    isNameValid(): boolean {
      return this.walletName?.length > 0;
    },
  },
  watch: {
    renameWalletModal: {
      immediate: true,
      handler(val: boolean): void {
        if (!process.client) {
          return;
        }
        if (val) {
          this.$nextTick(() => {
            if (this.$refs.nameInput) {
              (this.$refs.nameInput as Vue)?.$el?.querySelector("input")?.focus();
            }
          });
        } else {
          this.walletName = this.accountName;
        }
      },
    },
  },
  methods: {
    logout(): void {
      this.$analytics.track("disconnect");

      this.accountModal = false;
      this.$nextTick(async () => {
        await this.$store.dispatch("zk-account/logout");
        await this.$router.push("/");
      });
    },
    renameWalletOpen(): void {
      this.$analytics.track("visit_rename_wallet");

      this.accountModal = false;
      this.renameWalletModal = true;
    },
    renameWallet(): void {
      if (!this.isNameValid) {
        return;
      }
      this.$analytics.track("rename_wallet");
      this.$store.dispatch("zk-account/saveAccountName", this.walletName);
      this.renameWalletModal = false;
      this.walletName = this.accountName;
    },
    togglePopup(): void {
      this.$accessor.setAccountModalState(true);
    },
  },
});
</script>
