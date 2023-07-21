<template>
  <div class="indexPage">
    <div>
      <i-container>
        <h1>RIF Rollup</h1>
        <p>Connect your L1 Rootstock Wallet to start</p>
        <button
          id="btn-core-connect-wallet"
          data-cy="core_connect_wallet_button"
          class="_text-center"
          @click="customWallet()"
        >
          connect your wallet
        </button>
      </i-container>
      <block-modals-alternative-withdraw />
    </div>
    <div id="secondary-container">
      <!-- This element is for aesthetics, meant to render a background image -->
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  layout: "index",
  computed: {
    isMainnet(): boolean {
      return this.$store.getters["zk-provider/network"] === "mainnet";
    },
  },
  mounted() {
    this.$analytics.track("visit_login");
  },
  methods: {
    async customWallet() {
      const refreshWalletTry = await this.$store.dispatch("zk-onboard/loginWithOnboard");
      if (!refreshWalletTry) {
        return this.$store.dispatch("zk-account/logout");
      } else {
        this.$analytics.track("login", {
          connectionType: "Rootstock Wallet",
          wallet: this.$store.getters["zk-onboard/selectedWallet"],
        });
        return this.$router.push("/account");
      }
    },
    async walletConnect(argent: boolean = false) {
      const refreshWalletTry = await this.$store.dispatch(
        `zk-onboard/${argent ? "loginWithArgent" : "loginWithWalletConnect"}`
      );
      if (!refreshWalletTry) {
        return this.$store.dispatch("zk-account/logout");
      } else {
        this.$analytics.track("login", {
          connectionType: "WalletConnect",
          wallet: this.$store.getters["zk-onboard/selectedWallet"],
        });
        return this.$router.push("/account");
      }
    },
  },
});
</script>
<style lang="scss" scoped>
.indexPage {
  height: 100%;
  // padding-top: 93px;
  // padding-bottom: 56px;
  display: flex;
  justify-content: start;
  align-items: center;
  flex-direction: row;

  .container {
    gap: 1rem;
    column-gap: 1rem;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: center;
    width: 100%;
    height: 100%;
    max-width: 100vw;

    h1 {
      font-weight: 800;
      font-size: 84px;
      text-align: center;
    }

    p {
      font-weight: 400;
      font-size: 16px;
      line-height: 20px;
      text-align: center;
    }

    #btn-core-connect-wallet {
      margin: 5.75rem auto 0 !important;
      width: 450px;
      height: 70px;
      background-color: #6170f2;
      color: #ffffff;
      border-radius: 12px;
      padding: 5px;
      border: none;
      font-weight: bold;
      font-size: 24px;
    }

    .alternativeWithdrawContainer {
      margin: auto !important;
      display: flex;
      flex-direction: column !important;

      h2 {
        display: flex;
        flex-direction: row !important;
        justify-content: center;
        font-weight: 400;
        font-size: 20px !important;
        line-height: 24px;
        text-align: center;

        .icon-container {
          display: inline-flex !important;
          margin-left: 0.5rem;
        }
      }

      h3 {
        font-family: $font-family-primary-base;
        font-style: normal;
        font-weight: 400;
        font-size: 16px;
        line-height: 20px;
        text-align: center;
        opacity: 0.44;
        max-width: 350px;
        display: flex;
        margin: 1rem auto 2rem !important;
      }

      a.tileContainer {
        text-decoration: none !important;
        color: $black !important;
      }
    }
  }

  @media (max-width: $mobile), (max-height: 30rem) {
    padding-top: 0;
    height: 100%;

    .container {
      height: auto;

      h1 {
        max-width: 350px;
        line-height: 35px;
        font-size: 22px;
        margin: 1rem auto !important;
      }

      .alternativeWithdrawContainer {
        margin-top: 1.5rem !important;

        h3 {
          margin: 0.3rem auto 0.5rem !important;
          font-size: 14px;
          line-height: 125% !important;
        }
      }
    }
  }

  @media (max-height: 37rem) {
    .container {
      h1 {
        line-height: 35px;
        font-size: 22px;
        margin: 1rem auto !important;
      }

      .alternativeWithdrawContainer {
        margin-top: 2rem !important;

        h3 {
          margin: 0.3rem auto 0.5rem !important;
          font-size: 14px;
          line-height: 125% !important;
        }
      }
    }
  }
  @media (min-height: 700px) {
    .container {
      height: fit-content;
      .alternativeWithdrawContainer {
        margin-top: 4rem !important;
      }
    }
  }
}
.indexPage > div {
  flex: 1;
}

#secondary-container {
  height: 100%;
  background-image: url("../static/images/RIF_Rollup_Homescreen_image.svg");
  background-repeat: no-repeat;
  background-position: right;
  background-size: cover;
}

.-dark {
  .tileContainer {
    &:focus {
      outline-color: $accentBg !important;
    }

    .tileName {
      color: $white !important;
    }
  }
}
</style>
