<template>
  <div class="footerModalContainer">
    <i-modal v-model="modal" size="md">
      <template #header>
        <b>Information</b>
      </template>
      <template #default>
        <!--        TODO: Replace Docs url when publish by DevEx -->
        <!--        <a class="modalFooterBtn big" href="https://docs.zksync.io/userdocs/intro.html" target="_blank">-->
        <!--          <v-icon name="ri-book-2-line" />-->
        <!--          <span>Docs</span>-->
        <!--        </a>-->
        <a class="modalFooterBtn big" href="https://rootstock.io/contact/" target="_blank">
          <v-icon name="ri-contacts-book-line" />
          <span>Contact</span>
        </a>
        <a class="modalFooterBtn big" :href="blockExplorerLink" target="_blank">
          <v-icon name="ri-external-link-line" />
          <span>RIF Rollup Explorer</span>
        </a>
      </template>
      <template #footer>
        <div class="_display-flex _justify-content-space-between">
          <block-modals-network-switch />
          <div class="_display-flex">
            <i-button size="md" circle class="_margin-right-1 _margin-0" block @click="openNetworkSwitchModal">
              <v-icon name="co-ethereum" scale="1" />
            </i-button>
            <i-button block size="md" circle class="_margin-0" @click="toggleDarkMode">
              <v-icon v-if="isDarkTheme" name="ri-sun-fill" />
              <v-icon v-else name="ri-moon-fill" />
            </i-button>
          </div>
        </div>
      </template>
    </i-modal>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import theme from "@rsksmart/rif-rollup-nuxt-core/utils/theme";

export default Vue.extend({
  props: {
    value: {
      type: Boolean,
      default: false,
      required: false,
    },
  },
  data() {
    return {
      theme: theme.getUserTheme(),
    };
  },
  computed: {
    modal: {
      get(): boolean {
        return this.value;
      },
      set(val: boolean): void {
        this.$emit("input", val);
      },
    },
    blockExplorerLink(): string {
      return this.$store.getters["zk-onboard/config"].zkSyncNetwork.rollupExplorer;
    },
    isDarkTheme(): boolean {
      return this.theme === "dark";
    },
  },
  methods: {
    toggleDarkMode() {
      this.theme = theme.toggleTheme();
      this.$inkline.config.variant = this.theme;
    },
    openNetworkSwitchModal() {
      this.$analytics.track("visit_change_network");
      return this.$accessor.openModal("NetworkSwitch");
    },
  },
});
</script>
