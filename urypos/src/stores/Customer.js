import { defineStore } from "pinia";
import { useTableStore } from "./Table.js";
import { useNotifications } from "./Notification.js";
import frappe from "./frappeSdk.js";
import { useAlert } from "./Alert.js";
export const useCustomerStore = defineStore("customers", {
  state: () => ({
    customer: [],
    notification: useNotifications(),
    search: "",
    alert: useAlert(),
    showCustomers: false,
    showOrderType: false,
    numberOfPax: "",
    selectedCustomerName: "",
    selectedOrderType: "",
    customerFavouriteItems: [],
    showModalNewCustomer: false,
    newCustomerMobileNo: "",
    newCustomer: "",
    orderType: [],
    showCustomersGroup: false,
    showCustomersTerritory: false,
    showAddNewCustomer: true,
    customerTerritoryList: [],
    customerTerritory: null,
    customerGroupList: [],
    customerGroup: null,
    call: frappe.call(),
    db: frappe.db(),
  }),
  getters: {
    isFlagSet() {
      return this.customer.length === 0;
    },
  },
  actions: {
    async pickCustomer() {
      const searchParams = {
        text: this.search,
        doctype: "Customer",
        limit: 5,
      };

      this.call
        .get("frappe.utils.global_search.search", searchParams)
        .then((result) => {
          this.customer = result.message;
        })
        .catch((error) => console.error(error));
    },
    handleSearchInput(event) {
      this.search = event.target.value;
      this.pickCustomer();
    },
    pickCustomerGroup() {
      this.db
        .getDocList("Customer Group")
        .then((docs) => {
          this.customerGroupList = docs;
        })
        .catch((error) => console.error(error));
    },
    selectCustomerGroup(group) {
      this.customerGroup = group.name;
      this.showCustomersGroup = false;
    },
    pickCustomerTerritory() {
      this.db
        .getDocList("Territory")
        .then((docs) => {
          this.customerTerritoryList = docs;
        })
        .catch((error) => console.error(error));
    },
    selectCustomerTerritory(group) {
      this.customerTerritory = group.name;
      this.showCustomersTerritory = false;
    },
    newCustomerData(name) {
      this.showModalNewCustomer = true;
      if (!isNaN(parseFloat(name)) && isFinite(name)) {
        this.newCustomerMobileNo = name;
      } else if (typeof name === "string") {
        this.newCustomer = name;
      } else {
        this.alert.createAlert("Message", "Invalid Customer", "OK");
      }
    },

    addNewCustomer: async function () {
      if (!this.newCustomer || !this.newCustomerMobileNo) {
        let missingFields = [];
        if (!this.newCustomer) {
          missingFields.push("Customer Name");
        }
        if (!this.newCustomerMobileNo) {
          missingFields.push("Mobile Number");
        }
        if (!this.customerGroup) {
          missingFields.push("Customer Group");
        }
        if (!this.customerTerritory) {
          missingFields.push("Territory");
        }
        const missingFieldsMessage =
          "Following fields have missing values: " + missingFields.join(", ");
        this.alert.createAlert("Message", missingFieldsMessage, "OK");
      } else {
        this.showAddNewCustomer = false;
        const db = frappe.db();
        db.createDoc("Customer", {
          customer_name: this.newCustomer,
          mobile_number: this.newCustomerMobileNo.toString(),
          customer_group: this.customerGroup,
          territory: this.customerTerritory,
        })
          .then((doc) => {
            this.search = doc.name;
            this.notification.createNotification("New Customer Created");
            this.showModalNewCustomer = false;
          })
          .catch((error) => {
            const serverMessages = JSON.parse(error._server_messages);
            const messageObject = JSON.parse(serverMessages[0]);
            const message = messageObject.message;
            this.alert.createAlert("Message", message, "OK");
          });
      }
    },
    extractName(content) {
      if (content) {
        const mobileStartIndex = content.indexOf("Mobile Number :");
        if (mobileStartIndex !== -1) {
          const mobileEndIndex = content.indexOf("|||", mobileStartIndex);
          if (mobileEndIndex !== -1) {
            const mobileNumber = content
              .substring(mobileStartIndex, mobileEndIndex)
              .trim();

            return mobileNumber;
          }
        }
      }
      return "";
    },
    async selectCustomer(customer) {
      this.search = customer.name;
      this.showCustomers = false;
      this.fectchCustomerFavouriteItem();
    },
    pickOrderType() {
      this.showOrderType = true;
      this.call
        .get("ury.ury_pos.api.get_select_field_options")
        .then((result) => {
          this.orderType = result.message.filter(
            (option) => option.name !== ""
          );
        })
        .catch((error) => console.error(error));
    },
    selectOrderType(orderType) {
      this.showOrderType = false;
      if (orderType.name === "Dine In") {
        this.alert.createAlert(
          "Message",
          "Dine in is not permitted for takeaway orders.",
          "OK"
        );
      } else {
        this.selectedOrderType = orderType.name;
      }
    },
    async fectchCustomerFavouriteItem() {
      const table = useTableStore();
      if (table.previousOrderdCustomer) {
        this.selectedCustomerName = table.previousOrderdCustomer;
      } else {
        this.selectedCustomerName = this.search;
      }

      const searchParams = {
        customer_name: this.selectedCustomerName,
      };

      this.call
        .get(
          "ury.ury.doctype.ury_order.ury_order.customer_favourite_item",
          searchParams
        )
        .then((result) => {
          this.customerFavouriteItems = [];
          result.message.forEach((item) => {
            this.customerFavouriteItems.push(item);
          });
        })
        .catch((error) => console.error(error));
    },
  },
});
