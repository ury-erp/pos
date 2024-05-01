<template>
  <div class="mt-3 flex flex-col md:flex-row">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-gray-300 bg-opacity-50 text-lg"
      v-if="this.invoiceData.isPrinting"
    >
      Printing Invoice
    </div>

    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-gray-300 bg-opacity-50 text-lg"
      v-if="this.recentOrders.isLoading"
    >
      Payment Being Processing
    </div>
    <div
      class="max-w-lg flex-1 rounded-lg border border-gray-200 bg-white p-4 shadow dark:border-gray-700 dark:bg-gray-800 sm:p-8"
    >
      <div class="mb-4 flex items-center justify-between">
        <h5
          class="text-xl font-bold leading-none text-gray-900 dark:text-white"
        >
          Recent Orders
        </h5>
      </div>
      <div class="w-full" @click="this.recentOrders.showOrder = false">
        <input
          type="search"
          id="orderSeach"
          class="block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 pl-10 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
          placeholder="Search by Invoice Id or Customer Name"
          v-model="this.recentOrders.searchOrder"
        />
        <select
          id="status"
          class="mt-4 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
          v-model="this.recentOrders.selectedStatus"
          @change="this.recentOrders.handleStatusChange"
        >
          <option value="Draft">Draft</option>
          <option value="Unbilled">Unbilled</option>
          <option value="Paid" v-if="this.auth.viewAllStatus === 1">
            Paid
          </option>
          <option value="Consolidated" v-if="this.auth.viewAllStatus === 1">
            Consolidated
          </option>
          <option value="Return" v-if="this.auth.viewAllStatus === 1">
            Return
          </option>
        </select>
      </div>
      <div class="flow-root">
        <ul role="list" class="divide-y divide-gray-200 dark:divide-gray-700">
          <li
            class="mt-2 py-3 sm:py-4"
            :class="{
              'bg-gray-200': this.recentOrders.setBackground === index,
            }"
            v-for="(recentOrder, index) in this.recentOrders.paginatedItems"
            :key="recentOrder.name"
            @click="
              this.recentOrders.viewRecentOrder(recentOrder);
              this.recentOrders.setBackground = index;
            "
          >
            <div class="flex items-center space-x-4">
              <div class="flex-1">
                <p
                  class="truncate text-base font-medium text-gray-900 dark:text-white"
                >
                  {{ recentOrder.name }}
                </p>
                <p class="truncate text-sm text-gray-600 dark:text-gray-400">
                  {{ recentOrder.customer }}
                </p>
              </div>
              <div class="flex-1 items-center text-center">
                <p class="text-base font-medium text-gray-900 dark:text-white">
                  {{
                    recentOrder.restaurant_table
                      ? recentOrder.restaurant_table
                      : "Take Away"
                  }}
                </p>
              </div>
              <div class="flex-1 items-center space-x-4 text-right">
                <div class="flex-1">
                  <p
                    class="truncate text-base font-medium text-gray-900 dark:text-white"
                  >
                  {{ this.invoiceData.currency }} {{ recentOrder.grand_total }}
                  </p>
                  <p class="truncate text-sm text-gray-600 dark:text-gray-400">
                    {{
                      this.recentOrders.getFormattedTime(
                        recentOrder.posting_time
                      )
                    }}
                  </p>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
      <div
        class="mt-4 flex justify-center"
        v-if="this.recentOrders.paginatedItems.length > 0"
      >
        <button
          :class="{ hidden: this.recentOrders.currentPage === 1 }"
          :disabled="this.recentOrders.currentPage === 1"
          @click="this.recentOrders.currentPage -= 1"
          class="mr-2 rounded-md border px-2 py-1"
        >
          Previous
        </button>
        <div v-for="pageNumber in this.recentOrders.pageNumbers">
          <button
            v-if="
              pageNumber === this.recentOrders.currentPage ||
              Math.abs(pageNumber - this.recentOrders.currentPage) <= 2
            "
            :key="pageNumber"
            @click="this.recentOrders.currentPage = pageNumber"
            :class="{
              'bg-gray-200': pageNumber === this.recentOrders.currentPage,
            }"
            class="mr-2 rounded-md border px-2 py-1"
          >
            {{ pageNumber }}
          </button>
          <span
            v-else-if="
              this.recentOrders.pageNumbers.indexOf(pageNumber) === 0 ||
              this.recentOrders.pageNumbers.indexOf(pageNumber) ===
                this.recentOrders.pageNumbers.length - 1
            "
          >
            ...
          </span>
        </div>
        <button
          :disabled="
            this.recentOrders.currentPage === this.recentOrders.totalPages
          "
          @click="this.recentOrders.currentPage += 1"
          :class="{
            hidden:
              this.recentOrders.currentPage === this.recentOrders.totalPages,
          }"
          class="rounded-md border px-2 py-1"
        >
          Next
        </button>
      </div>
    </div>
    <div
      class="mt-5 max-w-lg flex-1 rounded-lg border border-gray-200 bg-white p-4 shadow dark:border-gray-700 dark:bg-gray-800 sm:p-8 md:ml-10 md:mt-0"
      v-if="this.recentOrders.showOrder"
    >
      <div class="flex items-center space-x-4">
        <div class="min-w-0 flex-1">
          <p
            class="truncate text-xl font-semibold text-gray-900 dark:text-white"
          >
            {{ this.recentOrders.selectedOrder.customer }}
          </p>
          <p
            class="mr-2 mt-2 truncate text-sm text-gray-500 dark:text-gray-400"
          >
            {{ this.recentOrders.postingDate }}
          </p>

          <p
            class="mr-2 mt-2 truncate text-sm text-gray-500 dark:text-gray-400"
            v-if="this.recentOrders.selectedOrder.waiter"
          >
            Waiter : {{ this.recentOrders.selectedOrder.waiter }}
          </p>
        </div>
        <div class="items-center space-x-4 text-right">
          <div class="min-w-0 flex-1">
            <p
              class="mr-2 truncate text-xl font-semibold text-gray-900 dark:text-white"
            >
            {{ this.invoiceData.currency }}
              {{
                this.recentOrders.selectedOrder.status === "Draft"
                  ? "0.00"
                  : this.recentOrders.selectedOrder.grand_total
              }}
            </p>
            <p
              class="mr-2 mt-2 truncate text-sm text-gray-500 dark:text-gray-400"
            >
              {{ this.recentOrders.selectedOrder.name }}
            </p>

            <div class="ml-5 mt-2">
              <Badge
                :type="
                  this.recentOrders.getBadgeType(
                    this.recentOrders.selectedOrder
                  )
                "
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  class="bi bi-dot"
                  viewBox="0 0 16 16"
                >
                  <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
                </svg>
                <span class="text-xs">
                  {{ this.recentOrders.selectedOrder.status }}
                </span>
              </Badge>
            </div>
          </div>
        </div>
      </div>
      <div class="mb-2 mt-4">
        <p class="truncate text-lg font-semibold text-gray-900 dark:text-white">
          Items
        </p>
      </div>
      <div class="w-full rounded bg-gray-50 p-2">
        <div
          class="ml-2 mt-2"
          v-for="items in this.recentOrders.recentOrderListItems"
        >
          <div class="flex items-center space-x-4">
            <div class="min-w-2 flex-1">
              <p class="truncate text-base text-gray-800 dark:text-white">
                {{ items.item_name }}
              </p>
            </div>
            <div class="flex items-center space-x-4 text-right">
              <p class="text-base text-gray-800 dark:text-white">
                {{ items.qty }}
              </p>
            </div>
            <div class="items-center space-x-4 text-right">
              <p class="mr-5 truncate text-base text-gray-800 dark:text-white">
                {{ this.invoiceData.currency }} {{ items.amount }}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div class="mb-2 mt-5">
        <p class="truncate text-lg font-semibold text-gray-900 dark:text-white">
          Totals
        </p>
      </div>
      <div class="w-full rounded bg-gray-50 p-2">
        <div class="ml-2 mt-2 flex items-center space-x-4">
          <div class="min-w-2 flex-1">
            <p class="truncate text-base text-gray-800 dark:text-white">
              Net Total
            </p>
          </div>

          <div class="items-center space-x-4 text-right">
            <p class="mr-5 truncate text-base text-gray-800 dark:text-white">
              {{ this.invoiceData.currency }} {{ this.recentOrders.netTotal }}
            </p>
          </div>
        </div>
        <div class="ml-2" v-for="tax in this.recentOrders.texDetails">
          <div class="mt-2 flex items-center space-x-4">
            <div class="min-w-2 flex-1">
              <p class="truncate text-base text-gray-800 dark:text-white">
                {{ tax.description }}
              </p>
            </div>

            <div class="items-center space-x-4 text-right">
              <p class="mr-5 truncate text-base text-gray-800 dark:text-white">
                {{ this.invoiceData.currency }} {{ tax.rate }}
              </p>
            </div>
          </div>
        </div>
        <div class="ml-2 mt-2 flex items-center space-x-4">
          <div class="min-w-2 flex-1">
            <p
              class="truncate text-base font-semibold text-gray-800 dark:text-white"
            >
              Grand Total
            </p>
          </div>

          <div class="items-center space-x-4 text-right">
            <p
              class="mr-5 truncate text-base font-semibold text-gray-800 dark:text-white"
            >
            {{ this.invoiceData.currency }} {{ this.recentOrders.grandTotal }}
            </p>
          </div>
        </div>
      </div>
      <div
        class="mt-2 rounded px-4 py-2 text-center"
        v-if="
          this.recentOrders.selectedStatus !== 'Draft' &&
          recentOrders.selectedStatus !== 'Unbilled'
        "
      >
        <button
          type="button"
          class="mb-2 mr-2 rounded-lg border border-gray-400 bg-white px-5 py-2.5 text-sm font-medium text-gray-800 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
          @click="this.invoiceData.printFunction()"
        >
          Print Receipt
        </button>
      </div>
      <div
        class="mt-2 rounded px-4 py-2 text-center"
        v-if="
          this.recentOrders.selectedStatus === 'Draft' ||
          recentOrders.selectedStatus === 'Unbilled'
        "
      >
        <button
          type="button"
          class="mb-2 mr-2 w-36 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
          @click="this.recentOrders.editOrder()"
        >
          Edit
        </button>
        <button
          type="button"
          class="mb-2 mr-2 w-36 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
          @click="this.invoiceData.printFunction()"
        >
          Print Receipt
        </button>
      </div>
      <div
        class="mt-2 rounded px-4 py-2 text-center"
        v-if="
          this.recentOrders.selectedStatus === 'Draft' ||
          this.recentOrders.selectedStatus === 'Unbilled'
        "
      >
        <button
          type="button"
          class="mb-2 mr-2 w-36 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
          @click="this.recentOrders.billing()"
        >
          Make Payment
        </button>
        <button
          type="button"
          class="mb-2 mr-2 w-36 rounded-lg border bg-white px-5 py-2.5 text-sm font-medium focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
          :class="{
            'border-gray-200 text-gray-300':
              this.recentOrders.invoicePrinted === 1 ||
              this.recentOrders.selectedStatus === 'Unbilled',
            'border-gray-300 text-gray-700': !(
              this.recentOrders.invoicePrinted === 1 ||
              this.recentOrders.selectedStatus === 'Unbilled'
            ),
          }"
          @click="
            this.recentOrders.invoicePrinted === 0 &&
            this.recentOrders.selectedStatus === 'Draft'
              ? this.recentOrders.showCancelInvoiceModal()
              : ''
          "
        >
          Cancel Order
        </button>
      </div>
      <div
        v-if="this.recentOrders.cancelInvoiceFlag === true"
        class="fixed inset-0 z-10 mt-20 overflow-y-auto bg-gray-100"
      >
        <div class="mt-20 flex items-center justify-center">
          <div class="w-full rounded-lg bg-white p-6 shadow-lg md:max-w-md">
            <div class="flex justify-end">
              <span class="sr-only">Close</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                @click="this.recentOrders.cancelInvoiceFlag = false"
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
              Are you sure to cancel
            </h2>
            <div class="relative">
              <label
                for="cancelReason"
                class="mt-6 block text-left text-gray-900 dark:text-white"
              >
                Reason
              </label>
              <input
                type="text"
                id="cancelReason"
                class="mt-4 w-full appearance-none rounded border p-2 leading-tight text-gray-900 shadow focus:outline-none"
                v-model="this.recentOrders.cancelReason"
              />
            </div>
            <div class="flex justify-end">
              <button
                @click="this.recentOrders.cancelInvoiceFlag = false"
                class="mr-3 mt-6 rounded border border-gray-300 bg-gray-50 px-3 py-2"
              >
                No
              </button>
              <button
                @click="
                  this.recentOrders.cancelInvoice();
                  this.recentOrders.cancelInvoiceFlag = false;
                "
                class="mt-6 rounded bg-blue-500 px-3 py-2 text-white hover:bg-blue-600"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      </div>
      <div
        v-if="this.recentOrders.showPayment"
        class="fixed inset-0 z-10 mt-14 overflow-y-auto bg-gray-100"
      >
        <div class="mt-10 flex items-center justify-center">
          <div class="h-82 w-full rounded-lg bg-white p-6 shadow-lg md:w-3/5">
            <div class="flex justify-end">
              <span class="sr-only">Close</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                @click="this.recentOrders.showPayment = false"
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
              Select Mode Of Payment
            </h2>
            <div class="mt-8 flex items-center justify-center">
              <div class="w-full max-w-full overflow-x-auto">
                <div class="flex flex-nowrap">
                  <div
                    v-for="(
                      modeOfPayment, index
                    ) in recentOrders.modeOfPaymentList"
                    :key="index"
                    class="mr-4 w-64 flex-shrink-0 rounded-lg border border-gray-200 bg-white p-4 shadow dark:border-gray-700 dark:bg-gray-800"
                  >
                    <label
                      :for="'modeofPayments-' + index"
                      class="block text-left text-lg dark:text-white"
                    >
                      {{ modeOfPayment.mode_of_payment }}
                    </label>
                    <input
                      :id="'modeofPayments-' + index"
                      type="number"
                      name="modeofPayments"
                      class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400"
                      required
                      v-model.number="modeOfPayment.value"
                      @click="recentOrders.calculatePaidAmount(modeOfPayment)"
                      @input="
                        recentOrders.changePaidAmount(
                          modeOfPayment.mode_of_payment,
                          $event.target.value
                        )
                      "
                    />
                  </div>
                </div>
              </div>
            </div>
            <div class="flex justify-end">
              <button
                @click="
                  this.recentOrders.showPayment = false;
                  this.recentOrders.makePayment();
                "
                class="mt-10 rounded bg-blue-500 px-3 py-2 text-white hover:bg-blue-600"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { usetoggleRecentOrder } from "@/stores/recentOrder.js";
import { useInvoiceDataStore } from "@/stores/invoiceData.js";
import { useAuthStore } from "@/stores/Auth.js";
import { Badge } from "flowbite-vue";
export default {
  name: "RecentOrder",
  components: {
    Badge,
  },
  setup() {
    const recentOrders = usetoggleRecentOrder();
    const invoiceData = useInvoiceDataStore();
    const auth = useAuthStore();
    return { recentOrders, invoiceData, auth };
  },
  mounted() {
    this.recentOrders.handleStatusChange();
  },
};
</script>
<style>
.bg-gray-100 {
  background-color: rgba(0, 0, 0, 0.2);
}
</style>
