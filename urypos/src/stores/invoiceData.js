import { defineStore } from "pinia";
import router from "../router";
import { useTableStore } from "./Table.js";
import { useMenuStore } from "./Menu.js";
import { useCustomerStore } from "./Customer.js";
import { useNotifications } from "./Notification.js";
import { usetoggleRecentOrder } from "./recentOrder.js";
import { useAlert } from "./Alert.js";
import { useAuthStore } from "./Auth.js";
import frappe from "./frappeSdk.js";

import {
  printWithQz,
  loadQzPrinter,
  disconnectQzPrinter,
} from "./utils/PrintWithQz";

export const useInvoiceDataStore = defineStore("invoiceData", {
  state: () => ({
    invoiceDetails: [],
    defaultModeOfPayment: "Cash",
    warehouse: "",
    posProfile: "",
    waiter: "",
    auth: useAuthStore(),
    cashier: "",
    modeOfPaymentList: null,
    alert: useAlert(),
    showDialog: false,
    notification: useNotifications(),
    menu: useMenuStore(),
    recentOrders: usetoggleRecentOrder(),
    printer: null,
    print_format: null,
    print_type: null,
    branch: null,
    company: null,
    qz_host: null,
    grandTotal: null,
    cancelReason: null,
    tableInvoiceNo: null,
    invoiceNumber: null,
    currency: null,
    showUpdateButtton: true,
    isChecked: false,
    isPrinting: false,
    cancelInvoiceFlag: false,
    previousOrderItem: [],
    tableAttention: null,
    table: useTableStore(),
    call: frappe.call(),
    db: frappe.db(),
    qz_print: null,
  }),
  actions: {
    async fetchInvoiceDetails() {
      try {
        await this.call.get("ury.ury_pos.api.getPosProfile").then((result) => {
          this.invoiceDetails = result.message;
          this.tableAttention = this.invoiceDetails.tableAttention;
          this.warehouse = this.invoiceDetails.warehouse;
          this.posProfile = this.invoiceDetails.pos_profile;
          this.waiter = this.invoiceDetails.waiter;
          this.cashier = this.invoiceDetails.cashier;
          this.branch = this.invoiceDetails.branch;
          this.company = this.invoiceDetails.company;
          this.print_format = this.invoiceDetails.print_format;
          this.qz_print = this.invoiceDetails.qz_print;
          this.qz_host = this.invoiceDetails.qz_host;
          this.print_type = this.invoiceDetails.print_type;
          this.printer = this.invoiceDetails.printer;
          if (this.qz_host) {
            loadQzPrinter(this.qz_host);
          }
          this.db
            .getDoc("Company", this.company)
            .then((doc) => {
              this.db
                .getDoc("Currency", doc.default_currency)
                .then((currency) => {
                  this.currency = currency.symbol;
                })
                .catch((error) => {
                  if (error._server_messages) {
                    this.alert.createAlert(
                      "Message",
                      "You do not have Read or Select Permissions for Currency",
                      "OK"
                    );
                  }
                });
            })
            .catch((error) => {
              if (error._server_messages) {
                this.alert.createAlert(
                  "Message",
                  "You do not have Read or Select Permissions for Company",
                  "OK"
                );
              }
            });
        });
      } catch (error) {
        if (error._server_messages) {
          const messages = JSON.parse(error._server_messages);
          const message = JSON.parse(messages[0]);
          this.alert.createAlert("Message", message.message, "OK");
        }
      }
      this.call
        .get("ury.ury_pos.api.getModeOfPayment")
        .then((result) => {
          this.modeOfPaymentList = result.message;
        })
        .catch((error) => {
          // console.error(error)
        });
    },

    // Method for creating an invoice
    async invoiceCreation() {
      this.showUpdateButtton = false;
      let selectedTables = "";
      let cart = this.menu.cart;
      const customers = useCustomerStore();
      const customerName = customers.search;
      const ordeType =
        customers.selectedOrderType || this.recentOrders.pastOrderType;
      const numberOfPax = customers.numberOfPax;
      let invoice =
        this.recentOrders.draftInvoice ||
        this.table.invoiceNo ||
        this.invoiceNumber ||
        null;
      let lastInvoice =
        this.invoiceNumber ||
        this.recentOrders.draftInvoice ||
        this.table.invoiceNo ||
        null;

      selectedTables =
        this.table.selectedTable || this.recentOrders.restaurantTable;
      const cartCopy = JSON.parse(JSON.stringify(cart));
      let waiter =
        this.table.previousWaiter !== null &&
        this.table.previousWaiter !== undefined
          ? this.table.previousWaiter
          : this.recentOrders.recentWaiter !== null &&
            this.recentOrders.recentWaiter !== undefined
          ? this.recentOrders.recentWaiter
          : this.waiter;

      const creatingInvoice = {
        table: selectedTables,
        customer: customerName,
        items: cart,
        no_of_pax: numberOfPax,
        mode_of_payment: this.defaultModeOfPayment,
        cashier: this.cashier,
        waiter: waiter,
        last_modified_time: this.table.modifiedTime,
        pos_profile: this.posProfile,
        invoice: invoice,
        order_type: ordeType,
        last_invoice: lastInvoice,
        comments: this.menu.comments,
      };
      if (!this.auth.cashier && !numberOfPax) {
        this.alert.createAlert(
          "Message",
          "Please Select Customer / No of Pax",
          "OK"
        );
        this.showUpdateButtton = true;
      } else if (!this.auth.cashier && !selectedTables) {
        this.alert.createAlert("Message", "Please Select a Table", "OK");
        this.showUpdateButtton = true;
      } else if (this.auth.cashier && !ordeType && !selectedTables) {
        this.alert.createAlert("Message", "Please Select Order Type", "OK");
        this.showUpdateButtton = true;
      } else {
        this.call
          .post(
            "ury.ury.doctype.ury_order.ury_order.sync_order",
            creatingInvoice
          )
          .then((response) => {
            this.showUpdateButtton = true;
            if (response.message.status === "Failure") {
              const alert = response._server_messages;
              const messages = JSON.parse(alert);
              const message = JSON.parse(messages[0]);

              this.alert
                .createAlert("Message", message.message, "OK")
                .then(() => {
                  router.push("/Table").then(() => {
                    window.location.reload();
                  });
                });
            } else {
              this.invoiceNumber = response.message.name;
              this.grandTotal = response.message.grand_total;
              this.notification.createNotification("Order Update");
              this.table.fetchTable();
              this.menu.comments = "";
              let items = this.menu.items;
              items.forEach((item) => {
                item.comment = "";
              });
              this.previousOrderItem.splice(0, this.previousOrderItem.length);
              this.previousOrderItem.splice(
                0,
                this.previousOrderItem.length,
                ...cartCopy
              );

              this.table.modifiedTime = response.message.modified;
              if (this.auth.cashier) {
                this.recentOrders.viewRecentOrder(response.message);
              }
            }
          })
          .catch((error) => {
            this.showUpdateButtton = true;
            if (error._server_messages) {
              const messages = JSON.parse(error._server_messages);
              const message = JSON.parse(messages[0]);
              this.alert.createAlert("Message", message.message, "OK");
            }
          });
      }
    },

    billing(table) {
      let tables = table.name;
      const getOrderInvoice = {
        table: tables,
      };
      this.call
        .get(
          "ury.ury.doctype.ury_order.ury_order.get_order_invoice",
          getOrderInvoice
        )
        .then((result) => {
          this.tableInvoiceNo = result.message.name;
          if (
            !this.auth.hasAccess &&
            !this.auth.cashier &&
            this.auth.sessionUser !== result.message.waiter
          ) {
            this.alert.createAlert(
              "Message",
              "Printing is Blocked Table is assigned to " +
                result.message.waiter,
              "OK"
            );
          } else {
            this.isPrinting = true;
            this.printFunction();
          }
        })
        .catch((error) => console.error(error));
    },
    printFunction: async function () {
      this.isPrinting = true;
      let invoiceNo =
        this.recentOrders.invoiceNumber ||
        this.tableInvoiceNo ||
        this.invoiceNumber;
      try {
        if (this.print_type === "qz") {
          const printHTML = {
            doc: "POS Invoice",
            name: invoiceNo,
            print_format: this.print_format,
            _lang: "en",
          };
          const result = await this.call.get(
            "frappe.www.printview.get_html_and_style",
            printHTML
          );
          if (!result?.message?.html) {
            this.isPrinting = false;
            this.alert.createAlert(
              "Message",
              "Error while getting the HTML document to print for QZ",
              "OK"
            );
          }

          const print = await printWithQz(this.qz_host, result?.message?.html);

          if (print === "printed") {
            this.notification.createNotification("Print Successful");
            const updatePrintTable = {
              invoice: invoiceNo,
            };
            this.call
              .post("ury.ury.api.ury_print.qz_print_update", updatePrintTable)
              .then(() => {
                window.location.reload();
                return 200;
              })
              .catch((error) => console.error(error, "printed"));
          }
        } else if (this.print_type === "network") {
          if (this.auth.cashier) {
            const sendObj = {
              doctype: "POS Invoice",
              name: invoiceNo,
              printer_setting: this.printer,
              print_format: this.print_format,
            };
            const printingCall = async () => {
              const res = await this.call.post(
                "ury.ury.api.ury_print.network_printing",
                sendObj
              );
              return res.message;
            };
            let i = 0;
            let errorMessage = "";
            do {
              const res = await printingCall();
              if (res === "Success") {
                this.notification.createNotification("Print Successful");
                const sendObj = {
                  invoice: invoiceNo,
                };
                await this.call
                  .post("ury.ury.api.ury_print.qz_print_update", sendObj)
                  .then(() => {
                    window.location.reload();
                    return 200;
                  });
              }
              errorMessage = res;
              i++;
            } while (i < 1);
            throw {
              alert: this.alert.createAlert(
                "Message",
                `Print failed with error ${errorMessage}`,
                "OK"
              ),
              custom: (this.isPrinting = false),
            };
          } else {
            const networkPrint = {
              invoice_id: invoiceNo,
              pos_profile: this.posProfile,
            };
            const networkPrintPrintingCall = async () => {
              const res = await this.call.post(
                "ury.ury.api.ury_print.select_network_printer",
                networkPrint
              );
              return res.message;
            };
            let i = 0;
            let errorMessage = "";
            do {
              const res = await networkPrintPrintingCall();
              if (res === "Success") {
                this.notification.createNotification("Print Successful");
                const sendObj = {
                  invoice: invoiceNo,
                };
                await this.call
                  .post("ury.ury.api.ury_print.qz_print_update", sendObj)
                  .then(() => {
                    window.location.reload();
                    return 200;
                  });
              }
              errorMessage = res;
              i++;
            } while (i < 1);
            throw {
              alert: this.alert.createAlert(
                "Message",
                `Print failed with error ${errorMessage}`,
                "OK"
              ),
              custom: (this.isPrinting = false),
            };
          }
        } else {
          const sendObj = {
            doctype: "POS Invoice",
            name: invoiceNo,
            print_format: this.print_format,
          };
          this.call
            .post("ury.ury.api.ury_print.print_pos_page", sendObj)
            .then((result) => {
              this.notification.createNotification("Print Successful");
              window.location.reload();

              return result.message;
            })
            .catch((error) => console.error(error));
        }
      } catch (e) {
        if (e?.custom) {
          this.isPrinting = false;

          return this.alert.createAlert("Error", e?.title, "OK");
        }
      }
    },

    loadPrinter: async function (qz_host) {
      try {
        const res = await loadQzPrinter(url, qz_host);
        print(qz_host);
        if (res === "success")
          this.notification.createNotification("Printer loaded");
      } catch (err) {
        this.alert.createAlert("Message", err.message, "OK");
      }
    },

    showCancelInvoiceModal() {
      this.call
        .get("ury.ury.api.button_permission.cancel_check")
        .then((result) => {
          if (result.message === true) {
            this.cancelInvoiceFlag = true;
            this.cancelReason = "";
          } else {
            this.alert.createAlert(
              "Message",
              "You don't Have Permission to Cancel ",
              "OK"
            );
            this.cancelInvoiceFlag = false;
            this.cancelReason = "";
          }
        })
        .catch((error) => {
          // console.error(error)
        });
    },
    cancelInvoice: async function () {
      const recentOrders = usetoggleRecentOrder();
      let invoiceNo =
        recentOrders.invoiceNumber ||
        this.invoiceNumber ||
        this.table.invoiceNo;

      const updatedFields = {
        invoice_id: invoiceNo,
        reason: this.cancelReason,
      };
      this.call
        .post("ury.ury.doctype.ury_order.ury_order.cancel_order", updatedFields)
        .then(() => {
          this.notification.createNotification("Invoice Cancelled");
          router.push("/Table").then(() => {
            window.location.reload();
          });
        })
        .catch((error) => console.error(error));
    },
  },
});
