import frappe

@frappe.whitelist()
def get_latest_kot(invoice):
    kot = frappe.db.get_value(
        "URY KOT",
        {"invoice": invoice},
        "name",
        order_by="creation desc"
    )
    return kot