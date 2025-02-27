<template>
  <i-layout class="defaultLayout">
    <block-logging-in-loader />
    <block-modals-wrong-network />
    <block-modals-requesting-provider-error />
    <block-modals-onboard-error />
    <transition name="fade">
      <div v-if="!loggingIn && loggedIn">
        <block-header ref="header" />
        <i-layout-content class="layoutContent">
          <block-modals-sign-pubkey />
          <div class="routerContainer">
            <transition name="fade" mode="out-in">
              <nuxt />
            </transition>
          </div>
        </i-layout-content>
        <block-footer class="desktopOnly" />
      </div>
    </transition>
  </i-layout>
</template>

<script lang="ts">
import Vue from "vue";
import theme from "@rsksmart/rif-rollup-nuxt-core/utils/theme";
import SentryMixin from "@/mixins/sentry.mixin";
import AnalyticsMixin from "@/mixins/analytics.mixin";

export default Vue.extend({
  mixins: [SentryMixin, AnalyticsMixin],
  computed: {
    loggingIn(): boolean {
      return (
        this.$store.getters["zk-onboard/onboardStatus"] === "connecting" ||
        this.$store.getters["zk-onboard/restoringSession"]
      );
    },
    loggedIn(): boolean {
      return this.$store.getters["zk-onboard/onboardStatus"] === "authorized";
    },
  },
  watch: {
    "$inkline.config.variant": {
      immediate: true,
      handler() {
        this.$store.commit("zk-onboard/setOnboardTheme", "light");
      },
    },
  },
  mounted() {
    this.$inkline.config.variant = theme.getUserTheme();
    this.$store.dispatch("zk-provider/requestProvider");
  },
});
</script>
