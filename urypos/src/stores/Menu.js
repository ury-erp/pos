import { defineStore } from "pinia";
import { useInvoiceDataStore } from "./invoiceData.js";
import { useTableStore } from "./Table.js";
import { useNotifications } from "./Notification.js";
import { useAuthStore } from "./Auth.js";
import frappe from "./frappeSdk.js";
import { usetoggleRecentOrder } from "./recentOrder.js";

import { useAlert } from "./Alert.js";

export const useMenuStore = defineStore("menu", {
  state: () => ({
    items: [],
    cart: [],
    searchTerm: "",
    showAll: true,
    showPriority: false,
    currentPage: 1,
    perPage: 20,
    comments: "",
    alert: useAlert(),
    invoiceData: useInvoiceDataStore(),
    auth: useAuthStore(),
    notification: useNotifications(),
    table: useTableStore(),
    recentOrders: usetoggleRecentOrder(),
    showDialog: false,
    showDialogCart: false,
    quantity: "",
    item: [],
    itemComments: "",
    call: frappe.call(),
  }),
  getters: {
    filteredItems(state) {
      if (
        typeof state.searchTerm !== "string" ||
        state.searchTerm.trim() === ""
      ) {
        if (state.showAll) {
          return state.items;
        } else {
          return state.items.filter((item) => item.special_dish === 1);
        }
      } else {
        const searchTerm = state.searchTerm.toLowerCase();
        return state.items.filter(
          (item) =>
            typeof item.item_name === "string" &&
            typeof item.item === "string" &&
            (item.item_name.toLowerCase().includes(searchTerm) ||
              item.item.toLowerCase().includes(searchTerm))
        );
      }
    },

    totalPages() {
      return Math.ceil(this.filteredItems.length / this.perPage);
    },
    paginatedItems() {
      const startIndex = (this.currentPage - 1) * this.perPage;
      const endIndex = startIndex + this.perPage;
      return this.filteredItems.slice(startIndex, endIndex);
    },
    pageNumbers() {
      const pageNumbers = [];
      for (let i = 1; i <= this.totalPages; i++) {
        pageNumbers.push(i);
      }
      return pageNumbers;
    },
    setColorForBilledInvoice() {
      if (
        this.recentOrders.editPrintedInvoice === 0 ||
        this.auth.removeTableOrderItem === 1
      ) {
        return "black";
      } else if (
        this.recentOrders.editPrintedInvoice === 1 ||
        this.auth.removeTableOrderItem === 0
      ) {
        return "gray";
      }
    },
    grand_total() {
      return this.cart
        .reduce((total, item) => {
          return total + parseFloat(item.rate) * item.qty;
        }, 0)
        .toFixed(2);
    },
  },
  actions: {
    fetchItems() {
      const getMenu = {
        pos_profile: this.invoiceData.posProfile,
      };
      this.call
        .get("ury.ury_pos.api.getRestaurantMenu", getMenu)
        .then((result) => {
          if (!this.auth.cashier && this.table.tableMenu) {
            this.items = this.table.tableMenu;
          } else {
            this.items = result.message;
          }
          this.items.forEach((menuItem) => {
            if (menuItem.special_dish == 1) {
              this.showPriority = true;
            }
          });
        })
        .catch((error) => {
          if (error._server_messages) {
            const messages = JSON.parse(error._server_messages);
            const message = JSON.parse(messages[0]);
            this.alert.createAlert("Message", message.message, "OK");
          }
        });
    },
    itemNameExtract(item_name) {
      return item_name
        ? item_name
            .split(" ")
            .map((word) => (word ? word[0].toUpperCase() : ""))
            .join("")
            .substring(0, 2)
        : "";
    },
    updateSearchTerm() {
      this.currentPage = 1;
    },
    getFullImagePath(relativePath) {
      return `${frappe.url}${relativePath}`;
    },

    handleSearchInput(event) {
      this.searchTerm = event.target.value;
      this.updateSearchTerm();
    },
    clearSearch(event) {
      event.target.value = "";
      this.searchTerm = "";
      this.showAll = true;
    },
    showAllItems() {
      this.showAll = true;
    },
    showSpecialItems() {
      this.showAll = false;
    },
    showModal(item) {
      this.showDialog = true;
      this.quantity = item.qty;
      this.item = item;
      this.itemComments = item.comment;
    },

    addToCartAndUpdateQty() {
      const item = this.item;

      if (
        this.quantity !== null &&
        this.quantity !== undefined &&
        this.quantity !== "" &&
        this.quantity > 0
      ) {
        if (!item.qty) {
          this.$set(item, "qty", this.quantity);
        } else {
          item.qty = this.quantity;
          item.comment = this.itemComments;
        }
      }

      this.showDialog = false;
    },

    getitemQty(item) {
      item.qty = this.cart.qty;
    },
    addToCart(item) {
      const itemIndex = this.cart.findIndex((obj) => obj.item === item.item);
      const itemIndexExists = itemIndex !== -1;

      if (!itemIndexExists) {
        item.qty = 1;
        item.comment = "";
        this.cart.push(item);

        let message = `Added ${item.item} to Cart`;
        this.notification.createNotification(message);
      }
    },
    incrementItemQuantity(item) {
      const itemIndex = this.cart.findIndex((obj) => obj.item === item.item);
      const itemIndexExists = itemIndex !== -1;
      const posProfile = this.invoiceData.posProfile;
      let previousOrderItem = this.table.previousOrderdItem;
      // Check if item exists in previous orders
      const previousItem = previousOrderItem.find(
        (previous_item) => previous_item.item_code === item.item
      );

      let item_qty = itemIndexExists ? this.cart[itemIndex].qty + 1 : 1;
      // If item exists in previous orders, adjust quantity
      if (previousItem) {
        item_qty -= previousItem.qty;
      }
      if (itemIndexExists) {
        item.comment = "";
        this.cart[itemIndex].qty++;
        let message = `${item.item}'s Qty updated to ${item.qty} in Cart`;
        this.notification.createNotification(message);
      } else {
        item.comment = "";
        this.cart.push({ item: item.item, qty: 1 });
      }
    },
    decrementItemQuantity(item) {
      const itemIndex = this.cart.findIndex((obj) => obj.item === item.item);
      const itemIndexExists = itemIndex !== -1;
      if (itemIndexExists) {
        this.cart[itemIndex].qty--;
        this.cart = this.cart.filter((obj) => obj.qty > 0);
        let message =
          item.qty > 0
            ? `${item.item}'s Qty Reduced from Cart Total Qty=${item.qty}`
            : `${item.item} has been removed from Cart`;
        this.notification.createNotification(message);
      }
    },
    removeItemFromCart(index) {
      // Get the item that corresponds to the index
      const item = this.cart[index];
      // Set the item's quantity to zero
      item.qty = 0;
      this.cart.splice(index, 1);
    },
  },
});
