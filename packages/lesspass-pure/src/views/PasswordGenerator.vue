<style>
#generated-password {
  font-family: Consolas, Menlo, Monaco, Courier New, monospace, sans-serif;
}

div.awesomplete {
  display: block;
}

div.awesomplete > ul {
  z-index: 11;
}
</style>
<template>
  <form
    id="password-generator"
    v-on:submit.prevent="generatePassword"
    novalidate
  >
    <div class="form-group">
      <input-site
        ref="site"
        v-model="password.site"
        v-bind:passwords="passwords"
        v-bind:label="$t('Site')"
        v-on:suggestionSelected="setSite"
        v-on:passwordProfileSelected="setPasswordProfile"
      ></input-site>
    </div>
    <remove-auto-complete></remove-auto-complete>
    <div class="form-group">
      <label for="login" class="sr-only">{{ $t("Username") }}</label>
      <div class="inner-addon left-addon">
        <i class="fa fa-user"></i>
        <input
          id="login"
          type="text"
          name="login"
          ref="login"
          class="form-control"
          tabindex="0"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="none"
          v-bind:placeholder="$t('Username')"
          v-model="password.login"
        />
      </div>
    </div>
    <div class="form-group">
      <master-password
        ref="masterPassword"
        v-model="masterPassword"
        v-bind:label="$t('Master Password')"
      ></master-password>
    </div>
    <options v-bind:options="password"></options>
    <div class="form-group mt-4 mb-0">
      <button
        id="generatePassword__btn"
        type="submit"
        tabindex="0"
        class="btn btn-primary btn-block"
        v-if="!passwordGenerated"
      >
        {{ $t("Generate & Copy") }}
      </button>
      <div class="input-group" v-show="passwordGenerated">
        <span class="input-group-btn">
          <button
            id="copyPasswordButton"
            class="btn btn-primary"
            tabindex="0"
            type="button"
            v-on:click="copyPassword()"
          >
            <i class="fa fa-clipboard"></i>
          </button>
        </span>
        <input
          id="generated-password"
          type="password"
          class="form-control"
          tabindex="-1"
          ref="passwordGenerated"
          v-bind:value="passwordGenerated"
        />
        <span class="input-group-btn">
          <button
            id="revealGeneratedPassword"
            type="button"
            class="btn btn-secondary"
            tabindex="0"
            v-on:click="togglePasswordType($refs.passwordGenerated)"
          >
            <i class="fa fa-eye"></i>
          </button>
        </span>
        <span class="input-group-btn">
          <button
            id="sharePasswordProfileButton"
            type="button"
            class="btn btn-secondary"
            tabindex="0"
            v-on:click="sharePasswordProfile()"
          >
            <i class="fa fa-share-alt pointer"></i>
          </button>
        </span>
      </div>
    </div>
  </form>
</template>
<script>
import LessPass from "lesspass";
import { mapGetters, mapState } from "vuex";
import RemoveAutoComplete from "../components/RemoveAutoComplete.vue";
import MasterPassword from "../components/MasterPassword.vue";
import InputSite from "../components/InputSite.vue";
import Options from "../components/Options.vue";
import { showTooltip, hideTooltip } from "../services/tooltip";
import message from "../services/message";
import { getSite, cleanUrl, removeSiteSubdomain } from "../services/url-parser";

export default {
  name: "password-generator-view",
  components: {
    RemoveAutoComplete,
    InputSite,
    MasterPassword,
    Options
  },
  computed: {
    ...mapState(["password", "passwords"]),
    ...mapGetters([
      "passwordURL",
      "shouldAutoFillSite",
      "shouldRemoveSubdomain"
    ])
  },
  beforeMount() {
    if (this.shouldAutoFillSite) {
      getSite().then(site => {
        const cleanedSite = this.shouldRemoveSubdomain
          ? removeSiteSubdomain(site)
          : cleanUrl(site);
        this.$store.dispatch("setSite", { site: cleanedSite });
      });
    }
    this.$store.dispatch("getPasswordFromUrlQuery", {
      query: this.$route.query
    });
  },
  mounted() {
    setTimeout(() => {
      this.focusBestInputField();
    }, 500);
  },
  data() {
    return {
      masterPassword: "",
      passwordGenerated: "",
      cleanTimeout: null
    };
  },
  watch: {
    password: {
      handler: function() {
        this.cleanErrors();
      },
      deep: true
    },
    masterPassword: function(newMasterPassword) {
      this.masterPassword = newMasterPassword;
      this.cleanErrors();
    }
  },
  methods: {
    togglePasswordType(element) {
      if (element.type === "password") {
        element.type = "text";
      } else {
        element.type = "password";
      }
    },
    cleanErrors() {
      clearTimeout(this.cleanTimeout);
      this.passwordGenerated = "";
      this.$refs.masterPassword.hide();
    },
    cleanFormIn30Seconds() {
      const thirtySecondsInMillisecond = 30 * 1000;
      this.cleanTimeout = setTimeout(() => {
        this.masterPassword = "";
        this.passwordGenerated = "";
        this.$refs.masterPassword.hide();
      }, thirtySecondsInMillisecond);
    },
    generatePassword() {
      const site = this.password.site;
      const login = this.password.login;
      const masterPassword = this.masterPassword;
      if ((!site && !login) || !masterPassword) {
        message.error(
          this.$t(
            "SiteLoginMasterPasswordMandatory",
            "Site, login, and master password fields are mandatory."
          )
        );
        return;
      }
      const lowercase = this.password.lowercase;
      const uppercase = this.password.uppercase;
      const numbers = this.password.numbers;
      const symbols = this.password.symbols;
      if (!lowercase && !uppercase && !numbers && !symbols) {
        message.error(
          this.$t(
            "AtLeastOneOptionShouldBeSelected",
            "You must select at least one option among lowercase, uppercase, numbers or symbols."
          )
        );
        return;
      }
      const length = this.password.length;
      if (length > 35) {
        message.warning(
          this.$t(
            "LengthDeprecationWarning",
            "The maximum length of a password is 35 characters."
          )
        );
      }
      this.cleanErrors();
      const passwordProfile = {
        lowercase,
        uppercase,
        numbers,
        symbols,
        length: this.password.length,
        counter: this.password.counter,
        version: this.password.version
      };
      return LessPass.generatePassword(
        site,
        login,
        masterPassword,
        passwordProfile
      ).then(passwordGenerated => {
        this.passwordGenerated = passwordGenerated;
        this.copyPassword();
        this.cleanFormIn30Seconds();
      });
    },
    focusBestInputField() {
      try {
        const site = this.$refs.site.$refs.siteField;
        const login = this.$refs.login;
        const masterPassword = this.$refs.masterPassword;
        if (site && !site.value) return void site.focus();
        if (login && !login.value) return void login.focus();
        masterPassword.$refs.passwordField.focus();
      } catch (err) {
        console.error("Can't focus password field");
      }
    },
    copyPassword() {
      navigator.clipboard
        .writeText(this.passwordGenerated)
        .then(() => {
          const element = document.getElementById("copyPasswordButton");
          showTooltip(element, this.$t("Copied", "copied !"));
          setTimeout(() => hideTooltip(element), 2000);
        })
        .catch(() =>
          message.warning(
            this.$t(
              "SorryCopy",
              "Sorry, copying only works in modern browsers."
            )
          )
        );
    },
    sharePasswordProfile() {
      navigator.clipboard
        .writeText(this.passwordURL)
        .then(() => {
          const copySuccessMessage = this.$t(
            "PasswordProfileCopied",
            "Your password profile has been copied"
          );
          const element = document.getElementById("sharePasswordProfileButton");
          showTooltip(element, copySuccessMessage, "left");
          setTimeout(() => hideTooltip(element), 2000);
        })
        .catch(() =>
          message.warning(
            this.$t(
              "SorryCopy",
              "Sorry, copying only works in modern browsers."
            )
          )
        );
    },
    setSite(site) {
      this.password.site = site;
    },
    setPasswordProfile(passwordProfile) {
      this.$store
        .dispatch("savePassword", { password: passwordProfile })
        .then(() => {
          this.focusBestInputField();
        });
    }
  }
};
</script>
