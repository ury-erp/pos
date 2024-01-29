import { defineStore } from "pinia";
import { useAuthStore } from "./Auth.js";
import router from "../router";
import { useAlert } from "./Alert.js";
import { useTableStore } from "./Table.js";

export const tabFunctions = defineStore("tabClick", {
  state: () => ({
    auth: useAuthStore(),
    alert: useAlert(),
    table: useTableStore(),
  }),
  getters: {
    isLoginPage() {
      return router.currentRoute.value.path === "/login";
    },
    currentTab() {
      return router.currentRoute.value.path;
    },
  },
  actions: {
    checkActiveTable() {
      if (!this.table.selectedTable) {
        this.alert.createAlert("No Active Table", "You have not selected an active table", "Ok").then(() => {
          router.push("/Table")
        });
      }
    },
  },
});
