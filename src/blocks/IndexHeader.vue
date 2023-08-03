<template>
  <i-layout-header class="indexHeader" :class="{ opened: opened }">
    <div class="mobileIndexHeader">
      <i-container class="mobileOnly">
        <i-row class="_display-flex _justify-content-between _flex-nowrap">
          <i-column>
            <transition name="fade">
              <block-logo />
            </transition>
          </i-column>
          <i-column />
        </i-row>
      </i-container>
    </div>
    <div class="mainIndexHeader">
      <i-container>
        <i-row>
          <i-column :xs="12" :md="4" class="_padding-left-0 desktopOnly">
            <block-logo />
          </i-column>
          <i-column :xs="12" :md="4" class="_margin-left-auto _padding-right-0 _justify-content-end desktopOnly">
            <block-social-block />
          </i-column>
        </i-row>
      </i-container>
    </div>
  </i-layout-header>
</template>

<script lang="ts">
import Vue from "vue";
import { ZkConfig } from "@rsksmart/rif-rollup-nuxt-core/types";

interface DropdownOption {
  name: string;
  link: string;
  isDividerAfter?: true;
}

export default Vue.extend({
  data() {
    return {
      firstHovered: false,
      opened: false,
      dropdownOpened: false,
    };
  },
  computed: {
    dropdownOptions(): DropdownOption[] {
      return [
        {
          name: "Explore zkSync",
          link: "https://ecosystem.zksync.io",
          isDividerAfter: true,
        },

        {
          name: "zkSync Era Portal",
          link: "https://portal.zksync.io",
        },
        {
          name: "zkSync Era Docs",
          link: "https://era.zksync.io/docs/",
        },
        {
          name: "Block Explorer",
          link: this.config.zkSyncNetwork.explorer,
        },
        {
          name: "zkCheckout",
          link: this.checkoutLink,
        },
      ];
    },
    config(): ZkConfig {
      return this.$store.getters["zk-onboard/config"];
    },
    checkoutLink(): string {
      const postfix =
        this.config.zkSyncNetwork.ethereumNetwork === "mainnet" ? "" : `-${this.config.zkSyncNetwork.ethereumNetwork}`;
      return `https://checkout${postfix}.zksync.io`;
    },
  },
});
</script>
