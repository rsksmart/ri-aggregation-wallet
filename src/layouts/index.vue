<template>
  <main class="indexLayout">
    <!-- <block-logging-in-loader /> -->
    <block-header />
    <section class="routerContainer">
      <!-- <transition name="fade" mode="out-in">
        <nuxt />
      </transition> -->
    </section>
    <!-- <block-footer /> -->
  </main>
</template>

<script lang="ts">
import { GIT_REVISION_SHORT } from "@/plugins/build";
import Vue from "vue";

export default Vue.extend({
  data() {
    return {
      version: GIT_REVISION_SHORT,
    };
  },
  mounted() {
    // utils.defineTheme(this.$inkline, false);
  },
});
</script>
