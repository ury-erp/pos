<template>
  <Search/>
  <div class="container mx-auto" v-if="this.menu.paginatedItems.length > 0">
    <div class="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      <div
        class="rounded-md border px-2 py-2 text-center shadow"
        v-for="item in this.menu.paginatedItems"
        :key="item.item"
      >
        <h2 class="mt-0 mb-2 text-lg font-normal leading-normal">
          {{ item.item_name }}
        </h2>
        <h2 class="mt-0 mb-2 text-lg font-normal leading-normal">
          ₹ {{ item.rate }}
        </h2>
        <div v-if="!item.qty">
          <button
            @click="
              item.showInput = true;
              this.menu.addToCart(item);
            "
            class="rounded border px-10 pt-2.5 pb-2 text-xs font-medium leading-normal"
          >
            ADD +
          </button>
        </div>
        <div v-if="item.qty" class="flex rounded-md">
          <button
            type="button"
            class="-ml-px inline-flex items-center justify-center gap-2 border bg-white py-3 px-4 align-middle text-sm font-medium text-gray-700 shadow-sm transition-all focus:outline-none dark:border-gray-700"
            @click="this.menu.decrementItemQuantity(item)"
          >
            -
          </button>
          <input
            type="number"
            id="qty_input"
            name="qty_input"
            class="block w-full border border-gray-200 text-center text-sm shadow-sm"
            :value="item.qty"
            @input="item.qty = $event.target.value"
            readonly
            @click="this.menu.showModal(item)"
          />
          <button
            type="button"
            class="-ml-px inline-flex items-center justify-center gap-2 border bg-white py-3 px-4 align-middle text-sm font-medium text-gray-700 shadow-sm transition-all focus:outline-none dark:border-gray-700"
            @click="this.menu.incrementItemQuantity(item)"
          >
            +
          </button>
        </div>
       
      </div>
      <div
        v-if="menu.showDialog"
        class="fixed inset-0 mt-20 z-10 overflow-y-auto bg-gray-100"
      >
        <div class="mt-10 flex items-center justify-center">
          <div class="w-full rounded-lg bg-white p-6 shadow-lg md:max-w-md">
            <div class="flex justify-end">
              <span class="sr-only">Close</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                @click="menu.showDialog = false"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>

            <h2
              class="mt-1 block text-left text-xl font-medium text-gray-900 dark:text-white"
            >
              Enter Details
            </h2>
            <div class="relative">
              <label
                for="quantity"
                class="mt-6 block text-left text-gray-900 dark:text-white"
              >
                Quantity
              </label>
              <input
                type="number"
                id="modeOfPayment"
                class="mt-4 w-full appearance-none rounded border p-2 leading-tight text-gray-900 shadow focus:outline-none"
                v-model="this.menu.quantity"
              />
              <label
                for="paidAmount"
                class="mt-6 block text-left text-gray-900 dark:text-white"
              >
                Comments
              </label>
              <input
                type="text"
                id="Comments"
                class="mt-4 w-full rounded border p-2 leading-tight text-gray-900 shadow focus:outline-none"
                v-model="this.menu.itemComments"
              />
            </div>
            <div class="flex justify-end">
              <button
                @click="this.menu.addToCartAndUpdateQty(item)"
                class="mt-8 rounded bg-blue-500 px-3 py-2 text-white hover:bg-blue-600"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else>
      <div v-if="this.menu.items.length === 0" class="flex h-screen items-center justify-center">
        <div class="text-center">No items found. Please select a table or set an active menu.</div>
      </div>
      <div v-else class="flex h-screen items-center justify-center">
        <div class="text-center">No items found.</div>
      </div>
    </div>
  <div
    class="mt-4 flex justify-center"
    v-if="this.menu.paginatedItems.length > 0"
  >
    <button
      :class="{ hidden: this.menu.currentPage === 1 }"
      :disabled="this.menu.currentPage === 1"
      @click="this.menu.currentPage -= 1"
      class="mr-2 rounded-md border px-2 py-1"
    >
      Previous
    </button>
    <div v-for="pageNumber in this.menu.pageNumbers">
      <button
        v-if="
          pageNumber === this.menu.currentPage ||
          Math.abs(pageNumber - this.menu.currentPage) <= 2
        "
        :key="pageNumber"
        @click="this.menu.currentPage = pageNumber"
        :class="{ 'bg-gray-200': pageNumber === this.menu.currentPage }"
        class="mr-2 rounded-md border px-2 py-1"
      >
        {{ pageNumber }}
      </button>
      <span
        v-else-if="
          this.menu.pageNumbers.indexOf(pageNumber) === 0 ||
          this.menu.pageNumbers.indexOf(pageNumber) ===
            this.menu.pageNumbers.length - 1
        "
      >
        ...
      </span>
    </div>
    <button
      :disabled="this.menu.currentPage === this.menu.totalPages"
      @click="this.menu.currentPage += 1"
      :class="{ hidden: this.menu.currentPage === this.menu.totalPages }"
      class="rounded-md border px-2 py-1"
    >
      Next
    </button>
  </div>
</template>

<script>
import Search from "./Search.vue";
import { useMenuStore } from "@/stores/Menu.js";

export default {
  setup() {
    const menu = useMenuStore();
    return { menu };
  },
  name: "Menu",
  components: {
    Search,
  },

};
</script>
<style>
.bg-gray-100 {
  background-color: rgba(0, 0, 0, 0.2);
}
</style>
