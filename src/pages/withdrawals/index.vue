<template>
  <div>
    <template
      v-if="activeTransaction && activeTransaction.step !== 'initial' && activeTransaction.type === 'WithdrawPending'"
    >
      <div class="withdrawsPage">
        <div class="centerBlock">
          <div class="withdrawBlock">
            <block-loading-block v-if="activeTransaction.step !== 'finished'" />
            <block-success-block v-else />
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="withdrawsPage">
        <div class="centerBlock">
          <div class="withdrawBlock">
            <span class="title">Withdrawals</span>
            <template v-if="tokens">
              <div style="margin-top: 35px">
                <div v-for="(token, idx) in tokens" :key="idx">
                  <withdraw-item :token-symbol="token" />
                </div>
              </div>
            </template>
            <template v-else>
              <div style="display: flex; justify-content: center; align-content: center; text-align: center">
                <p>No Withdrawals yet</p>
              </div>
            </template>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { ZkActiveTransaction } from "@rsksmart/rif-rollup-nuxt-core/types";
import WithdrawItem from "@/pages/withdrawals/withdrawItem.vue";

export default Vue.extend({
  components: { WithdrawItem },
  computed: {
    tokens(): string[] {
      const tokens = this.$store.getters["zk-tokens/zkTokens"];
      if (tokens) {
        return Object.keys(tokens);
      }
      return [];
    },
    activeTransaction(): ZkActiveTransaction {
      return this.$store.getters["zk-transaction/activeTransaction"];
    },
  },
  async mounted() {
    await this.getTokens();
  },
  methods: {
    async getTokens() {
      await this.$store.dispatch("zk-tokens/loadZkTokens");
    },
  },
});
</script>
