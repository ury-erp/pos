<template>
  <div
    class="mb-16 border-2 border-b-gray-200 border-l-white border-r-white border-t-white p-2"
  >
    <nav
      class="fixed left-0 top-0 z-20 w-full border-b border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-900"
    >
      <div class="flex flex-wrap items-center justify-between p-4">
        <a href="/urypos/Table">
          <img :src="imagePath" alt="Flowbite logo" class="h-12 w-44" />
        </a>
        <div class="flex md:order-2" v-if="!isLoginPage">
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
              class="avatar h-10 w-10"
              v-if="this.auth.sessionUser.includes('_')"
            >
              <h1 class="mt-2">
                {{ this.auth.sessionUser.charAt(0).toUpperCase()
                }}{{
                  this.auth.sessionUser
                    .charAt(this.auth.sessionUser.indexOf("_") + 1)
                    .toUpperCase()
                }}
              </h1>
            </div>
            <div class="avatar h-10 w-10" v-else>
              <h1 class="mt-2">
                {{ this.auth.sessionUser.charAt(0).toUpperCase() }}
              </h1>
            </div>
            <div
              class="absolute right-4 mt-11 w-36 divide-y divide-gray-100 rounded-lg bg-white text-left shadow dark:bg-gray-700"
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
                <li>
                  <a
                    href="#"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:text-white"
                    @click="this.posOpen.routeToPosOpen"
                    >POS Opening</a
                  >
                </li>
                <li>
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

export default {
  name: "Header",
  setup() {
    const auth = useAuthStore();
    const posOpen = posOpening();
    const posClose = posClosing();
    return { auth,  posOpen, posClose };
  },
  data() {
    return {
      imagePath: uriPosImage,
    };
  },
  computed: {
    isLoginPage() {
      return this.$route.path === "/login";
    },
  },
};
</script>
