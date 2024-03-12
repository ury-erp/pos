URY POS Setup:

- URY POS follows the same configurations as URY.
- Refer to the [URY Setup](https://github.com/ury-erp/ury/blob/main/SETUP.md) for basic configuration details.

- To access URY POS:
   - Navigate to `/urypos/Table`
   
- Customer Search:
   - frappe.utils.global_search is used for customer searching ,you have to run the following commands for building search index

   ```
   $ bench --site site-name build-search-index 
   ```

   and

   ```
   $ bench --site site-name rebuild-global-search 
   ```

