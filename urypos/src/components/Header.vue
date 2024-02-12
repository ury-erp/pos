<template>
  <div
    class="mb-12 border-2 border-b-gray-200 border-l-white border-r-white border-t-white p-2 lg:mb-16"
  >
    <nav
      class="fixed left-0 top-0 z-20 w-full border-b border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-900"
    >
      <div
        class="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-between p-4"
      >
        <div v-if="this.tabClick.currentTab === '/Table' || this.auth.cashier">
          <a href="/urypos/Table">
            <img :src="imagePath" alt="Flowbite logo" class="w-32 lg:w-44" />
          </a>
        </div>
        <div
          v-else-if="
            this.tabClick.currentTab !== '/Table' || !this.auth.cashier
          "
        >
          <h3
            class="mb-2 mt-2 p-1 text-2xl lg:text-3xl font-medium text-gray-900 dark:text-white"
          >
            {{ this.table.selectedTable }}
          </h3>
        </div>
        <div v-if="!this.tabClick.isLoginPage">
          <button
            type="button"
            class="flex rounded-full bg-gray-400 text-sm focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-400 md:mr-0"
            id="user-menu-button"
            aria-expanded="false"
            data-dropdown-toggle="user-dropdown"
            data-dropdown-placement="bottom"
            @click="this.auth.toggleDropdown()"
            ref="dropdownButton"
          >
            <div
              class="relative inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gray-100 dark:bg-gray-600 lg:h-11 lg:w-11"
              v-if="this.auth.sessionUser.includes('_')"
            >
              <span class="font-medium text-gray-900 dark:text-gray-300"
                >{{ this.auth.sessionUser.charAt(0).toUpperCase()
                }}{{
                  this.auth.sessionUser
                    .charAt(this.auth.sessionUser.indexOf("_") + 1)
                    .toUpperCase()
                }}</span
              >
            </div>
            <div
              class="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gray-100 dark:bg-gray-600 lg:h-11 lg:w-11"
              v-else
            >
              <span class="font-medium text-gray-900 dark:text-gray-300">{{
                this.auth.sessionUser.charAt(0).toUpperCase()
              }}</span>
            </div>

            <div
              class="absolute right-4 mt-11 w-36 divide-y divide-gray-100 rounded-lg bg-white text-left shadow dark:bg-gray-700 lg:right-auto"
              v-show="this.auth.activeDropdown"
            >
              <ul>
                <li>
                  <h1
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:text-white"
                  >
                    {{ this.auth.getLoginAvatar() }}
                  </h1>
                </li>
                <li v-if="this.auth.cashier">
                  <a
                    href="#"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:text-white"
                    @click="this.posOpen.routeToPosOpen"
                    >POS Opening</a
                  >
                </li>
                <li v-if="this.auth.cashier">
                  <a
                    href="#"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:text-white"
                    @click="this.posClose.routeToPosClose"
                    >POS Closing</a
                  >
                </li>

                <li>
                  <a
                    href="#"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:text-white"
                    @click="this.auth.logOut"
                    >Log Out</a
                  >
                </li>
              </ul>
            </div>
          </button>
        </div>
      </div>
    </nav>
  </div>
</template>

<script>
import { useAuthStore } from "@/stores/Auth.js";
import { posOpening } from "@/stores/posOpening.js";
import { posClosing } from "@/stores/posClosing.js";
import uriPosImage from "@/assets/logos/URY_POS.jpg";
import { tabFunctions } from "@/stores/bottomTabs.js";
import { useTableStore } from "@/stores/Table.js";

export default {
  name: "Header",
  setup() {
    const auth = useAuthStore();
    const posOpen = posOpening();
    const posClose = posClosing();
    const tabClick = tabFunctions();
    const table = useTableStore();

    return { auth, posOpen, posClose, tabClick, table };
  },
  data() {
    return {
      imagePath: uriPosImage,
    };
  },
};
</script>
