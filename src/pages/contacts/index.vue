<template>
  <div class="contactsPage dappPageWrapper">
    <i-modal id="create-edit-contact" v-model="contactModal.enabled" class="prevent-close" size="lg">
      <button id="contactBackBtn" @click="contactModal.enabled = false">
        <img v-if="$inkline.config.variant == 'dark'" src="../../static/images/back_icon_white.svg" />
        <img v-else src="../../static/images/back_icon.svg" />
        Back
      </button>
      <h2>
        <span v-if="contactModal.type === 'add'"
          >Create Contact on Rollup
          <img v-if="$inkline.config.variant !== 'dark'" src="../../static/images/rollup_icon.svg" />
          <img v-else src="../../static/images/rollup_icon_white.svg"
        /></span>
        <span v-else-if="contactModal.type === 'edit'"
          >Edit Contact on Rollup <img src="../../static/images/rollup_icon.svg"
        /></span>
      </h2>

      <div id="contactAddressField">
        <p id="contactAddressLabel">Address</p>
        <address-input
          id="contactAddressInput"
          ref="addressInput"
          v-model="contactModal.address"
          @enter="saveContact()"
        />
      </div>

      <div id="contactNameField">
        <p id="contactNameLabel">Name your contact</p>
        <input
          id="contactNameInput"
          ref="nameInput"
          v-model="contactModal.name"
          autofocus
          maxlength="20"
          placeholder="e.g: John Doe"
          size="lg"
          type="text"
          @keyup.enter="saveContact()"
        />
      </div>
      <div v-if="contactModal.error" class="modalError _padding-bottom-2">{{ contactModal.error }}</div>
      <!-- <i-button v-if="contactModal.type === 'edit'" block link size="md" variant="secondary" @click="deleteContact()">
        <v-icon name="ri-delete-bin-line" />&nbsp;&nbsp;Delete contact
      </i-button> -->
      <button v-show="contactModal.type === 'edit'" id="contactCreateBtn" size="md" @click="saveContact()">
        Save contact
      </button>
      <button v-show="contactModal.type !== 'edit'" id="contactCreateBtn" size="md" @click="saveContact()">
        Create contact
      </button>
      <!-- </div> -->
    </i-modal>
    <div class="tileBlock contactTile">
      <div class="tileHeadline h3">
        <span id="contacts-head-span">Contacts</span>
      </div>
      <i-button id="add-contact-button" class="addButton" @click="addNewContact()"> Create new </i-button>
      <i-input
        v-if="isSearching || hasDisplayedContacts"
        ref="searchInput"
        v-model="search"
        placeholder="Search contact"
        autofocus
        maxlength="20"
      >
        <template #prefix>
          <v-icon name="ri-search-line" />
        </template>
      </i-input>
      <div class="contactsListContainer genericListContainer">
        <div v-if="!isSearching && !hasDisplayedContacts" class="nothingFound _margin-bottom-0 _margin-top-1">
          <div>The contact list is empty</div>
        </div>
        <div v-else-if="!hasDisplayedContacts" class="nothingFound">
          <span>
            Your search <b>"{{ search }}"</b> did not match any contacts
          </span>
        </div>
        <div
          v-for="(contact, address) in displayedContactsList"
          :key="address"
          class="contactItem"
          :class="{ deleted: contact.deleted === true }"
          @click.self="openContact(contact)"
        >
          <user-img :wallet="contact.address" />
          <div class="contactInfo">
            <div class="contactName">{{ contact.name }}</div>
            <div class="contactAddress walletAddress">
              {{ contact.address.slice(0, 6) }}...{{ contact.address.slice(-4) }}
            </div>
          </div>
          <div class="iconsBlock">
            <template v-if="!contact.deleted">
              <i-button block link size="md" :to="`/transaction/transfer?address=${contact.address}`">
                <img v-if="$inkline.config.variant == 'dark'" src="../../static/images/arrow-forward-white.svg" />
                <img v-else src="../../static/images/arrow-forward.svg" />
              </i-button>
              <i-popover id="popover" placement="left-end" size="sm">
                <i-button link size="sm" variant="secondary">
                  <img v-if="$inkline.config.variant == 'dark'" src="../../static/images/three-dots-white.svg" />
                  <img v-else src="../../static/images/three-dots.svg" />
                </i-button>
                <template #body>
                  <div id="edit-delete-nav">
                    <i-button class="edit-delete-btn" @click="editContact(contact)"> Edit Contact </i-button>
                    <hr class="customHr" />
                    <i-button class="edit-delete-btn" @click="deleteContact()"> Delete Contact </i-button>
                  </div>
                </template>
              </i-popover>
            </template>
            <i-button
              v-else
              class="iconsBlock"
              block
              link
              size="md"
              variant="secondary"
              @click="restoreDeleted(contact)"
            >
              <v-icon name="ri-arrow-go-back-line" />
            </i-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { getAddress } from "ethers/lib/utils";
import { ZkContact, ZkContacts } from "@rsksmart/rif-rollup-nuxt-core/types";
import { copyToClipboard, searchInObject } from "@rsksmart/rif-rollup-nuxt-core/utils";
import { Address } from "@rsksmart/rif-rollup-js-sdk/build/types";

export default Vue.extend({
  data() {
    return {
      search: "",
      contactModal: {
        enabled: false,
        type: "add" as "add" | "edit",
        error: "",
        name: "",
        address: "" as Address,
        openedAddress: undefined as Address | undefined,
      },
    };
  },
  computed: {
    isSearching(): boolean {
      return !!this.search.trim();
    },
    contactsList(): ZkContacts {
      return this.$store.getters["zk-contacts/contacts"];
    },
    displayedContactsList(): ZkContacts {
      return searchInObject(
        this.contactsList,
        this.search,
        ([_, contact]: [string, ZkContact]) => `${contact.name} - ${contact.address}`
      ) as ZkContacts;
    },
    hasDisplayedContacts(): boolean {
      return Object.keys(this.displayedContactsList).length !== 0;
    },
  },
  mounted() {
    this.$analytics.track("visit_contacts");
  },
  methods: {
    addNewContact() {
      this.$analytics.track("visit_add_contact");

      this.contactModal = {
        enabled: true,
        type: "add",
        error: "",
        name: "",
        address: "",
        openedAddress: undefined,
      };
    },
    editContact(contact: ZkContact) {
      this.$analytics.track("visit_edit_contact");

      this.contactModal = {
        enabled: true,
        type: "edit",
        error: "",
        name: contact.name,
        address: contact.address,
        openedAddress: contact.address,
      };
    },
    async saveContact() {
      if (this.contactModal.name.trim().length <= 0) {
        this.contactModal.error = "Invalid name";
        return;
      }
      if (!this.contactModal.address) {
        this.contactModal.error = "Invalid address";
        return;
      }
      if (getAddress(this.contactModal.address) === this.$store.getters["zk-account/address"]) {
        this.contactModal.error = "Can't add own address";
        return;
      }
      if (
        this.contactModal.openedAddress &&
        getAddress(this.contactModal.openedAddress) !== getAddress(this.contactModal.address)
      ) {
        await this.$store.dispatch("zk-contacts/removeContact", this.contactModal.openedAddress);
      }

      this.$analytics.track(this.contactModal.type === "add" ? "add_contact" : "edit_contact");

      await this.$store.dispatch("zk-contacts/setContact", {
        address: this.contactModal.address,
        name: this.contactModal.name.trim(),
      });
      this.contactModal.enabled = false;
    },
    deleteContact() {
      this.$analytics.track("delete_contact");

      this.$store.dispatch("zk-contacts/removeContact", this.contactModal.openedAddress);
      this.contactModal.enabled = false;
    },
    restoreDeleted(contact: ZkContact) {
      this.$store.dispatch("zk-contacts/setContact", { address: contact.address, name: contact.name });
      this.contactModal.enabled = false;
    },
    openContact(contact: ZkContact) {
      this.$router.push(`/contacts/${contact.address}`);
    },
    copyAddress(address: Address) {
      copyToClipboard(address);
    },
  },
});
</script>

<style lang="scss" scoped>
#contactBackBtn {
  background: transparent;
  border: none;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  width: 80px;
  font-weight: 400;
  cursor: pointer;
}
h2 {
  margin-top: 10%;
  text-align: center;
  font-weight: 900;
  font-size: 32px;
  color: black;
}
#contactAddressField {
  margin-top: 8%;
  margin-bottom: 4%;
}
#contactNameField,
#contactAddressField {
  width: 85%;
  display: flex;
  flex-direction: column;
  line-height: normal;
  justify-content: start;
  padding: 8px 0 8px 20px;
  background-color: #ffffff !important;
  border: 1px solid #d8d7d7;
  border-radius: 5px;
  margin-left: 7.5%;
}
#contactNameLabel,
#contactAddressLabel {
  font-size: 12.5px;
  color: #b8b8b8;
  margin: 0;
}
#contactNameInput,
#contactAddressInput {
  background-color: transparent !important;
  font-size: 13px !important;
  border: none !important;
  margin: 0;
  color: #544864;
}
#contactNameInput:focus {
  outline: none;
}
#contactCreateBtn {
  width: 85%;
  height: 65px;
  background-color: #6170f2;
  border-radius: 10px;
  border: none;
  color: #ffffff;
  font-weight: 900;
  font-size: 16px;
  margin-left: 7.5%;
  margin-top: 5%;
}

#contacts-head-span {
  font-weight: bold;
}

.contactTile {
  padding-left: 37px;
  padding-right: 37px;
  padding-top: 51px;
  padding-bottom: 40px;
}

.contactsListContainer {
  position: relative;
  max-height: 400px !important;
  overflow-y: auto !important;
  overflow-x: visible !important;
  margin-top: 0;
}

.contactItem {
  margin-top: 12px;
  font-family: inherit !important;
  height: 78px;

  .contactName {
    font-size: 16px !important;
    font-family: inherit !important;
    font-weight: bold;
  }

  .contactAddress {
    font-size: 12px !important;
    font-family: inherit !important;
  }

  &:hover {
    background-color: transparentize($color: $light, $amount: 0.2);
  }

  &.-ligth {
    background-color: #ffffff;
  }
}

#add-contact-button {
  height: 65px;
  background-color: #6170f2;
  border-radius: 10px;
  border: none;
  color: #ffffff;
  font-weight: 900;
  font-size: 16px;
  margin-top: 35px;
  margin-bottom: 12px;
}
#edit-delete-nav {
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  margin-top: 10px;
}
.edit-delete-btn {
  background: none !important;
  border: none !important;
}
hr {
  border-top: 1px solid #ddd !important;
}
</style>
