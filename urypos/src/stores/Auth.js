import { defineStore } from "pinia";
import { useTableStore } from "./Table.js";
import { useMenuStore } from "./Menu.js";
import { useInvoiceDataStore } from "./invoiceData.js";
import frappe from "./frappeSdk.js";

import axios from "axios";
import { useAlert } from "./Alert.js";
import router from "../router";
import { disconnectQzPrinter } from "./utils/PrintWithQz";

axios.defaults.baseURL = frappe.url;

export const useAuthStore = defineStore("auth", {
  state: () => ({
    userId: "",
    currentPassword: "",
    showPassword: false,
    table: useTableStore(),
    menu: useMenuStore(),
    invoiceData: useInvoiceDataStore(),
    cashier: null,
    restrictTableOrder:null,
    alert: useAlert(),
    sessionUser: "",
    userAuth: localStorage.getItem("userAuth"),
    activeDropdown: false,
    userName: "",
    hasAccess: false,
    userRole: [],
    auth: frappe.auth(),
    db: frappe.db(),
    call: frappe.call(),
  }),
  getters: {
    isAuthenticated(state) {
      state.isAuthenticated;
    },
    passwordFieldType() {
      return this.showPassword ? "text" : "password";
    },
  },
  actions: {
    //Login
    login() {
      this.auth
        .loginWithUsernamePassword({
          username: this.userId,
          password: this.currentPassword,
          device: "mobile",
        })
        .then(() => {
          this.userAuth = true;
          localStorage.setItem("userAuth", "true");
          router.push("/Table").then(() => {
            window.location.reload();
          });
        })
        .catch((error) =>
          this.alert.createAlert("Message", error.message, "OK")
        );
    },
    checkAuthState() {
      if (this.userAuth && localStorage.getItem("userAuth")) {
        this.userAuth = true;
      }
    },
    getLoginAvatar() {
      const atIndex = this.sessionUser.indexOf("@");
      if (atIndex > -1) {
        this.userName = this.sessionUser.substring(0, atIndex);
      } else {
        this.userName = "";
      }
      return this.userName;
    },

    fetchUserDetails() {
      this.auth
        .getLoggedInUser()
        .then((user) => {
          this.sessionUser = user;
          if (!this.sessionUser) {
            this.userAuth = false;
            localStorage.removeItem("userAuth", "true");
          } else {
            this.table.fetchTable();
            this.invoiceData.fetchInvoiceDetails().then(() => {
              this.fetchUserRole();
            });
            this.menu.fetchItems();
            const currentUrl = window.location.href;
            const urlParts = currentUrl.split("/");
            const desiredPart = urlParts[urlParts.length - 1];
            if (desiredPart !== "login") {
              this.isPosOpenChecking();
            }
          }
        })
        .catch((error) => {
          this.userAuth = false;
          localStorage.removeItem("userAuth", "true");
          router.push("/login");
          console.error(error);
        });
    },
    fetchUserRole() {
      //Fetching role based on logged user
      this.db
        .getDoc("User", this.sessionUser)
        .then((doc) => {
          this.userRole = doc.roles.map((item) => item.role);
          const getPosProfile = {
            doctype: "POS Profile",
            name: this.invoiceData.posProfile,
          };
          this.call
            .get("frappe.client.get", getPosProfile)
            .then((result) => {
              var billingRoles = result.message.role_allowed_for_billing.map(
                (role) => role.role
              );
              this.cashier = billingRoles.some((role) =>
                this.userRole.includes(role)
              );

              var transferRoles = result.message.transfer_role_permissions.map(
                (role) => role.role
              );
              this.hasAccess = transferRoles.some((role) =>
                this.userRole.includes(role)
              );
              var restrictOrder =
                result.message.role_restricted_for_table_order_.map(
                  (role) => role.role
                );
              this.restrictTableOrder = restrictOrder.some((role) =>
                this.userRole.includes(role)
              );
            })
            .catch((error) => console.error(error));
        })

        .catch((error) => console.error(error));
    },
    isPosOpenChecking() {
      this.call
        .get("ury.ury_pos.api.posOpening")
        .then((result) => {
          const serverMessages = JSON.parse(result._server_messages);
          const innerMessageString = serverMessages[0];
          const innerMessage = JSON.parse(innerMessageString);
          const message = innerMessage.message;
          this.alert.createAlert("Message", message, "OK");
          router.push("/posOpen");
        })
        .catch((error) => {
          // console.error(error)
        });
    },
    toggleDropdown() {
      if (this.activeDropdown) {
        this.hideDropdown();
      } else {
        this.activeDropdown = true;
      }
    },
    hideDropdown() {
      this.activeDropdown = false;
    },

    logOut() {
      this.auth
        .logout()
        .then(() => {
          router.push("/login").then(() => {
            window.location.reload();
          });
          localStorage.removeItem("userAuth", "true");
          disconnectQzPrinter();
        })
        .catch((error) => console.error(error));
    },
  },
});
