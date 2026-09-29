import { defineStore } from "pinia";
import frappe from "./frappeSdk.js";

// Parity with ury v2 (pos/src/components/PrinterWatch.tsx): fail-closed install
// check, one-time fetch on POS load, fetch again on dialog open, no polling.
export const usePrinterWatchStore = defineStore("printerWatch", {
  state: () => ({
    checked: false,
    installed: false,
    showDialog: false,
    printers: [],
    lastUpdated: null,
    loadState: "idle",
    isSyncing: false,
    staleError: null,
    call: frappe.call(),
  }),
  getters: {
    hasIssue: (state) =>
      state.printers.some(
        (p) => p.status === "critical" || p.status === "fair"
      ),
    dotClass: (state) => {
      if (!state.printers.length) return "bg-gray-400";
      const hasCritical = state.printers.some((p) => p.status === "critical");
      const hasWarning = state.printers.some(
        (p) => p.status === "fair" || p.status === "no_data"
      );
      if (hasCritical) return "bg-rose-500";
      if (hasWarning) return "bg-amber-500";
      return "bg-emerald-500";
    },
  },
  actions: {
    async init() {
      if (this.checked) return;
      this.checked = true;
      try {
        const res = await this.call.get(
          "ury.ury_pos.api.is_printer_watch_installed"
        );
        this.installed = Boolean(res?.message?.installed);
      } catch (error) {
        // Fail closed: if check fails, do not initialize feature
        this.installed = false;
        return;
      }
      if (this.installed) {
        this.fetchHealth();
      }
    },

    async fetchHealth() {
      if (!this.installed) return;
      this.isSyncing = true;
      if (this.loadState !== "success") {
        this.loadState = "loading";
      }
      try {
        const res = await this.call.get(
          "ury_printer_watch.api.printer_health.get_printer_health"
        );
        const data = res?.message ?? res;
        this.printers = data?.printers || [];
        this.lastUpdated =
          data?.timestamp || this.printers[0]?.summary_timestamp || null;
        this.loadState = "success";
        this.staleError = null;
      } catch (error) {
        if (this.loadState === "idle" || this.loadState === "loading") {
          this.loadState = "error";
        } else {
          const timeLabel = this.lastUpdated
            ? new Date(this.lastUpdated).toLocaleString()
            : "earlier";
          this.staleError = `Unable to refresh. Displaying last status from ${timeLabel}.`;
        }
      } finally {
        this.isSyncing = false;
      }
    },

    open() {
      this.showDialog = true;
      this.staleError = null;
      this.fetchHealth();
    },

    close() {
      this.showDialog = false;
    },
  },
});
