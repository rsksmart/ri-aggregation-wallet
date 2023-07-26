<template>
  <div class="contactsPage dappPageWrapper">
    <i-modal id="create-edit-contact" v-model="contactModal.enabled" class="prevent-close" size="lg">
      <button id="contactBackBtn" @click="contactModal.enabled = false">
        <img src="../../static/images/back_icon.svg" /> Back
      </button>
      <h2>
        <span v-if="contactModal.type === 'add'"
          >Create Contact on Rollup <img src="../../static/images/rollup_icon.svg"
        /></span>
        <span v-else-if="contactModal.type === 'edit'">Edit contact</span>
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
      <i-button v-if="contactModal.type === 'edit'" block link size="md" variant="secondary" @click="deleteContact()">
        <v-icon name="ri-delete-bin-line" />&nbsp;&nbsp;Delete contact
      </i-button>
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
        <span>Contacts</span>
        <i-tooltip>
          <span class="icon-container _display-flex" @click="addNewContact()">
            <v-icon name="ri-add-fill" class="iconInfo" />
          </span>
          <template #body>Add contact</template>
        </i-tooltip>
      </div>
      <i-input
        v-if="isSearching || hasDisplayedContacts"
        ref="searchInput"
        v-model="search"
        placeholder="Filter contacts"
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
          <i-button block link size="lg" variant="secondary" class="_margin-top-1" @click="addNewContact()"
            >Add contact
          </i-button>
        </div>
        <div v-else-if="!hasDisplayedContacts" class="nothingFound">
          <span>
            Your search <b>"{{ search }}"</b> did not match any contacts
          </span>
        </div>
        <div
          v-for="(contact, address) in displayedContactsList"
          v-else
          :key="address"
          class="contactItem"
          :class="{ deleted: contact.deleted === true }"
          @click.self="openContact(contact)"
        >
          <user-img :wallet="contact.address" />
          <div class="contactInfo">
            <div class="contactName">{{ contact.name }}</div>
            <div class="contactAddress walletAddress">{{ contact.address }}</div>
          </div>
          <div class="iconsBlock">
            <template v-if="!contact.deleted">
              <i-tooltip placement="left" trigger="click">
                <i-button
                  class="copyAddress"
                  block
                  link
                  size="md"
                  variant="secondary"
                  @click="copyAddress(contact.address)"
                >
                  <v-icon name="ri-clipboard-line" />
                </i-button>
                <template #body>Copied!</template>
              </i-tooltip>
              <i-button block link size="md" cla variant="secondary" @click="editContact(contact)">
                <v-icon name="ri-pencil-fill" />
              </i-button>
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
</style>
