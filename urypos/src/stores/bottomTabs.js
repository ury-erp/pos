import { defineStore } from "pinia";
import { useAuthStore } from "./Auth.js";
import router from "../router";

export const tabFunctions = defineStore("tabClick", {
  state: () => ({
    auth: useAuthStore(),
  }),
  getters: {
    isLoginPage() {
      return router.currentRoute.value.path === "/login";
    },
    currentTab() {
      return router.currentRoute.value.path;
    },
  },
  actions: {},
});
