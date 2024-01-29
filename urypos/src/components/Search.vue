<template>
  <!-- Search & Filters -->
  <div class="flex flex-col md:flex-row mt-5 lg:mt-2">
    <div
      class="relative"
      :class="[
        {
          'md:w-2/3': this.menu.showPriority == true,
          'md:w-full': this.menu.showPriority == false,
        },
      ]"
    >
      <div
        class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
      >
        <svg
          aria-hidden="true"
          class="h-5 w-5 text-gray-500 dark:text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          ></path>
        </svg>
      </div>
      <input
        type="search"
        id="default-search"
        class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 pl-10 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
        placeholder="Item Search"
        v-model="this.menu.searchTerm"
        @input="this.menu.handleSearchInput"
        @click="this.menu.clearSearch"
        autocapitalize="none"
      />
    </div>
    <div
      class="mt-2 flex flex-row md:ml-2 md:mt-0 md:w-1/3"
      v-if="this.menu.showPriority == true"
    >
      <button
        class="focus:shadow-outline w-1/2 rounded bg-blue-700 px-4 py-2 font-bold text-white hover:bg-blue-900 focus:outline-none"
        type="button"
        @click="this.menu.showSpecialItems"
      >
        Priority
      </button>
      <button
        class="focus:shadow-outline ml-2 w-1/2 rounded bg-blue-700 px-4 py-2 font-bold text-white hover:bg-blue-900 focus:outline-none"
        type="button"
        @click="this.menu.showAllItems"
      >
        All
      </button>
    </div>
  </div>
</template>

<script>
import { useMenuStore } from "@/stores/Menu.js";
export default {
  setup() {
    const menu = useMenuStore();
    return { menu };
  },
};
</script>
