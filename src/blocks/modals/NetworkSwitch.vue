<template>
  <i-modal v-model="opened" size="md" class="networkSwitchModal" data-cy="network_switch_modal">
    <template #header>Network Configuration</template>
    <ul class="network-list">
      <li
        v-for="zkNetworkName in options"
        :key="zkNetworkName"
        :data-cy="`network_switch_${zkNetworkName}`"
        class="network-list-item"
        @click="changeNetworkConfig(zkNetworkName)"
      >
        <span>
          <v-icon v-if="zkNetworkName === network" class="selected" name="ri-check-line" />
        </span>
        <span>
          RIF Rollup <span class="networkName">{{ zkNetworkName }}</span>
        </span>
      </li>
    </ul>
  </i-modal>
</template>

<script lang="ts">
import Vue from "vue";
import { ZkNetwork } from "@rsksmart/rif-rollup-nuxt-core/types";
import { zkSyncNetworkConfig } from "@rsksmart/rif-rollup-nuxt-core/utils/config";

export default Vue.extend({
  name: "NetworkSwitch",
  computed: {
    options() {
      const allNetworks = Object.keys(zkSyncNetworkConfig);
      const supportedNetworks = allNetworks.filter((network) => network.toUpperCase() !== "MAINNET");

      return supportedNetworks;
    },
    network() {
      return this.$store.getters["zk-provider/network"];
    },
    opened: {
      set(val): void {
        if (val === false) {
          this.$accessor.closeActiveModal();
        }
      },
      get(): boolean {
        return this.$accessor.currentModal !== null && this.$accessor.currentModal === "NetworkSwitch";
      },
    },
  },
  methods: {
    changeNetworkConfig(networkName: ZkNetwork) {
      this.$analytics.track("change_network", { networkName });

      this.$store.dispatch("zk-provider/changeNetwork", networkName);
      this.$accessor.closeActiveModal();
    },
  },
});
</script>
