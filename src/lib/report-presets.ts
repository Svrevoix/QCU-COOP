export type ReportPreset = {
	description: string;
	columns: string[];
	rows: string[][];
	metricLabel: string;
	metricValue: string;
	rowCount: string;
	highlightColumn: number;
	numericLastColumn: boolean;
};

const preset = (description: string, columns: string, rows: string, metricLabel: string, metricValue: string, rowCount: string): ReportPreset => ({
	description,
	columns: columns.split('|'),
	rows: rows.split('\n').map((row) => row.split('|')),
	metricLabel,
	metricValue,
	rowCount,
	highlightColumn: columns.split('|').findIndex((column) => /sku|reference|receipt|transaction|voucher|po number/i.test(column)),
	numericLastColumn: /amount|sales|revenue|total|cost|balance|variance|quantity|units|available|share|change|price/i.test(columns.split('|')[columns.split('|').length - 1] ?? '')
});

export const reportPresets: Record<string, ReportPreset> = {
	'Daily Cashier Cash-Out': preset('Reconcile cashier collections and cash variance.', 'Cashier|Transactions|Payment method|Cash collected|Variance', 'Maria Santos|48|Cash|₱24,650.00|₱0.00\nJ. Dela Cruz|36|Cash|₱17,030.00|₱50.00\nR. Manalo|29|Cash|₱12,960.00|₱0.00', 'Cash collected', '₱54,640', '12 cashiers'),
	'Weekly Summary': preset('Track weekly sales, discounts, and net revenue.', 'Week|Transactions|Gross sales|Discounts|Net sales', 'Sep 01–07|612|₱98,420.00|₱4,180.00|₱94,240.00\nSep 08–14|584|₱91,260.00|₱3,820.00|₱87,440.00\nSep 15–21|691|₱108,940.00|₱5,240.00|₱103,700.00', 'Net sales', '₱285,380', '4 weeks'),
	'Monthly Summary': preset('Review monthly transaction volume and net cooperative sales.', 'Month|Transactions|Gross sales|Discounts|Net sales', 'July 2026|2,148|₱316,420.00|₱12,180.00|₱304,240.00\nAugust 2026|2,306|₱338,610.00|₱13,740.00|₱324,870.00\nSeptember 2026|1,887|₱284,620.00|₱11,240.00|₱273,380.00', 'Net sales', '₱902,490', '12 months'),
	'Detailed Sales Report': preset('Inspect individual posted sales transactions and their cash payments.', 'Date|Receipt|Customer|Payment method|Amount', '15 Sep 2026|TX-10482|Maria Santos|Cash|₱1,245.00\n16 Sep 2026|TX-10491|J. Dela Cruz|Cash|₱350.00\n18 Sep 2026|TX-10519|R. Manalo|Cash|₱2,180.00', 'Gross sales', '₱284,620', '1,846 sales'),
	'Detailed Sales by Item': preset('Break down posted sales by item, quantity, and selling price.', 'Date|SKU|Product|Qty|Unit price|Total', '15 Sep 2026|QCU-ID-01|QCU ID Lace|5|₱249.00|₱1,245.00\n16 Sep 2026|STY-PEN-02|Ballpen set · 10 pcs|2|₱175.00|₱350.00\n18 Sep 2026|BND-FAC-01|Faculty essentials bundle|4|₱545.00|₱2,180.00', 'Items sold', '1,846 units', '4,862 lines'),
	'Summarized Sales': preset('Compare sales totals by product category.', 'Category|Transactions|Units sold|Net sales|Share', 'School supplies|812|1,240|₱104,820.00|36.8%\nQCU merchandise|604|782|₱96,410.00|33.9%\nPrinting services|471|—|₱53,860.00|18.9%', 'Net sales', '₱284,620', '8 categories'),
	'Monthly Sales Analysis': preset('Compare monthly sales performance and month-over-month change.', 'Month|Gross sales|Net sales|Transactions|Change', 'July 2026|₱316,420|₱304,240|2,148|+4.2%\nAugust 2026|₱338,610|₱324,870|2,306|+6.8%\nSeptember 2026|₱284,620|₱273,380|1,887|−15.9%', 'Average monthly sales', '₱313,217', '12 months'),
	'Annual Sales Analysis': preset('Review yearly sales totals, transaction counts, and annual growth.', 'Year|Transactions|Gross sales|Net sales|Annual change', '2024|21,840|₱3,184,200|₱3,066,480|—\n2025|25,610|₱3,842,500|₱3,701,200|+20.7%\n2026 YTD|18,462|₱2,946,800|₱2,832,140|+15.8%', '2026 net sales', '₱2.83M', '3 years'),
	'Daily Product Analysis': preset('Compare daily product movement, sales, and remaining stock.', 'Product|SKU|Units sold|Sales|On hand', 'QCU ID Lace|QCU-ID-01|42|₱10,458.00|86\nBallpen set · 10 pcs|STY-PEN-02|35|₱6,125.00|120\nFaculty essentials bundle|BND-FAC-01|18|₱9,810.00|24', 'Units moved', '1,846', '126 products'),
	'Best-Selling Products': preset('Rank products by units sold and revenue for the selected period.', 'Rank|Product|SKU|Units sold|Revenue', '01|QCU ID Lace|QCU-ID-01|428|₱106,844.00\n02|Ballpen set · 10 pcs|STY-PEN-02|362|₱63,350.00\n03|Faculty essentials bundle|BND-FAC-01|214|₱116,630.00', 'Top units sold', '428 units', '126 products'),
	'Inventory Balance Report': preset('View current stock balances by item and warehouse.', 'SKU|Product|Warehouse|On hand|Reserved|Available', 'QCU-ID-01|QCU ID Lace|Main warehouse|86|4|82\nSTY-PEN-02|Ballpen set · 10 pcs|Retail floor|120|12|108\nBND-FAC-01|Faculty essentials bundle|North storage|24|2|22', 'Units on hand', '12,480', '1,284 SKUs'),
	'Inventory Cost by Item': preset('Review inventory valuation using recorded unit costs.', 'SKU|Product|Quantity|Unit cost|Total cost', 'QCU-ID-01|QCU ID Lace|86|₱118.00|₱10,148.00\nSTY-PEN-02|Ballpen set · 10 pcs|120|₱72.50|₱8,700.00\nBND-FAC-01|Faculty essentials bundle|24|₱310.00|₱7,440.00', 'Inventory value', '₱1,284,620', '1,284 SKUs'),
	'Inventory Movement Report': preset('Track stock movements, references, and movement quantities.', 'Date|Reference|SKU|Movement|Quantity', '22 Sep 2026|RCV-02184|QCU-ID-01|Receiving|+48\n21 Sep 2026|TX-10548|STY-PEN-02|Sale|−10\n20 Sep 2026|ADJ-00142|BND-FAC-01|Adjustment|+2', 'Net movement', '+1,846 units', '682 movements'),
	'Stock Level Report': preset('Compare available quantity with each item’s reorder level.', 'SKU|Product|On hand|Reorder level|Status', 'QCU-ID-01|QCU ID Lace|86|30|In stock\nSTY-PEN-02|Ballpen set · 10 pcs|120|50|In stock\nBND-FAC-01|Faculty essentials bundle|24|30|Reorder', 'Items below reorder', '18', '1,284 SKUs'),
	'Detailed Receiving by Item': preset('Inspect received quantities and supplier costs by purchase order.', 'Received|PO number|Supplier|Product|Qty|Unit cost', '22 Sep 2026|PO-00814|QCU Supply Partners|QCU ID Lace|48|₱118.00\n19 Sep 2026|PO-00809|Metro School Goods|Ballpen set · 10 pcs|100|₱72.50\n17 Sep 2026|PO-00802|Campus Print Hub|Faculty essentials bundle|12|₱310.00', 'Units received', '2,418', '86 receipts'),
	'Product Alert Report': preset('Prioritize low-stock, out-of-stock, and expiring product alerts.', 'Alert|SKU|Product|On hand|Reorder level', 'Low stock|BND-FAC-01|Faculty essentials bundle|24|30\nOut of stock|QCU-MUG-04|QCU ceramic mug|0|20\nLow stock|NOTE-A5-03|QCU A5 notebook|8|25', 'Open alerts', '18', '18 products'),
	'Slow-Moving Products': preset('Find products with low sales velocity and long periods since last sale.', 'SKU|Product|Last sold|Days idle|Units (30d)|On hand', 'QCU-MUG-04|QCU ceramic mug|02 Aug 2026|51|2|38\nBND-FAC-01|Faculty essentials bundle|12 Aug 2026|41|4|24\nBAG-QCU-02|QCU canvas tote|18 Aug 2026|35|5|42', 'Slow-moving items', '24', '24 products'),
	'Audit Trail Logs': preset('Review administrative actions and their recorded outcomes.', 'Timestamp|User|Action|Module|Reference|Result', '22 Sep 2026 09:42|Maria Santos|Updated stock|Inventory|QCU-ID-01|Success\n22 Sep 2026 09:18|J. Dela Cruz|Posted sale|POS|TX-10548|Success\n21 Sep 2026 16:05|R. Manalo|Changed price|Products|STY-PEN-02|Success', 'Logged actions', '1,284', '1,284 events'),
	'Variance Report': preset('Compare system quantities with physical counts and adjustments.', 'Count date|SKU|Product|System|Physical|Variance', '22 Sep 2026|QCU-ID-01|QCU ID Lace|86|85|−1\n21 Sep 2026|STY-PEN-02|Ballpen set · 10 pcs|120|120|0\n20 Sep 2026|BND-FAC-01|Faculty essentials bundle|24|22|−2', 'Unresolved variance', '18 units', '42 counts'),
	'Paid Out Logs': preset('Audit petty cash and other approved cash paid-out transactions.', 'Date|Voucher|Authorized by|Reason|Payment method|Amount', '22 Sep 2026|PO-00482|Maria Santos|Delivery expense|Cash|₱850.00\n20 Sep 2026|PO-00479|R. Manalo|Store supplies|Cash|₱1,240.00\n18 Sep 2026|PO-00474|J. Dela Cruz|Equipment repair|Cash|₱2,100.00', 'Paid out total', '₱18,640', '26 vouchers'),
	'Historical Posted Transactions': preset('Search the archive of posted transactions across sales channels.', 'Posted at|Transaction|Source|Operator|Status|Amount', '22 Sep 2026|TX-10548|Retail floor|L. Cruz|Posted|₱653.00\n20 Sep 2026|TX-10534|Printing services|Maria Santos|Posted|₱480.50\n18 Sep 2026|TX-10519|Online store|R. Manalo|Posted|₱2,180.00', 'Posted transactions', '4,862', '4,862 records'),
	'Dynamic Price Lists': preset('Review active product prices and their effective date ranges.', 'SKU|Product|Price tier|Current price|Effective from|Status', 'QCU-ID-01|QCU ID Lace|Member|₱224.10|01 Sep 2026|Active\nSTY-PEN-02|Ballpen set · 10 pcs|Standard|₱175.00|01 Sep 2026|Active\nBND-FAC-01|Faculty essentials bundle|Member|₱490.50|15 Aug 2026|Active', 'Active price rules', '248', '248 products')
};
