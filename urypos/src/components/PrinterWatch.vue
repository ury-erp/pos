<template>
  <div
    v-if="printerWatch.installed && !printJobs.trackingDisabled"
    class="relative"
  >
    <button
      type="button"
      @click="printerWatch.open()"
      class="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none"
      aria-label="Printer Status"
    >
      <svg
        class="h-4 w-4 text-gray-600"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v7H6z"
        />
      </svg>
      <span class="hidden sm:inline">Printer Status</span>
      <span
        :class="['h-2.5 w-2.5 rounded-full', printerWatch.dotClass]"
        aria-hidden="true"
      ></span>
    </button>

    <div
      v-if="printerWatch.showDialog"
      class="fixed inset-0 z-50 flex items-center justify-center bg-gray-300 bg-opacity-50"
      @click.self="printerWatch.close()"
    >
      <div
        class="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-lg bg-white p-0 shadow-lg"
      >
        <div
          class="flex items-center justify-between border-b border-gray-200 p-4"
        >
          <div>
            <h2 class="text-xl font-semibold text-gray-900">Printer Health</h2>
            <p class="mt-0.5 text-sm text-gray-500">
              {{
                printerWatch.lastUpdated
                  ? `Last synced: ${formatTime(printerWatch.lastUpdated)}`
                  : "Live printer status and connectivity"
              }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="printerWatch.fetchHealth()"
              :disabled="printerWatch.isSyncing || printerWatch.loadState === 'loading'"
              class="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-300 px-3 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              <svg
                :class="[
                  'h-3.5 w-3.5 text-gray-500',
                  printerWatch.isSyncing ? 'animate-spin' : '',
                ]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>{{ printerWatch.isSyncing ? "Syncing..." : "Sync Now" }}</span>
            </button>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 cursor-pointer text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              @click="printerWatch.close()"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4">
          <div
            v-if="printerWatch.staleError"
            class="mb-4 rounded-lg bg-orange-50 p-3 text-sm text-orange-800"
          >
            {{ printerWatch.staleError }}
          </div>

          <div
            v-if="printerWatch.loadState === 'loading' && !printerWatch.printers.length"
            class="flex flex-col items-center justify-center py-12 text-center text-gray-500"
          >
            <p class="text-sm font-medium text-gray-700">
              Loading printer status...
            </p>
            <p class="mt-1 text-xs text-gray-400">
              Connecting to printer watch service
            </p>
          </div>

          <div
            v-else-if="printerWatch.loadState === 'error' && !printerWatch.printers.length"
            class="py-8 text-center"
          >
            <p class="mb-4 text-gray-700">Unable to fetch printer health.</p>
            <button
              type="button"
              @click="printerWatch.fetchHealth()"
              class="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Retry
            </button>
          </div>

          <div
            v-else-if="!printerWatch.printers.length"
            class="py-8 text-center text-gray-600"
          >
            No printers found.
          </div>

          <ul v-else class="space-y-3">
            <li
              v-for="(printer, index) in printerWatch.printers"
              :key="`${printer.device_name}-${printer.ip_address || index}-${index}`"
              class="flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3.5"
            >
              <div class="flex items-center justify-between">
                <h3
                  class="text-base font-semibold leading-tight text-gray-900"
                >
                  {{ printer.device_name }}
                </h3>
                <span
                  class="rounded px-2.5 py-0.5 text-xs font-medium"
                  :class="statusBadgeClass(printer.status)"
                >
                  {{ statusLabel(printer.status) }}
                </span>
              </div>

              <div
                class="flex items-center justify-between text-xs text-gray-600"
              >
                <div class="flex items-center gap-4">
                  <span>
                    Success:
                    <strong class="font-semibold text-gray-900">{{
                      printer.success ?? 0
                    }}</strong>
                  </span>
                  <span>
                    Failed:
                    <strong
                      :class="
                        (printer.failed ?? 0) > 0
                          ? 'font-semibold text-rose-600'
                          : 'font-semibold text-gray-900'
                      "
                      >{{ printer.failed ?? 0 }}</strong
                    >
                  </span>
                </div>
                <span class="font-mono text-xs text-gray-500">
                  {{ formatLogTime(printer.summary_timestamp || printer.last_updated) }}
                </span>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { usePrinterWatchStore } from "@/stores/printerWatch.js";
import { usePrintJobsStore } from "@/stores/printJobs.js";

const STATUS_VARIANTS = {
  excellent: { label: "Excellent", badge: "bg-green-100 text-green-800" },
  fair: { label: "Fair", badge: "bg-orange-100 text-orange-800" },
  critical: { label: "Critical", badge: "bg-red-100 text-red-800" },
  no_data: { label: "No Data", badge: "bg-gray-100 text-gray-800" },
};

export default {
  name: "PrinterWatch",
  setup() {
    const printerWatch = usePrinterWatchStore();
    const printJobs = usePrintJobsStore();
    return { printerWatch, printJobs };
  },
  methods: {
    statusVariant(status) {
      return STATUS_VARIANTS[status] || STATUS_VARIANTS.critical;
    },
    statusLabel(status) {
      return this.statusVariant(status).label;
    },
    statusBadgeClass(status) {
      return this.statusVariant(status).badge;
    },
    formatTime(isoTimestamp) {
      if (!isoTimestamp) return "";
      try {
        return new Date(isoTimestamp).toLocaleString();
      } catch {
        return isoTimestamp;
      }
    },
    formatLogTime(timestamp) {
      if (!timestamp) return "--:--:--";
      const match = String(timestamp).match(/(\d{2}:\d{2}:\d{2})/);
      if (match) return match[1];
      try {
        const d = new Date(timestamp);
        if (!isNaN(d.getTime())) {
          return d.toTimeString().split(" ")[0];
        }
      } catch {
        // fall through
      }
      return timestamp;
    },
  },
};
</script>
