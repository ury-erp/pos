import { defineStore } from "pinia";
import { io } from "socket.io-client";
import frappe from "./frappeSdk.js";
import { useNotifications } from "./Notification.js";
import { usetoggleRecentOrder } from "./recentOrder.js";
import { useTableStore } from "./Table.js";

// Parity with ury v2 (pos/src/hooks/useOrdersPrintJobs.ts): terminal states on
// print_job_status_updated that clear the failed marker on an invoice/table.
const TERMINAL_NON_FAILED_STATUSES = ["COMPLETED", "CANCELED", "UNKNOWN"];

// Payload keys that identify the document an order card represents.
const ID_KEYS = ["invoice", "reference_name", "kot"];
// Payload keys that identify the table an order belongs to.
const TABLE_KEYS = ["table", "restaurant_table"];

const FAILED_JOB_FIELDS = [
  "name",
  "print_job_id",
  "status",
  "invoice",
  "reference_name",
  "table",
  "failure_reason",
  "created_at",
];

const MODAL_JOB_FIELDS = [
  "name",
  "print_job_id",
  "job_type",
  "status",
  "invoice",
  "reference_name",
  "printer",
  "printer_name",
  "job_owner",
  "table",
  "failure_reason",
  "created_at",
  "retry_count",
  "cups_job_id",
];

function getSocketEndpoint() {
  const siteName =
    window.frappe?.boot?.sitename ||
    window.site_name ||
    (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
      ? "ury.localhost"
      : window.location.hostname);

  let baseOrigin = window.location.origin;

  // In Frappe development (bench start) the webserver runs on 8000 while the
  // Socket.IO server runs on 9000.
  if (window.location.port === "8000" || window.dev_server) {
    baseOrigin = `${window.location.protocol}//${window.location.hostname}:9000`;
  }

  return `${baseOrigin}/${siteName}`;
}

function collectKeys(payload, keys, target) {
  for (const key of keys) {
    const value = payload?.[key];
    if (typeof value === "string" && value.trim()) {
      target.push(value.trim());
    }
  }
}

export const usePrintJobsStore = defineStore("printJobs", {
  state: () => ({
    initialized: false,
    trackingDisabled: false,
    currentUser: "",
    socket: null,
    socketSeenConnected: false,
    failedInvoiceIds: [],
    failedTableNames: [],
    activePrintJobs: {},
    showJobsModal: false,
    jobsModalInvoice: null,
    jobsModalTable: null,
    jobsModalJobs: [],
    jobsModalLoading: false,
    jobsModalError: null,
    retryingJobId: null,
    retryError: null,
    db: frappe.db(),
    call: frappe.call(),
    notification: useNotifications(),
  }),
  getters: {
    hasInvoiceFailed: (state) => (invoiceId) => {
      if (!invoiceId) return false;
      return state.failedInvoiceIds.includes(String(invoiceId).trim());
    },
    hasTableFailed: (state) => (tableName) => {
      if (!tableName) return false;
      return state.failedTableNames.includes(String(tableName).trim());
    },
  },
  actions: {
    async init(currentUser) {
      if (this.initialized) return;
      this.initialized = true;
      this.currentUser = currentUser || "";
      try {
        const res = await this.call.get("ury.ury_pos.api.getPosProfile");
        const profileName = res?.message?.pos_profile;
        if (profileName) {
          const profile = await this.db.getDoc("POS Profile", profileName);
          this.trackingDisabled = !!profile.custom_disable_print_status_tracking;
        }
      } catch (error) {
        console.error("Failed to resolve POS Profile print tracking setting", error);
      }
      if (this.trackingDisabled) {
        return;
      }
      this.connectSocket();
      this.fetchFailedJobs();
    },

    connectSocket() {
      if (this.socket) return;
      const endpoint = getSocketEndpoint();
      const socket = io(endpoint, {
        withCredentials: true,
        transports: ["websocket", "polling"],
        path: "/socket.io",
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });
      this.socket = socket;

      // Events fired while the socket was down are lost; resync on reconnect.
      socket.on("connect", () => {
        if (this.socketSeenConnected) {
          this.fetchFailedJobs();
        }
        this.socketSeenConnected = true;
      });

      socket.on("print_job_status_updated", (data) => {
        if (!data) return;
        if (data.print_job_id) {
          this.activePrintJobs[data.print_job_id] = data;
        }
        if (data.status === "FAILED") {
          this.addToFailed(data);
        } else if (TERMINAL_NON_FAILED_STATUSES.includes(data.status)) {
          this.removeFromFailed(data);
        }
      });

      // Owner-targeted failure alert; also fires the error toast.
      socket.on("print_failure_alert", (data) => {
        this.handlePrintFailure(data);
      });

      socket.on("invoice_print_completed", (data) => {
        this.removeFromFailed(data);
        this.syncCompletedInvoice(data);
      });

      socket.on("kot_print_completed", (data) => {
        this.removeFromFailed(data);
        this.syncCompletedInvoice(data);
      });

      socket.on("kot_print_failed", (data) => {
        this.addToFailed(data);
      });
    },

    disconnectSocket() {
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
        this.socketSeenConnected = false;
      }
      this.initialized = false;
    },

    addToFailed(payload) {
      const invoices = [];
      const tables = [];
      collectKeys(payload, ID_KEYS, invoices);
      collectKeys(payload, TABLE_KEYS, tables);
      this.failedInvoiceIds = [
        ...new Set([...this.failedInvoiceIds, ...invoices]),
      ];
      this.failedTableNames = [
        ...new Set([...this.failedTableNames, ...tables]),
      ];
    },

    removeFromFailed(payload) {
      const invoices = [];
      const tables = [];
      collectKeys(payload, ID_KEYS, invoices);
      collectKeys(payload, TABLE_KEYS, tables);
      this.failedInvoiceIds = this.failedInvoiceIds.filter(
        (id) => !invoices.includes(id)
      );
      this.failedTableNames = this.failedTableNames.filter(
        (name) => !tables.includes(name)
      );
    },

    handlePrintFailure(data) {
      if (!data) return;
      // Failures are targeted at the job owner; drop alerts for other users.
      if (
        data.job_owner &&
        this.currentUser &&
        data.job_owner.trim().toLowerCase() !==
          this.currentUser.trim().toLowerCase()
      ) {
        return;
      }
      this.addToFailed(data);
      const invoiceOrDoc =
        data.invoice || data.reference_name || data.print_job_id;
      const typeLabel = data.job_type === "KOT" ? "KOT" : "Invoice";
      this.notification.createErrorNotification(
        `${typeLabel} Printing Failed for ${invoiceOrDoc}: ${
          data.reason || data.failure_reason || "Printer Error"
        }`
      );
    },

    // The server finalizer marks the invoice printed and releases merged
    // tables; reflect that locally without a full page reload.
    syncCompletedInvoice(data) {
      const invoice = data?.invoice || data?.reference_name;
      if (!invoice) return;
      const recentOrders = usetoggleRecentOrder();
      if (
        recentOrders.selectedOrder &&
        recentOrders.selectedOrder.name === invoice
      ) {
        recentOrders.invoicePrinted = 1;
      }
      try {
        useTableStore().fetchRoom();
      } catch (error) {
        console.error("Failed to refresh table status after print", error);
      }
    },

    async fetchFailedJobs() {
      if (this.trackingDisabled) {
        this.failedInvoiceIds = [];
        this.failedTableNames = [];
        return;
      }
      try {
        const res = await this.call.get("frappe.client.get_list", {
          doctype: "URY Print Job",
          fields: FAILED_JOB_FIELDS,
          filters: [["status", "=", "FAILED"]],
        });
        const rows = res?.message || [];
        const invoices = [];
        const tables = [];
        rows.forEach((job) => {
          collectKeys(job, ["invoice", "reference_name"], invoices);
          collectKeys(job, ["table"], tables);
        });
        this.failedInvoiceIds = [...new Set(invoices)];
        this.failedTableNames = [...new Set(tables)];
      } catch (error) {
        console.error("Failed to fetch failed print jobs", error);
      }
    },

    async openJobsModal(invoiceId, tableName = null) {
      this.showJobsModal = true;
      this.jobsModalInvoice = invoiceId;
      this.jobsModalTable = tableName;
      this.jobsModalLoading = true;
      this.jobsModalError = null;
      try {
        const filters = invoiceId
          ? [["invoice", "=", invoiceId]]
          : [["table", "=", tableName]];
        const res = await this.call.get("frappe.client.get_list", {
          doctype: "URY Print Job",
          fields: MODAL_JOB_FIELDS,
          filters,
          order_by: "creation desc",
        });
        this.jobsModalJobs = res?.message || [];
      } catch (error) {
        this.jobsModalError =
          error?.message || "Failed to fetch print jobs";
        this.jobsModalJobs = [];
      } finally {
        this.jobsModalLoading = false;
      }
    },

    closeJobsModal() {
      this.showJobsModal = false;
      this.jobsModalInvoice = null;
      this.jobsModalTable = null;
      this.jobsModalJobs = [];
      this.jobsModalError = null;
      this.retryingJobId = null;
      this.retryError = null;
    },

    // Resubmit the persisted PDF via the backend retry API; no re-render here.
    async retryJob(job) {
      const printJobId = job?.print_job_id || job?.name;
      if (!printJobId || this.retryingJobId) return;
      this.retryingJobId = printJobId;
      this.retryError = null;
      try {
        const res = await this.call.get("ury.ury.printing.api.retry_print_job", {
          print_job_id: printJobId,
        });
        const result = res?.message ?? res;
        if (result && result.status && result.status !== "Success") {
          throw new Error(result.message || "Retry submission failed");
        }
        this.notification.createNotification("Print job retry submitted");
        await this.openJobsModal(this.jobsModalInvoice, this.jobsModalTable);
      } catch (error) {
        this.retryError = error?.message || "Failed to retry print job";
      } finally {
        this.retryingJobId = null;
      }
    },
  },
});
