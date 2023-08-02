<template>
  <div class="totalUsdBalance">
    <h3 class="totalBalance">$ {{ totalUsdBalance }}</h3>
    <div @click="changeShowBalance">
      <div v-if="showBalance">
        <svg width="41" height="27" viewBox="0 0 41 27" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M40.1025 12.4177C36.2533 5.03906 28.7646 0 20.1562 0C11.5479 0 4.05924 5.03906 0.209961 12.4177C0.139974 12.6576 0 13.1376 0 13.4375C0 13.7374 0.139974 14.2174 0.209961 14.4573C4.05924 21.8359 11.5479 26.875 20.1562 26.875C28.7646 26.875 36.2533 21.8359 40.1025 14.4573C40.1725 14.2174 40.3125 13.7374 40.3125 13.4375C40.3125 13.1376 40.1725 12.6576 40.1025 12.4177ZM20.1562 23.9955C13.2275 23.9955 6.78874 19.9763 3.35938 13.4375C6.78874 6.89872 13.2275 2.87946 20.1562 2.87946C27.085 2.87946 33.5238 6.89872 36.9531 13.4375C33.5238 19.9763 27.085 23.9955 20.1562 23.9955ZM20.1562 5.75893C15.1872 5.75893 11.1979 9.17829 11.1979 13.4375C11.1979 17.6967 15.1872 21.1161 20.1562 21.1161C25.1253 21.1161 29.1146 17.6967 29.1146 13.4375C29.1146 9.17829 25.1253 5.75893 20.1562 5.75893ZM20.1562 18.2366C17.0768 18.2366 14.5573 16.077 14.5573 13.4375C14.5573 13.3775 14.5573 13.3775 14.5573 13.3175C14.9072 13.3775 15.3271 13.4375 15.6771 13.4375C18.1266 13.4375 20.1562 11.6978 20.1562 9.59821C20.1562 9.29827 20.0863 8.93834 20.0163 8.63839C20.0863 8.63839 20.0863 8.63839 20.1562 8.63839C23.2357 8.63839 25.7552 10.798 25.7552 13.4375C25.7552 16.077 23.2357 18.2366 20.1562 18.2366Z"
            :fill="iconColor"
          />
        </svg>
      </div>
      <div v-else>
        <svg width="41" height="27" viewBox="0 0 41 27" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clip-path="url(#clip0_461_163)">
            <path
              d="M40.1025 12.4177C36.2533 5.03906 28.7646 0 20.1562 0C11.5479 0 4.05924 5.03906 0.209961 12.4177C0.139974 12.6576 0 13.1376 0 13.4375C0 13.7374 0.139974 14.2174 0.209961 14.4573C4.05924 21.8359 11.5479 26.875 20.1562 26.875C28.7646 26.875 36.2533 21.8359 40.1025 14.4573C40.1725 14.2174 40.3125 13.7374 40.3125 13.4375C40.3125 13.1376 40.1725 12.6576 40.1025 12.4177ZM20.1562 23.9955C13.2275 23.9955 6.78874 19.9763 3.35938 13.4375C6.78874 6.89872 13.2275 2.87946 20.1562 2.87946C27.085 2.87946 33.5238 6.89872 36.9531 13.4375C33.5238 19.9763 27.085 23.9955 20.1562 23.9955ZM20.1562 5.75893C15.1872 5.75893 11.1979 9.17829 11.1979 13.4375C11.1979 17.6967 15.1872 21.1161 20.1562 21.1161C25.1253 21.1161 29.1146 17.6967 29.1146 13.4375C29.1146 9.17829 25.1253 5.75893 20.1562 5.75893ZM20.1562 18.2366C17.0768 18.2366 14.5573 16.077 14.5573 13.4375C14.5573 13.3775 14.5573 13.3775 14.5573 13.3175C14.9072 13.3775 15.3271 13.4375 15.6771 13.4375C18.1266 13.4375 20.1562 11.6978 20.1562 9.59821C20.1562 9.29827 20.0863 8.93834 20.0163 8.63839C20.0863 8.63839 20.0863 8.63839 20.1562 8.63839C23.2357 8.63839 25.7552 10.798 25.7552 13.4375C25.7552 16.077 23.2357 18.2366 20.1562 18.2366Z"
              :fill="iconColor"
            />
          </g>
          <line x1="1.74741" y1="24.8364" x2="39.7474" y2="2.83643" :stroke="iconColor" stroke-width="5" />
          <line x1="2.49896" y1="26.1346" x2="40.499" y2="4.13457" :stroke="iconShadowColor" stroke-width="2" />
          <defs>
            <clipPath id="clip0_461_163">
              <rect width="41" height="27" fill="white" />
            </clipPath>
          </defs>
        </svg>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { parseBigNumberish } from "@rsksmart/rif-rollup-nuxt-core/utils";
import { ZkTokenBalances, ZkTokenPrices } from "@rsksmart/rif-rollup-nuxt-core/types";
import { RestProvider } from "@rsksmart/rif-rollup-js-sdk";

export default Vue.extend({
  data() {
    return {
      showBalance: false,
    };
  },
  computed: {
    balances(): ZkTokenBalances {
      return this.$store.getters["zk-balances/balances"];
    },
    tokenPrices(): ZkTokenPrices {
      return this.$store.getters["zk-tokens/tokenPrices"];
    },
    provider(): RestProvider {
      return this.$store.getters["zk-provider/syncProvider"];
    },
    totalUsdBalance(): string {
      if (!this.showBalance) return "----";
      let total = 0;
      for (const symbol in this.balances) {
        const balanceInBigNumberish = parseBigNumberish(this.provider, symbol, this.balances[symbol].balance as string);
        const balance = balanceInBigNumberish === undefined ? 0 : balanceInBigNumberish;
        const price = this.tokenPrices[symbol] === undefined ? 0 : this.tokenPrices[symbol];
        total += +balance * price;
      }
      return total.toFixed(2);
    },
    iconColor(): string {
      return this.$inkline.config.variant === "dark" ? "#FFF" : "#000";
    },
    iconShadowColor(): string {
      return this.$inkline.config.variant === "dark" ? "#252e78" : "#f1f1f1";
    },
  },
  methods: {
    changeShowBalance(): void {
      this.showBalance = !this.showBalance;
    },
  },
});
</script>

<style lang="scss">
.totalUsdBalance {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin: 20px 0;
  .totalBalance {
    margin: 0 10px;
  }
  h3 {
    color: #000;
    font-size: 42px;
    font-weight: 600;
    line-height: 140%;
  }
}
</style>
