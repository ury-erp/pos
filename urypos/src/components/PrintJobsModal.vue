<template>
  <div
    v-if="printJobs.showJobsModal"
    class="fixed inset-0 z-50 flex items-center justify-center bg-gray-300 bg-opacity-50"
    @click.self="printJobs.closeJobsModal()"
  >
    <div
      class="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-4 shadow-lg"
    >
      <div class="flex items-center justify-between border-b border-gray-200 pb-2">
        <h2 class="text-lg font-semibold text-gray-900">Print Jobs</h2>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 cursor-pointer text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          @click="printJobs.closeJobsModal()"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </div>
      <p class="mt-1 text-sm text-gray-500">
        {{
          printJobs.jobsModalInvoice
            ? `Print queue for invoice ${printJobs.jobsModalInvoice}`
            : printJobs.jobsModalTable
              ? `Print queue for table ${printJobs.jobsModalTable}`
              : "View print jobs for the selected item"
        }}
      </p>

      <div
        v-if="printJobs.jobsModalLoading"
        class="py-8 text-center text-gray-600"
      >
        Loading print jobs...
      </div>

      <div
        v-else-if="printJobs.jobsModalError"
        class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"
      >
        {{ printJobs.jobsModalError }}
      </div>

      <div
        v-else-if="!printJobs.jobsModalJobs.length"
        class="py-8 text-center text-gray-600"
      >
        No print jobs found.
      </div>

      <ul v-else class="mt-3 space-y-3">
        <li
          v-for="job in printJobs.jobsModalJobs"
          :key="job.print_job_id || job.name"
          class="rounded-lg border border-gray-200 bg-gray-50 p-3"
        >
          <div class="flex items-center justify-between gap-2">
            <div class="flex min-w-0 items-baseline gap-2">
              <h3 class="text-sm font-semibold text-gray-900">
                {{ job.job_type || "BILL" }}
              </h3>
              <span
                class="truncate text-xs text-gray-500"
                :title="job.print_job_id || job.name"
              >
                {{ job.print_job_id || job.name }}
              </span>
            </div>
            <span
              class="rounded px-2 py-0.5 text-xs font-medium"
              :class="statusClass(job.status)"
            >
              {{ job.status }}
            </span>
          </div>

          <div class="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs text-gray-600">
            <span>{{ job.printer_name || job.printer || "Unknown printer" }}</span>
            <span class="text-gray-300">•</span>
            <span>{{ formatTime(job.created_at) }}</span>
            <template v-if="job.table">
              <span class="text-gray-300">•</span>
              <span>Table: {{ job.table }}</span>
            </template>
          </div>

          <div v-if="job.failure_reason" class="mt-1 text-xs text-red-600">
            {{ job.failure_reason }}
          </div>

          <div
            v-if="job.status === 'FAILED'"
            class="mt-2 flex items-center gap-2"
          >
            <button
              type="button"
              @click="printJobs.retryJob(job)"
              :disabled="printJobs.retryingJobId === (job.print_job_id || job.name)"
              class="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              {{
                printJobs.retryingJobId === (job.print_job_id || job.name)
                  ? "Retrying..."
                  : "Retry"
              }}
            </button>
            <span
              v-if="printJobs.retryingJobId === (job.print_job_id || job.name)"
              class="text-xs text-gray-500"
            >
              Resubmitting print job...
            </span>
          </div>
        </li>
      </ul>

      <div
        v-if="printJobs.retryError"
        class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"
      >
        {{ printJobs.retryError }}
      </div>
    </div>
  </div>
</template>

<script>
import { usePrintJobsStore } from "@/stores/printJobs.js";

export default {
  name: "PrintJobsModal",
  setup() {
    const printJobs = usePrintJobsStore();
    return { printJobs };
  },
  methods: {
    statusClass(status) {
      switch (status) {
        case "COMPLETED":
          return "bg-green-100 text-green-800";
        case "FAILED":
          return "bg-red-100 text-red-800";
        case "QUEUED":
        case "PENDING":
        case "PROCESSING":
          return "bg-yellow-100 text-yellow-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    },
    formatTime(timestamp) {
      if (!timestamp) return "--";
      try {
        return new Date(timestamp).toLocaleString();
      } catch {
        return timestamp;
      }
    },
  },
};
</script>
