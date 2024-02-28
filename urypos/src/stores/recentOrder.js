import { defineStore } from "pinia";
import router from "../router";
import moment from "moment";
import { useMenuStore } from "./Menu.js";
import { useCustomerStore } from "./Customer.js";
import { useNotifications } from "./Notification.js";
import { useInvoiceDataStore } from "./invoiceData.js";
import { useAlert } from "./Alert.js";
import frappe from "./frappeSdk.js";

export const usetoggleRecentOrder = defineStore("recentOrders", {
  state: () => ({
    notification: useNotifications(),
    invoiceData: useInvoiceDataStore(),
    alert: useAlert(),
    call: frappe.call(),
    recentOrderList: [],
    recentOrderListItems: [],
    texDetails: [],
    pastOrderdItem: [],
    pastOrder: [],
    modeOfPaymentList: [],
    payments: [],
    selectedStatus: "Draft",
    searchOrder: "",
    customerNameForBilling: "",
    posProfile: "",
    paidAmount: 0,
    paymentMethod: 0,
    currentPage: 1,
    perPage: 10,
    netTotal: 0,
    grandTotal: 0,
    billAmount: 0,
    editPrintedInvoice: 0,
    table: null,
    postingDate: null,
    invoiceNumber: null,
    selectedOrder: null,
    restaurantTable: null,
    modeOfPaymentName: null,
    invoicePrinted: null,
    setBackground: null,
    selectedTable: null,
    recentWaiter: null,
    cancelReason: null,
    draftInvoice: null,
    pastOrderType: null,
    showOrder: false,
    showDialog: false,
    isLoading: false,
    showPayment: false,
    isChecked: false,
    cancelInvoiceFlag: false,
  }),
  getters: {
    filteredOrders() {
      return this.recentOrderList.filter((order) =>
        this.matchesSearchOrder(order)
      );
    },
    totalPages() {
      return Math.ceil(this.filteredOrders.length / this.perPage);
    },
    paginatedItems() {
      const startIndex = (this.currentPage - 1) * this.perPage;
      const endIndex = startIndex + this.perPage;
      return this.filteredOrders.slice(startIndex, endIndex);
    },
    pageNumbers() {
      const pageNumbers = [];
      for (let i = 1; i <= this.totalPages; i++) {
        pageNumbers.push(i);
      }
      return pageNumbers;
    },
    total() {
      return this.modeOfPaymentList.reduce(
        (acc, method) => acc + (method.value || 0),
        0
      );
    },
    change() {
      return this.billAmount - this.total;
    },
    orderNumber() {
      if (this.draftInvoice || this.invoiceData.invoiceNumber) {
        let orderNo = this.draftInvoice || this.invoiceData.invoiceNumber;
        return orderNo;
      } else {
        return "New";
      }
    },
  },
  actions: {
    async handleStatusChange() {
      const recentOrder = {
        status: this.selectedStatus,
      };
      this.call
        .get("ury.ury_pos.api.getPosInvoice", recentOrder)
        .then((result) => {
          this.recentOrderList = result.message;
        })
        .catch((error) => console.error(error));
    },

    matchesSearchOrder(order) {
      const query = this.searchOrder.toLowerCase();
      const name = order.name.toLowerCase();
      const customer = order.customer.toLowerCase();

      return name.includes(query) || customer.includes(query);
    },
    getBadgeType(selectedOrder) {
      if (
        selectedOrder.status === "Paid" ||
        selectedOrder.status === "Consolidated"
      ) {
        return "green";
      } else if (selectedOrder.status === "Return") {
        return "default";
      } else if (selectedOrder.status === "Draft") {
        return "red";
      }
    },
    getFormattedTime(postingTime) {
      const dateTime = moment(postingTime, "HH:mm:ss.SSSSSS");
      const formattedDateTime = dateTime.format("h:mma");
      return formattedDateTime;
    },

    async viewRecentOrder(recentOrder) {
      this.netTotal = recentOrder.net_total;
      this.grandTotal = recentOrder.rounded_total;
      this.invoiceNumber = recentOrder.name;
      this.selectedOrder = recentOrder;
      this.selectedTable = recentOrder.restaurant_table;
      const dateTimeString = `${recentOrder.posting_date}`;
      const dateTime = moment(dateTimeString, "YYYY-MM-DD");
      this.postingDate = dateTime.format("Do MMMM");

      const getPosInvoiceItems = {
        invoice: this.invoiceNumber,
      };
      this.call
        .get("ury.ury_pos.api.getPosInvoiceItems", getPosInvoiceItems)
        .then((result) => {
          this.recentOrderListItems = result.message[0];
          this.texDetails = result.message[1];
        })
        .catch((error) => console.error(error));

      const getOrderInvoice = {
        doctype: "POS Invoice",
        name: this.invoiceNumber,
      };
      this.call
        .get("frappe.client.get", getOrderInvoice)
        .then((result) => {
          this.invoicePrinted = result.message.invoice_printed;
        })
        .catch((error) => console.error(error));

      this.showOrder = true;
    },
    async editOrder() {
      let previousOrderdNumberOfPax = "";
      this.pastOrderdItem = "";
      let previousOrderdCustomer = "";
      const menu = useMenuStore();
      let items = menu.items;
      this.draftInvoice = this.invoiceNumber;
      this.editPrintedInvoice = this.invoicePrinted;
      items.forEach((item) => {
        item.qty = "";
      });
      let cart = menu.cart;
      cart.splice(0, cart.length);
      const getOrderInvoice = {
        doctype: "POS Invoice",
        name: this.draftInvoice,
      };
      this.call
        .get("frappe.client.get", getOrderInvoice)
        .then((result) => {
          let pastOrder = result.message;
          this.restaurantTable = pastOrder.restaurant_table;
          this.pastOrderdItem = pastOrder.items;
          this.recentWaiter = pastOrder.waiter;
          this.pastOrderType=pastOrder.order_type
          previousOrderdCustomer = pastOrder.customer;
          previousOrderdNumberOfPax = pastOrder.no_of_pax;
          router.push("/Menu");
          const customers = useCustomerStore();
          if (previousOrderdCustomer) {
            customers.search = previousOrderdCustomer;
            customers.numberOfPax = previousOrderdNumberOfPax;
            customers.fectchCustomerFavouriteItem();
          } else {
            customers.search = "";
            customers.numberOfPax = "";
            customers.customerFavouriteItems = "";
          }

          items.forEach((item) => {
            const previousItem =
              this.pastOrderdItem &&
              this.pastOrderdItem.find(
                (previousItem) => previousItem.item_name === item.item_name
              );
            if (previousItem && !item.qty) {
              const itemIndex = cart.findIndex((obj) => obj.item === item.item);
              const itemIndexExists = itemIndex !== -1;
              if (!itemIndexExists) {
                item.qty = previousItem.qty;
                item.comments = "";
                cart.push(item);
              }
            }
          });
        })
        .catch((error) => console.error(error));
    },
    billing: async function () {
      this.call
        .get("ury.ury_pos.api.getModeOfPayment")
        .then((result) => {
          this.modeOfPaymentList = result.message;
        })
        .catch((error) => {
          // console.error(error)
        });
      const getOrderInvoice = {
        doctype: "POS Invoice",
        name: this.invoiceNumber,
      };
      this.call
        .get("frappe.client.get", getOrderInvoice)
        .then((result) => {
          this.pastOrder = result.message;
          this.customerNameForBilling = this.pastOrder.customer;
          this.posProfile = this.pastOrder.pos_profile;
          this.table = this.pastOrder.restaurant_table;
          if (this.invoicePrinted === 0) {
            this.alert.createAlert(
              "Alert",
              "Please Print Invoice before Payment",
              "OK"
            );
            this.isLoading = false;
          } else {
            this.showPayment = true;
          }
        })
        .catch((error) => console.error(error));
    },

    calculatePaidAmount(paymentMethod) {
      this.billAmount = this.grandTotal;
      if (this.billAmount - this.total > 0) {
        paymentMethod.value = this.billAmount - this.total;
        this.paymentMethod = paymentMethod.value;
        let existingEntryIndex = this.payments.findIndex(
          (entry) => entry.mode_of_payment === paymentMethod.mode_of_payment
        );
        if (existingEntryIndex !== -1) {
          this.payments[existingEntryIndex].amount = this.paymentMethod;
        } else {
          let paidAmount = {
            mode_of_payment: paymentMethod.mode_of_payment,
            amount: this.paymentMethod,
          };
          this.payments.push(paidAmount);
        }
      }
    },
    changePaidAmount(name, value) {
      this.modeOfPaymentName = name;
      this.paidAmount = parseFloat(value);
      if (this.paidAmount > 0) {
        let existingEntryIndex = this.payments.findIndex(
          (entry) => entry.mode_of_payment === this.modeOfPaymentName
        );
        if (existingEntryIndex !== -1) {
          this.payments[existingEntryIndex].amount = this.paidAmount;
        } else {
          let paidAmount = {
            mode_of_payment: this.modeOfPaymentName,
            amount: this.paidAmount,
          };
          this.payments.push(paidAmount);
        }
      }
    },

    //Making Payment
    makePayment: async function () {
      this.isLoading = true;
      const invoicePayment = {
        table: this.selectedTable,
        invoice: this.invoiceNumber,
        customer: this.customerNameForBilling,
        cashier: this.invoiceData.cashier,
        payments: this.payments,
        pos_profile: this.posProfile,
      };

      let pay = this.payments;
      let amount = pay.reduce((total, obj) => obj.amount + total, 0);
      let r_total = this.grandTotal;
      let diff = r_total - amount;
      if (diff > 5) {
        this.alert.createAlert("Message", "Round Off Limit Exceeded", "OK");
        this.isLoading = false;
      } else {
        this.call
          .post(
            "ury.ury.doctype.ury_order.ury_order.make_invoice",
            invoicePayment
          )
          .then(() => {
            this.notification.createNotification("Payment Completed");
            window.location.reload();
            this.isLoading = false;
          })
          .catch((error) => {
            console.error(error);
            this.isLoading = false;
            const messages = JSON.parse(error._server_messages);
            const message = JSON.parse(messages[0]);
            this.alert
              .createAlert("Message", message.message, "OK")
              .then(() => {
                window.location.reload();
              });
          });
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
      const updatedFields = {
        invoice_id: this.invoiceNumber,
        reason: this.cancelReason,
      };
      this.call
        .post("ury.ury.doctype.ury_order.ury_order.cancel_order", updatedFields)
        .then(() => {
          this.notification.createNotification("Invoice Cancelled");
          window.location.reload();
        })
        .catch((error) => console.error(error));
    },
    toggleRecentOrders() {
      router.push("/recentOrder");
    },
  },
});
