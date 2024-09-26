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
    payments: [],
    pastOrder: [],
    texDetails: [],
    pastOrderdItem: [],
    recentOrderList: [],
    modeOfPaymentList: [],
    recentOrderListItems: [],
    next: false,
    netTotal: 0,
    paidAmount: 0,
    grandTotal: 0,
    billAmount: 0,
    currentPage: 1,
    paymentMethod: 0,
    editPrintedInvoice: 0,
    selectedStatus: "Draft",
    posProfile: "",
    searchOrder: "",
    customerNameForBilling: "",
    table: null,
    orderType:null,
    postingDate: null,
    recentWaiter: null,
    draftInvoice: null,
    cancelReason: null,
    pastOrderType: null,
    selectedTable: null,
    invoiceNumber: null,
    selectedOrder: null,
    invoicePrinted: null,
    restaurantTable: null,
    modeOfPaymentName: null,
    isLoading: false,
    isChecked: false,
    showOrder: false,
    showDialog: false,
    showPayment: false,
    cancelInvoiceFlag: false,
    alert: useAlert(),
    call: frappe.call(),
    menu: useMenuStore(),
    customers: useCustomerStore(),
    notification: useNotifications(),
    invoiceData: useInvoiceDataStore(),
  }),
  getters: {
    filteredOrders() {
      return this.recentOrderList.filter((order) =>
        this.matchesSearchOrder(order)
      );
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
    async getPosInvoice(selectedStatus, limit, startLimit) {
      const recentOrder = {
        status: selectedStatus,
        limit: limit,
        limit_start: startLimit,
      };
      this.call
        .get("ury.ury_pos.api.getPosInvoice", recentOrder)
        .then((result) => {
          this.recentOrderList = result.message.data;
          this.next = result.message.next;
          return this.recentOrderList, this.next;
        })
        .catch((error) => console.error(error));
    },
    async handleStatusChange() {
      this.currentPage = 1;
      let limit = 0;
      let startLimit = 0;
      if(this.selectedStatus==="Recently Paid"){
        limit = this.invoiceData.paidLimit
        this.getPosInvoice(this.selectedStatus, limit, startLimit);
      }
      else{
        limit = 10
        this.getPosInvoice(this.selectedStatus, limit, startLimit);
      }
      
    },
    nextPageClick() {
      this.currentPage += 1;
      const limit = 10;
      const startLimit = (this.currentPage - 1) * limit;
      this.getPosInvoice(this.selectedStatus, limit, startLimit);
    },
    previousPageClick() {
      this.currentPage -= 1;
      const limit = 10;
      const startLimit = (this.currentPage - 1) * limit;
      this.getPosInvoice(this.selectedStatus, limit, startLimit);
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
      if (recentOrder.name === this.invoiceNumber ) return;
      this.orderType=recentOrder.order_type
      this.netTotal = recentOrder.net_total;
      this.grandTotal = recentOrder.rounded_total;
      this.invoiceNumber = recentOrder.name;
      this.selectedOrder = recentOrder;
      this.selectedTable = recentOrder.restaurant_table;
      const dateTimeString = `${recentOrder.posting_date}`;
      const dateTime = moment(dateTimeString, "YYYY-MM-DD");
      this.postingDate = dateTime.format("Do MMMM");
      this.invoicePrinted = recentOrder.invoice_printed;
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
      this.showOrder = true;
    },
    async editOrder() {
      let previousOrderdNumberOfPax = "";
      this.pastOrderdItem = "";
      let previousOrderdCustomer = "";
      this.pastOrderType = "";
      let items = this.menu.items;
      this.draftInvoice = this.invoiceNumber;
      this.editPrintedInvoice = this.invoicePrinted;
      items.forEach((item) => {
        item.qty = "";
      });
      let cart = this.menu.cart;
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
          this.pastOrderType = pastOrder.order_type;
          if (this.pastOrderType) {
            this.menu.selectedOrderType = pastOrder.order_type;
            this.menu.pickOrderType()
            if(this.pastOrderType === "Aggregators"){
              this.menu.selectedAggregator=pastOrder.customer
            }
            this.menu.orderTypeSelection();
          }
          previousOrderdCustomer = pastOrder.customer;
          previousOrderdNumberOfPax = pastOrder.no_of_pax;
          router.push("/Menu");
          if (previousOrderdCustomer) {
            this.customers.search = previousOrderdCustomer;
            this.customers.numberOfPax = previousOrderdNumberOfPax;
            this.customers.fectchCustomerFavouriteItem();
          } else {
            this.customers.search = "";
            this.customers.numberOfPax = "";
            this.customers.customerFavouriteItems = "";
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
    getModeofPayment(customer) {
      if (customer) {
        const aggregator = {
          aggregator: customer,
        };
        this.call
          .get("ury.ury_pos.api.getAggregatorMOP", aggregator)
          .then((result) => {
            this.modeOfPaymentList = result.message;
          })
          .catch((error) => {
            if (error._server_messages) {
              const messages = JSON.parse(error._server_messages);
              const message = JSON.parse(messages[0]);
              this.alert.createAlert("Message", message.message, "OK");
            }
          });
      }
    },
    billing: async function () {
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
          let orderType = this.pastOrder.order_type;
          if (orderType === "Aggregators") {
            this.getModeofPayment(this.pastOrder.customer);
          } else {
            this.call
              .get("ury.ury_pos.api.getModeOfPayment")
              .then((result) => {
                this.modeOfPaymentList = result.message;
              })
              .catch((error) => {
                // console.error(error)
              });
          }

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
            this.getPosInvoice(this.selectedStatus, 10, 0);
            this.showOrder = false;
            this.clearData()  
            this.isLoading = false;
          })
          .catch((error) => {
            this.isLoading = false;
            const messages = JSON.parse(error._server_messages);
            const message = JSON.parse(messages[0]);
            this.alert.createAlert("Message", message.message, "OK");
          });
      }
    },
    clearData() {
      this.menu.selectedOrderType = "";
      this.pastOrderType=""
      this.menu.items.forEach((item) => {
        item.comment = "";
        item.qty = "";
      });
      this.menu.cart = [];
      this.draftInvoice = "";
      this.customers.selectedOrderType = "";
      this.menu.selectedAggregator = "";
      this.invoiceData.invoiceNumber = "";
      this.customers.customerFavouriteItems = "";
      this.customers.search = "";
      this.invoiceData.tableInvoiceNo =""
      this.pastOrderType = "";
      this.showOrder=false;
      this.customerNameForBilling=""
      this.payments = []
      this.invoiceNumber=""
      this.setBackground=""
      this.recentOrderListItems = [];
      this.texDetails=[]
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
