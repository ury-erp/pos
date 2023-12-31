import { defineStore } from "pinia";
import { useInvoiceDataStore } from "./invoiceData.js";
import { useTableStore } from "./Table.js";
import { useNotifications } from "./Notification.js";
import frappe from "./frappeSdk.js";

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
    notification: useNotifications(),
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
        console;
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
  },
  actions: {
    fetchItems() {
      this.call
        .get("ury.ury_pos.api.getRestaurantMenu")
        .then((result) => {
          this.items = result.message;
          this.items.forEach((menuItem) => {
            if (menuItem.special_dish == 1) {
              this.showPriority = true;
            }
          });
        })
        .catch((error) => {
          console.error(error);
        });
    },
    updateSearchTerm() {
      this.currentPage = 1;
    },
    handleSearchInput(event) {
      this.searchTerm = event.target.value;
      this.updateSearchTerm();
    },
    clearSearch(event) {
      event.target.value=""
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
      if (!item.qty) {
        this.$set(item, "qty", this.quantity);
      } else {
        item.qty = this.quantity;
        item.comment = this.itemComments;
      }
      this.showDialog = false;
    },
    getitemQty(item) {
      item.qty = this.cart.qty;
    },
    addToCart(item) {
      const itemIndex = this.cart.findIndex((obj) => obj.item === item.item);
      const itemIndexExists = itemIndex !== -1;
      const invoiceData = useInvoiceDataStore();
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
      const invoiceData = useInvoiceDataStore();
      const posProfile = invoiceData.posProfile;
      const table = useTableStore();
      let previousOrderItem = table.previousOrderdItem;
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
