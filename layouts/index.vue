<template>
  <zk-layout-default class="indexLayout">
    <zk-block-header slot="header">
      <zk-block-zksync-logo slot="leftSide" />
      <div slot="centerSide" class="zkLinks justify-center gap-6">
        <nuxt-link class="link" to="/">FAQ</nuxt-link>
        <nuxt-link class="link" to="/">Docs</nuxt-link>
        <nuxt-link class="link" to="/">zkTools</nuxt-link>
        <nuxt-link class="link" to="/">We're hiring</nuxt-link>
      </div>
    </zk-block-header>
    <nuxt slot="route" />
    <footer slot="footer">footer</footer>
  </zk-layout-default>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  mounted() {
    console.log(this.$store);
  },
})
</script>
