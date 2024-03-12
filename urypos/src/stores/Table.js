import { defineStore } from "pinia";
import router from "../router";
import { useMenuStore } from "./Menu.js";
import { useInvoiceDataStore } from "./invoiceData.js";
import { useAuthStore } from "./Auth.js";
import { useCustomerStore } from "./Customer.js";
import { useNotifications } from "./Notification.js";
import { useAlert } from "./Alert.js";
import frappe from "./frappeSdk.js";

export const useTableStore = defineStore("table", {
  state: () => ({
    tables: [],
    selectedTable: null,
    previousOrderdItem: [],
    invoiceNo: "",
    alert: useAlert(),
    previousOrder: [],
    previousOrderdCustomer: "",
    invoiceData: useInvoiceDataStore(),
    grandTotal: "",
    notification: useNotifications(),
    selectedOption: "",
    isTakeAway: "",
    showModal: false,
    newTable: "",
    showTable: false,
    menu: useMenuStore(),
    tableMenu: [],
    activeDropdown: null,
    currentCaptain: null,
    tableName: "",
    showModalCaptainTransfer: false,
    showCaptain: false,
    captain: [],
    previousWaiter: null,
    newCaptain: "",
    transferTable: [],
    invoicePrinted: "",
    auth: useAuthStore(),
    call: frappe.call(),
    db: frappe.db(),
    totalMinutes: null,
    invoiceNumber: null,
    modifiedTime: null,
  }),
  getters: {
    filteredTables(state) {
      return state.tables.filter((table) => table.is_take_away === 0);
    },
    takeAway(state) {
      return state.tables.filter((table) => table.is_take_away === 1);
    },
    searchTable() {
      return this.transferTable.filter((table) => {
        return table.name.toLowerCase().includes(this.newTable.toLowerCase());
      });
    },
    searchCaptian() {
      return this.captain.filter((ordeTakers) => {
        return ordeTakers.name
          .toLowerCase()
          .includes(this.newCaptain.toLowerCase());
      });
    },
  },

  actions: {
    fetchTable() {
      this.selectedOption = "Table";
      this.db
        .getDocList("URY Table", {
          fields: ["name", "occupied", "latest_invoice_time", "is_take_away"],
          limit: "*",
        })
        .then((docs) => {
          this.tables = docs.sort((a, b) => {
            return a.name.localeCompare(b.name, undefined, {
              numeric: true,
              sensitivity: "base",
            });
          });
        })
        .catch((error) => console.error(error));
    },
    tableSearch() {
      this.db
        .getDocList("URY Table", {
          filters: [["occupied", "like", "0%"]],
        })
        .then((table) => {
          this.transferTable = table;
        })
        .catch((error) => {
          // console.error(error)
        });
    },
    fetchCaptain() {
      this.db
        .getDocList("User", {
          fields: ["name"],
          limit: "*",
        })
        .then((docs) => {
          this.captain = docs;
        })
        .catch((error) => console.error(error));
    },
    async toggleDropdown(index) {
      this.tableName = index;
      if (this.activeDropdown === index) {
        this.activeDropdown = null;
      } else {
        this.activeDropdown = index;
      }
      await this.invoiceNumberFetching();
    },
    hideDropdown() {
      this.activeDropdown = null;
    },
    selectTable(tables) {
      this.newTable = tables.name;
      this.showTable = false;
    },
    selectcaptain(captain) {
      this.newCaptain = captain.name;
      this.showCaptain = false;
    },
    getTimeDifference(table) {
      const now = new Date();
      let tableTime = "00:00:00";
      if (table && table.occupied === 1 && table.latest_invoice_time) {
        tableTime = table.latest_invoice_time;
      }
      const [tableHours, tableMinutes, tableSeconds] = tableTime.split(":");
      const tableDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        tableHours,
        tableMinutes,
        tableSeconds
      );
      const timeDifferenceInMs = now - tableDate;
      const secondsDifference = Math.floor(timeDifferenceInMs / 1000);
      const minutesDifference = Math.floor(secondsDifference / 60);
      const hoursDifference = Math.floor(minutesDifference / 60);
      const formattedTimeDifference = `${hoursDifference}:${
        minutesDifference % 60
      }`;
      return formattedTimeDifference;
    },
    getBadgeType(table) {
      if (table.occupied != 1 && table.name !== this.selectedTable) {
        return "green";
      } else if (table.name === this.selectedTable) {
        return "default";
      } else if (table.occupied === 1 && table.name !== this.selectedTable) {
        const timeDifference = this.getTimeDifference(table);
        const [hours, minutes] = timeDifference.split(":");
        const totalMinutes = parseInt(hours) * 60 + parseInt(minutes);
        if (totalMinutes > this.invoiceData.tableAttention) {
          return "red";
        } else {
          return "yellow";
        }
      }
    },
    getBadgeText(table) {
      if (table.occupied != 1 && table.name !== this.selectedTable) {
        return "Free";
      } else if (table.name === this.selectedTable) {
        return "Active";
      } else if (table.occupied === 1 && table.name !== this.selectedTable) {
        const timeDifference = this.getTimeDifference(table);
        const [hours, minutes] = timeDifference.split(":");
        const totalMinutes = parseInt(hours) * 60 + parseInt(minutes);
        if (totalMinutes > this.invoiceData.tableAttention) {
          return "Attention";
        } else {
          return "Occupied";
        }
      }
    },
    async addToSelectedTables(table) {
      this.selectedTable = table.name;
      await this.getMenu();

      if (table.is_take_away === 1) {
        this.isTakeAway = "Take Away";
      }
      let previousOrderdNumberOfPax = "";
      this.previousOrderdItem = "";
      this.invoiceNo = "";
      let items = this.tableMenu;
      items.forEach((item) => {
        item.qty = "";
      });
      let cart = this.menu.cart;
      cart.splice(0, cart.length);
      const getPreviousOrder = {
        table: this.selectedTable,
      };
      this.call
        .get(
          "ury.ury.doctype.ury_order.ury_order.get_order_invoice",
          getPreviousOrder
        )
        .then((result) => {
          this.previousOrder = result.message;
          this.invoicePrinted = this.previousOrder.invoice_printed;
          this.modifiedTime = this.previousOrder.modified;
          this.grandTotal = this.previousOrder.grand_total;
          this.invoiceNo = this.previousOrder.name;
          this.previousWaiter = this.previousOrder.waiter;
          if (this.invoiceNo) {
            if (
              !this.auth.hasAccess &&
              !this.auth.cashier &&
              this.auth.sessionUser !== this.previousOrder.waiter
            ) {
              this.alert
                .createAlert(
                  "Message",
                  "Table is assigned to " + this.previousOrder.waiter,
                  "OK"
                )
                .then(() => {
                  router.push("/Table").then(() => {
                    window.location.reload();
                  });
                });
            } else {
              this.notification.createNotification("Past Order Fetched");
            }
          } else {
            router.push("/Menu");
          }
          this.previousOrderdItem = this.previousOrder.items;
          this.previousOrderdCustomer = this.previousOrder.customer;
          previousOrderdNumberOfPax = this.previousOrder.no_of_pax;
          const customers = useCustomerStore();
          if (this.previousOrderdCustomer) {
            customers.search = this.previousOrderdCustomer;
            customers.numberOfPax = previousOrderdNumberOfPax;
            customers.fectchCustomerFavouriteItem();
          } else {
            customers.search = "";
            customers.numberOfPax = "";
            customers.customerFavouriteItems = "";
          }

          items.forEach((item) => {
            const previousItem =
              this.previousOrderdItem &&
              this.previousOrderdItem.find(
                (previousItem) => previousItem.item_name === item.item_name
              );
            if (previousItem && !item.qty) {
              const itemIndex = cart.findIndex((obj) => obj.item === item.item);
              const itemIndexExists = itemIndex !== -1;
              if (!itemIndexExists) {
                item.qty = previousItem.qty;
                item.comment = "";
                cart.push(item);
              }
            }
          });
        })
        .catch((error) => console.error(error));
    },
    routeToCart(table) {
      this.addToSelectedTables(table);
      router.push("/Cart");
    },
    routeToMenu(table) {
      this.addToSelectedTables(table);
      router.push("/Menu");
    },
    async getMenu() {
      const getMenuIem = {
        table: this.selectedTable,
        pos_profile: this.invoiceData.posProfile,
      };
      try {
        await this.call
          .get("ury.ury_pos.api.getRestaurantMenu", getMenuIem)
          .then((result) => {
            this.tableMenu = result.message;
            this.menu.fetchItems();
          });
      } catch (error) {
        if (error._server_messages) {
          const messages = JSON.parse(error._server_messages);
          const message = JSON.parse(messages[0]);
          this.alert.createAlert("Message", message.message, "OK");
        }
      }
    },
    async invoiceNumberFetching() {
      const tableInvoiceNumber = {
        table: this.tableName,
      };
      try {
        const result = await this.call.get(
          "ury.ury.doctype.ury_order.ury_order.get_order_invoice",
          tableInvoiceNumber
        );
        this.invoiceNumber = result.message.name;
        this.currentCaptain = result.message.waiter;
      } catch (error) {
        console.error(error._server_messages);
      }
    },
    tableTransfer: async function () {
      await this.invoiceNumberFetching();
      const transferTable = {
        table: this.tableName,
        newTable: this.newTable,
        invoice: this.invoiceNumber,
      };
      this.call
        .post(
          "ury.ury.doctype.ury_order.ury_order.table_transfer",
          transferTable
        )
        .then(() => {
          window.location.reload();
        })
        .catch((error) => {
          if (error._server_messages) {
            this.newTable = "";
            const messages = JSON.parse(error._server_messages);
            const message = JSON.parse(messages[0]);
            this.alert.createAlert("Message", message.message, "OK");
          }
        });
    },
    captianTransfer: async function () {
      await this.invoiceNumberFetching();
      if (this.invoiceNumber) {
        const transferCaptain = {
          currentCaptain: this.currentCaptain,
          newCaptain: this.newCaptain,
          invoice: this.invoiceNumber,
        };
        this.call
          .post(
            "ury.ury.doctype.ury_order.ury_order.captain_transfer",
            transferCaptain
          )
          .then(() =>
            this.notification.createNotification(
              "Captain Transferred Successfully"
            )
          )
          .then(() => window.location.reload())
          .catch((error) => {
            if (error._server_messages) {
              const messages = JSON.parse(error._server_messages);
              const message = JSON.parse(messages[0]);
              this.alert.createAlert("Message", message.message, "OK");
            }
          });
      }
    },
  },
});
