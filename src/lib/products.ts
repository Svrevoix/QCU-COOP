export type ProductVariant = {
	sku: string;
	price: number;
};

export interface Product {
	id: string;
	name: string;
	image?: string;
	images?: string[];
	price?: number;
	sku: string;
	variants?: ProductVariant[];
	category: ProductCategory;
	lowStock?: boolean;
}

export type ProductCategory =
	| 'supplies'
	| 'uniforms'
	| 'merchandise'
	| 'food'
	| 'care'
	| 'bags'
	| 'textbooks'
	| 'operations';

type CategoryDefinition = {
	category: ProductCategory;
	prefix: string;
	items: (string | { name: string; price: number })[];
};

const productVariants: Record<string, ProductVariant[]> = {
	'Ballpen (Black)': [{ sku: 'IT00001', price: 10 }], 'Ballpen (Blue)': [{ sku: 'IT00002', price: 10 }],
	'Ballpen (Gel Ink)': [{ sku: 'IT00003', price: 25 }], 'Ballpen (Red)': [{ sku: 'IT00004', price: 10 }],
	'Ballpen (Sign Pen)': [{ sku: 'IT00180', price: 15 }], Eraser: [{ sku: 'IT00021', price: 5 }], Sharpener: [{ sku: 'IT00122', price: 10 }], Pencil: [{ sku: 'IT00116', price: 10 }],
	'Marker (Permanent)': [{ sku: 'IT00082', price: 15 }], 'Marker (Whiteboard)': [{ sku: 'IT00143', price: 25 }], Chalk: [{ sku: 'IT00147', price: 5 }],
	Tape: [{ sku: 'IT00165', price: 15 }], 'Correction Tape': [{ sku: 'IT00205', price: 20 }], 'Masking Tape': [{ sku: 'IT00207', price: 15 }], 'Double Sided Tape': [{ sku: 'IT00208', price: 25 }],
	Glue: [{ sku: 'IT00154', price: 10 }], 'Glue Stick (Small)': [{ sku: 'IT00176', price: 5 }], 'Glue Stick (Big)': [{ sku: 'IT00177', price: 10 }], 'Shoe Glue': [{ sku: 'IT00215', price: 15 }],
	'Bond Paper (A4)': [{ sku: 'IT00007', price: 1 }], 'Bond Paper (Long)': [{ sku: 'IT00008', price: 1 }], 'Bond Paper (Short)': [{ sku: 'IT00009', price: 1 }], 'Bond Paper Ream (A4)': [{ sku: 'IT00010', price: 220 }], 'Bond Paper Ream (Long)': [{ sku: 'IT00011', price: 340 }], 'Bond Paper Ream (Short)': [{ sku: 'IT00012', price: 230 }],
	Cartolina: [{ sku: 'IT00209', price: 15 }], 'Colored Paper (3PHP, 2PCS)': [{ sku: 'IT00153', price: 3 }], 'Graphing Paper': [{ sku: 'IT00190', price: 3 }],
	'Index Card (1/1)': [{ sku: 'IT00056', price: 4 }], 'Index Card (1/4)': [{ sku: 'IT00057', price: 2 }], 'Index Card (1/8)': [{ sku: 'IT00058', price: 1 }],
	'Manila Paper': [{ sku: 'IT00142', price: 10 }], 'Yellow Pad (Long Plastic)': [{ sku: 'IT00129', price: 1 }], 'Yellow Pad (One Whole)': [{ sku: 'IT00130', price: 50 }], 'Yellow Pad (Per Pcs)': [{ sku: 'IT00130', price: 1 }], 'Yellow Pad (Short Plastic)': [{ sku: 'IT00130', price: 1 }],
	'Folder (Colored Long)': [{ sku: 'IT00040', price: 12 }], 'Folder (Colored Short)': [{ sku: 'IT00041', price: 10 }], 'Folder (Long Cover)': [{ sku: 'IT00196', price: 15 }], 'Folder (Long)': [{ sku: 'IT00197', price: 17 }],
	'Folder (Plastic Cover Long)': [{ sku: 'IT00200', price: 12 }], 'Folder (Plastic Cover Short)': [{ sku: 'IT00201', price: 17 }], 'Folder (Short Cover)': [{ sku: 'IT00213', price: 17 }], 'Folder (Short)': [{ sku: 'IT00214', price: 12 }],
	'Long Brown Envelope': [{ sku: 'IT00013', price: 15 }], 'Short Brown Envelope': [{ sku: 'IT00158', price: 10 }], 'Plastic Envelope (Short)': [{ sku: 'IT00141', price: 12 }], 'Plastic Envelope (Long)': [{ sku: 'IT00140', price: 17 }], 'Mailing Envelope': [{ sku: 'IT00064', price: 5 }], 'Binder Clips': [{ sku: 'IT00006', price: 5 }], 'Binder Clips (Large)': [{ sku: 'IT00202', price: 10 }], 'Paper Clip': [{ sku: 'IT00110', price: 1 }], 'Paper Clip (Large)': [{ sku: 'IT00111', price: 1 }], 'Paper Fastener': [{ sku: 'IT00114', price: 2 }], Thumbtacks: [{ sku: 'IT00195', price: 1 }],
	'1/8 Illustration Board': [{ sku: 'IT00151', price: 12 }], '1/4 Illustration Board': [{ sku: 'IT00152', price: 20 }], '1/4 Illustration Board (Alternative)': [{ sku: 'IT00191', price: 20 }], Protractor: [{ sku: 'IT00212', price: 10 }], Ruler: [{ sku: 'IT00204', price: 15 }], Scissors: [{ sku: 'IT00206', price: 20 }], 'Filler Notebook': [{ sku: 'IT00192', price: 20 }],
	'CBAA T-Shirt (XS, S, M, L, XL, 2XL, 3XL)': [
		{ sku: 'IT00020', price: 300 }, { sku: 'IT00018', price: 300 }, { sku: 'IT00017', price: 300 },
		{ sku: 'IT00016', price: 300 }, { sku: 'IT00019', price: 300 }, { sku: 'IT00014', price: 300 },
		{ sku: 'IT00015', price: 300 }
	],
	'JPIA T-Shirt (XS, S, M, L, XL, 2XL)': [
		{ sku: 'IT00063', price: 350 }, { sku: 'IT00061', price: 350 }, { sku: 'IT00060', price: 350 },
		{ sku: 'IT00059', price: 350 }, { sku: 'IT00062', price: 350 }, { sku: 'IT00194', price: 370 }
	],
	'Female Blouse (XS, S, M, L, XL, 2XL, 3XL, 4XL, 5XL)': [
		{ sku: 'IT00031', price: 485 }, { sku: 'IT00029', price: 485 }, { sku: 'IT00028', price: 485 },
		{ sku: 'IT00027', price: 485 }, { sku: 'IT00030', price: 500 }, { sku: 'IT00023', price: 540 },
		{ sku: 'IT00024', price: 565 }, { sku: 'IT00025', price: 565 }, { sku: 'IT00026', price: 565 }
	],
	'Female Slacks (XS, S, M, L, XL, 2XL, 3XL, 4XL)': [
		{ sku: 'IT00039', price: 585 }, { sku: 'IT00037', price: 585 }, { sku: 'IT00036', price: 585 },
		{ sku: 'IT00035', price: 585 }, { sku: 'IT00038', price: 595 }, { sku: 'IT00032', price: 605 },
		{ sku: 'IT00033', price: 615 }, { sku: 'IT00034', price: 625 }
	],
	'Male Polo (XS, S, M, L, XL, 2XL, 3XL, 4XL)': [
		{ sku: 'IT00081', price: 490 }, { sku: 'IT00079', price: 490 }, { sku: 'IT00078', price: 490 },
		{ sku: 'IT00077', price: 490 }, { sku: 'IT00080', price: 505 }, { sku: 'IT00074', price: 540 },
		{ sku: 'IT00075', price: 570 }, { sku: 'IT00076', price: 580 }
	],
	'Male Pants (XS, S, M, L, XL, 2XL, 3XL, 4XL, 5XL)': [
		{ sku: 'IT00073', price: 590 }, { sku: 'IT00071', price: 590 }, { sku: 'IT00070', price: 590 },
		{ sku: 'IT00069', price: 590 }, { sku: 'IT00072', price: 600 }, { sku: 'IT00065', price: 610 },
		{ sku: 'IT00066', price: 630 }, { sku: 'IT00067', price: 630 }, { sku: 'IT00068', price: 630 }
	],
	'P.E. T-Shirt (XS, S, M, L, XL, 2XL, 3XL, 4XL, 5XL)': [{ sku: 'IT00108', price: 265 }, { sku: 'IT00106', price: 265 }, { sku: 'IT00105', price: 265 }, { sku: 'IT00104', price: 265 }, { sku: 'IT00107', price: 275 }, { sku: 'IT00100', price: 285 }, { sku: 'IT00101', price: 295 }, { sku: 'IT00102', price: 305 }, { sku: 'IT00103', price: 305 }],
	'P.E. Pants (XS, S, M, L, XL, 2XL, 3XL, 4XL, 5XL)': [{ sku: 'IT00099', price: 385 }, { sku: 'IT00097', price: 385 }, { sku: 'IT00096', price: 385 }, { sku: 'IT00095', price: 390 }, { sku: 'IT00098', price: 390 }, { sku: 'IT00091', price: 400 }, { sku: 'IT00092', price: 405 }, { sku: 'IT00093', price: 410 }, { sku: 'IT00094', price: 405 }],
	'NSTP T-Shirt (XS, S, M, L, XL, 2XL, 3XL, 4XL, 5XL)': [{ sku: 'IT00090', price: 265 }, { sku: 'IT00088', price: 265 }, { sku: 'IT00087', price: 265 }, { sku: 'IT00086', price: 265 }, { sku: 'IT00089', price: 275 }, { sku: 'IT00083', price: 285 }, { sku: 'IT00084', price: 295 }, { sku: 'IT00085', price: 305 }, { sku: 'IT00085a', price: 305 }],
	'QCU Jacket': [{ sku: 'IT00117', price: 600 }], 'QCPU Jacket': [{ sku: 'IT00120', price: 500 }], 'QCU Umbrella': [{ sku: 'IT00118', price: 170 }], 'Thermal Bottle with Holder': [{ sku: 'IT00166', price: 250 }], 'Thermal Bottle without Holder': [{ sku: 'IT00167', price: 230 }],
	'ID Lace Case (Landscape)': [{ sku: 'IT00054', price: 25 }], 'ID Lace Case (Portrait)': [{ sku: 'IT00055', price: 25 }], 'Lanyard (Admin)': [{ sku: 'IT00045', price: 85 }], 'Lanyard (Faculty)': [{ sku: 'IT00050', price: 85 }], 'Lanyard (BS Accountancy)': [{ sku: 'IT00046', price: 85 }], 'Lanyard (BS Computer Engineering)': [{ sku: 'IT00170', price: 85 }], 'Lanyard (BS Computer Science)': [{ sku: 'IT00171', price: 85 }], 'Lanyard (BS Education)': [{ sku: 'IT00048', price: 85 }], 'Lanyard (BS Electrical Engineering)': [{ sku: 'IT00232', price: 85 }], 'Lanyard (BS Electronics Engineering)': [{ sku: 'IT00047', price: 85 }], 'Lanyard (BS Entrep)': [{ sku: 'IT00049', price: 85 }], 'Lanyard (BS Industrial Engineering)': [{ sku: 'IT00051', price: 85 }], 'Lanyard (BS Information System)': [{ sku: 'IT00172', price: 85 }], 'Lanyard (BS Information Technology)': [{ sku: 'IT00052', price: 85 }], 'Lanyard (BS Management in Accounting)': [{ sku: 'IT00053', price: 85 }],
	'Badge Pin (25MM)': [{ sku: 'IT00230', price: 15 }], 'Badge Pin (32MM)': [{ sku: 'IT00231', price: 20 }], 'Badge Pin (58MM)': [{ sku: 'IT00270', price: 25 }], 'Coin Purse': [{ sku: 'IT00156', price: 20 }], 'Duo Small Keychain': [{ sku: 'IT00228', price: 20 }], 'Regular Keychain': [{ sku: 'IT00229', price: 25 }], 'Big Keychain': [{ sku: 'IT00274', price: 35 }], 'San Rio': [{ sku: 'IT00119', price: 10 }], 'Sticker Pack': [{ sku: 'IT00271', price: 15 }], 'SALE QCU Jacket (New)': [{ sku: 'IT00224', price: 300 }], 'SALE QCU Jacket (Old)': [{ sku: 'IT00223', price: 250 }], 'SALE QCU Umbrella': [{ sku: 'IT00225', price: 85 }],
	'Coke Kasalo': [{ sku: 'IT00150', price: 40 }], 'Coke Soda': [{ sku: 'IT00136', price: 20 }], 'Fruit Soda Kasalo': [{ sku: 'IT00144', price: 40 }], 'Mt. Dew Kasalo': [{ sku: 'IT00132', price: 40 }], 'Mt. Dew Soda': [{ sku: 'IT00139', price: 20 }], 'Pepsi Soda': [{ sku: 'IT00133', price: 20 }], 'RC Soda': [{ sku: 'IT00137', price: 20 }], 'Rootbeer Soda': [{ sku: 'IT00138', price: 20 }], 'Royal Grapes in Can': [{ sku: 'IT00182', price: 40 }], 'Royal Kasalo': [{ sku: 'IT00164', price: 40 }], 'Royal Soda': [{ sku: 'IT00135', price: 20 }], 'Sprite Soda': [{ sku: 'IT00134', price: 20 }], 'Chuckie Chocolate': [{ sku: 'IT00184', price: 25 }], 'Nutriboost Strawberry': [{ sku: 'IT00183', price: 30 }], 'Nutrifizz Sparkling Drink': [{ sku: 'IT00189', price: 40 }], 'Pocari Sweat': [{ sku: 'IT00226', price: 25 }], Tropicana: [{ sku: 'IT00155', price: 22 }], 'Vida Sparkling Drink': [{ sku: 'IT00188', price: 40 }], Vitamilk: [{ sku: 'IT00145', price: 22 }], Deedoo: [{ sku: 'IT00227', price: 15 }], 'Richeese Creamy Cheese': [{ sku: 'IT00219', price: 15 }], 'Richoco Chocolate': [{ sku: 'IT00216', price: 15 }], 'Richoco Cookies and Cream': [{ sku: 'IT00218', price: 15 }], 'Richoco Milk Vanilla': [{ sku: 'IT00217', price: 15 }],
	'Paper Bowl (390CC)': [{ sku: 'IT00109', price: 265 }], 'Paper Cups (12oz)': [{ sku: 'IT00173', price: 0 }], 'Paper Cups (520CC)': [{ sku: 'IT00112', price: 65 }], 'Paper Cups (8oz)': [{ sku: 'IT00113', price: 48 }], 'Paper Plate': [{ sku: 'IT00115', price: 30 }], 'Siomai Plate': [{ sku: 'IT00123', price: 28 }], Toothpick: [{ sku: 'IT00124', price: 10 }], 'Wooden Fork': [{ sku: 'IT00126', price: 28 }], 'Wooden Spoon': [{ sku: 'IT00127', price: 28 }], 'Wooden Spoon & Fork': [{ sku: 'IT00128', price: 28 }],
	Alcohol: [{ sku: 'IT00185', price: 25 }], "Johnson's Baby Powder": [{ sku: 'IT00186', price: 30 }], Hairnet: [{ sku: 'IT00175', price: 10 }], Napkin: [{ sku: 'IT00203', price: 10 }], 'Rexona Deo': [{ sku: 'IT00178', price: 7 }], 'Safeguard Bar Lemon': [{ sku: 'IT00187', price: 30 }], Tissue: [{ sku: 'IT00146', price: 15 }], Toothbrush: [{ sku: 'IT00174', price: 25 }], Toothpaste: [{ sku: 'IT00179', price: 8 }], 'Wet Wipes': [{ sku: 'IT00125', price: 20 }], 'Band Aid with Cotton Balls': [{ sku: 'IT00005', price: 3 }], Facemask: [{ sku: 'IT00022', price: 10 }], 'Dishwashing Liquid': [{ sku: 'IT00163', price: 135 }], Sponge: [{ sku: 'IT00193', price: 15 }],
	'Eco Bag (Large)': [{ sku: 'IT00173', price: 10 }], 'Eco Bag (Small)': [{ sku: 'IT00272', price: 20 }], 'Fashion Pin (Large)': [{ sku: 'IT00198', price: 10 }], 'Fashion Pin (Medium)': [{ sku: 'IT00199', price: 15 }], 'Flower Hair Clip': [{ sku: 'IT00273', price: 15 }], 'Hair Clip (Large)': [{ sku: 'IT00042', price: 25 }], 'Hair Clip (Regular)': [{ sku: 'IT00043', price: 10 }], 'Hair Clip (Small)': [{ sku: 'IT00044', price: 5 }], Lunchbox: [{ sku: 'IT00162', price: 200 }], 'Pardible with Design': [{ sku: 'IT00211', price: 10 }], Pardible: [{ sku: 'IT00210', price: 2 }],
	'CFAS: Conceptual Framework and Accounting Standards': [{ sku: 'IT00221', price: 550 }], 'FAR: Financial Accounting and Reporting': [{ sku: 'IT00220', price: 450 }], 'IA: Intermediate Accounting': [{ sku: 'IT00222', price: 750 }],
	'Regular Loan 1': [{ sku: 'IT00161', price: 1 }], 'Regular Loan 5': [{ sku: 'IT00160', price: 5 }], 'Regular Loan 50': [{ sku: 'IT00159', price: 50 }], 'Regular Loan 1000': [{ sku: 'IT00157', price: 1000 }], 'Canteen Stall Rental': [{ sku: 'IT00131', price: 400 }], 'Canteen Stall Rental - Half Day': [{ sku: 'IT00148', price: 200 }], 'Membership Fee': [{ sku: 'IT00168', price: 500 }], 'Service Charge for Reprint Receipt': [{ sku: 'IT00121', price: 25 }], 'Space Rental': [{ sku: 'IT00149', price: 100 }], 'Subscription Fee - QCU Coop': [{ sku: 'IT00169', price: 4000 }], 'Uniform Additional Fee': [{ sku: 'IT00181', price: 10 }]
};

const categoryDefinitions: CategoryDefinition[] = [
	{
		category: 'supplies',
		prefix: 'SUP',
		items: [
			'Ballpen (Black)', 'Ballpen (Blue)', 'Ballpen (Gel Ink)', 'Ballpen (Red)', 'Ballpen (Sign Pen)', 'Pencil',
			'Eraser', 'Sharpener', 'Marker (Permanent)', 'Marker (Whiteboard)', 'Chalk', 'Tape', 'Correction Tape',
			'Masking Tape', 'Double Sided Tape', 'Glue', 'Glue Stick (Big)', 'Glue Stick (Small)', 'Shoe Glue',
			'Bond Paper (A4)', 'Bond Paper (Long)', 'Bond Paper (Short)', 'Bond Paper Ream (A4)', 'Bond Paper Ream (Long)', 'Bond Paper Ream (Short)', 'Cartolina', 'Colored Paper (3PHP, 2PCS)',
			'Graphing Paper', 'Index Card (1/1)', 'Index Card (1/4)', 'Index Card (1/8)', 'Manila Paper',
			'Yellow Pad (Long Plastic)', 'Yellow Pad (One Whole)', 'Yellow Pad (Per Pcs)', 'Yellow Pad (Short Plastic)',
			'Folder (Colored Long)', 'Folder (Colored Short)', 'Folder (Long Cover)', 'Folder (Long)',
			'Folder (Plastic Cover Long)', 'Folder (Plastic Cover Short)', 'Folder (Short Cover)', 'Folder (Short)',
			'Long Brown Envelope', 'Short Brown Envelope', 'Plastic Envelope (Short)', 'Plastic Envelope (Long)', 'Mailing Envelope', 'Binder Clips', 'Binder Clips (Large)', 'Paper Clip', 'Paper Clip (Large)', 'Paper Fastener', 'Thumbtacks',
			'1/4 Illustration Board', '1/8 Illustration Board', '1/4 Illustration Board (Alternative)', 'Protractor', 'Ruler', 'Scissors', 'Filler Notebook'
		]
	},
	{
		category: 'uniforms',
		prefix: 'UNF',
		items: [
			'CBAA T-Shirt (XS, S, M, L, XL, 2XL, 3XL)', 'JPIA T-Shirt (XS, S, M, L, XL, 2XL)',
			'Female Blouse (XS, S, M, L, XL, 2XL, 3XL, 4XL, 5XL)', 'Female Slacks (XS, S, M, L, XL, 2XL, 3XL, 4XL)',
			'Male Polo (XS, S, M, L, XL, 2XL, 3XL, 4XL)', 'Male Pants (XS, S, M, L, XL, 2XL, 3XL, 4XL, 5XL)',
			'P.E. T-Shirt (XS, S, M, L, XL, 2XL, 3XL, 4XL, 5XL)', 'P.E. Pants (XS, S, M, L, XL, 2XL, 3XL, 4XL, 5XL)',
			'NSTP T-Shirt (XS, S, M, L, XL, 2XL, 3XL, 4XL, 5XL)', 'CCS (IT, IS, CS) Department Uniforms',
			'COE (ECE, IE, CE) Department Uniforms', 'COA (BSA, BSMA) Department Uniforms',
			'COB (ENTREP) Department Uniforms', 'COED (EDUC) Department Uniforms'
		]
	},
	{
		category: 'merchandise',
		prefix: 'MER',
		items: [
			'QCU Jacket', 'QCPU Jacket', 'QCU Umbrella', 'Thermal Bottle with Holder', 'Thermal Bottle without Holder',
			'ID Lace Case (Landscape)', 'ID Lace Case (Portrait)', 'Lanyard (Admin)', 'Lanyard (Faculty)',
			'Lanyard (BS Accountancy)', 'Lanyard (BS Computer Engineering)', 'Lanyard (BS Computer Science)',
			'Lanyard (BS Education)', 'Lanyard (BS Electrical Engineering)', 'Lanyard (BS Electronics Engineering)',
			'Lanyard (BS Entrep)', 'Lanyard (BS Industrial Engineering)', 'Lanyard (BS Information System)',
			'Lanyard (BS Information Technology)', 'Lanyard (BS Management in Accounting)', 'Badge Pin (25MM)',
			'Badge Pin (32MM)', 'Badge Pin (58MM)', 'Coin Purse', 'Duo Small Keychain', 'Regular Keychain',
			'Big Keychain', 'San Rio', 'Sticker Pack', 'SALE QCU Jacket (New)', 'SALE QCU Jacket (Old)', 'SALE QCU Umbrella'
		]
	},
	{
		category: 'food',
		prefix: 'FOD',
		items: [
			'Coke Kasalo', 'Coke Soda', 'Fruit Soda Kasalo', 'Mt. Dew Kasalo', 'Mt. Dew Soda', 'Pepsi Soda',
			'RC Soda', 'Rootbeer Soda', 'Royal Grapes in Can', 'Royal Kasalo', 'Royal Soda', 'Sprite Soda',
			'Chuckie Chocolate', 'Nutriboost Strawberry', 'Nutrifizz Sparkling Drink', 'Pocari Sweat', 'Tropicana',
			'Vida Sparkling Drink', 'Vitamilk', 'Deedoo', 'Richeese Creamy Cheese', 'Richoco Chocolate',
			'Richoco Cookies and Cream', 'Richoco Milk Vanilla', 'Paper Bowl (390CC)', 'Paper Cups (12oz)',
			'Paper Cups (520CC)', 'Paper Cups (8oz)', 'Paper Plate', 'Siomai Plate', 'Toothpick', 'Wooden Fork',
			'Wooden Spoon', 'Wooden Spoon & Fork'
		]
	},
	{
		category: 'care',
		prefix: 'CAR',
		items: [
			'Alcohol', "Johnson's Baby Powder", 'Hairnet', 'Napkin', 'Rexona Deo', 'Safeguard Bar Lemon', 'Tissue',
			'Toothbrush', 'Toothpaste', 'Wet Wipes', 'Band Aid with Cotton Balls', 'Facemask', 'Dishwashing Liquid', 'Sponge'
		]
	},
	{
		category: 'bags',
		prefix: 'BAG',
		items: [
			'Eco Bag (Large)', 'Eco Bag (Small)', 'Fashion Pin (Large)', 'Fashion Pin (Medium)', 'Flower Hair Clip',
			'Hair Clip (Large)', 'Hair Clip (Regular)', 'Hair Clip (Small)', 'Lunchbox', 'Pardible with Design', 'Pardible'
		]
	},
	{
		category: 'textbooks',
		prefix: 'TXT',
		items: ['CFAS: Conceptual Framework and Accounting Standards', 'FAR: Financial Accounting and Reporting', 'IA: Intermediate Accounting']
	},
	{
		category: 'operations',
		prefix: 'OPS',
		items: [
			'Regular Loan 1', 'Regular Loan 5', 'Regular Loan 50', 'Regular Loan 1000', 'Canteen Stall Rental',
			'Canteen Stall Rental - Half Day', 'Membership Fee', 'Service Charge for Reprint Receipt', 'Space Rental',
			'Subscription Fee - QCU Coop', 'Uniform Additional Fee',
			{ name: 'Annual Picture & Yearbook Package', price: 2500 }
		]
	}
];

const productImages: Record<string, string> = {
	'Badge Pin (25MM)': 'images/accessories/small_pin-removebg.webp',
	'Badge Pin (32MM)': 'images/accessories/small_pin2-removebg.webp',
	'Badge Pin (58MM)': 'images/accessories/small_pin_1_-removebg.webp',
	'Coin Purse': 'images/accessories/cinamoroll-wallet-removebg-.webp',
	'Duo Small Keychain': 'images/accessories/small_keychain-removebg.webp',
	'Regular Keychain': 'images/accessories/medium_keychain-removebg.webp',
	'Big Keychain': 'images/accessories/large-keychain-removebg.webp',
	'San Rio': 'images/accessories/sanrio-removebg.webp',
	'Flower Hair Clip': 'images/accessories/flower_pink-removebg.webp',
	'Hair Clip (Large)': 'images/accessories/butterfly-blue-removebg-preview.webp',
	'Hair Clip (Regular)': 'images/accessories/hairpins-removebg.webp',
	'Hair Clip (Small)': 'images/accessories/clips-black-removebg.webp',
	'Fashion Pin (Large)': 'images/accessories/perdibles-removebg.webp',
	'Fashion Pin (Medium)': 'images/accessories/small_pin-removebg.webp',
	'Pardible with Design': 'images/accessories/perdibles-removebg.webp',
	'Pardible': 'images/accessories/perdibles-removebg.webp',
	'Ballpen (Black)': 'images/stationaries/ballpen-black-removebg.webp',
	'Ballpen (Blue)': 'images/stationaries/ballpen-blue-removebg.webp',
	'Ballpen (Red)': 'images/stationaries/ballpen-red-removebg.webp',
	'Eraser': 'images/stationaries/eraser-white-removebg.webp',
	'Sharpener': 'images/stationaries/sharpener-removebg.webp',
	'Marker (Permanent)': 'images/stationaries/permanent_marker-black-removebg.webp',
	'Marker (Whiteboard)': 'images/stationaries/whiteboard_marker-blue-removebg.webp',
	'Chalk': 'images/stationaries/chalks-white-removebg.webp',
	'Tape': 'images/stationaries/transparent-tape-removebg.webp',
	'Correction Tape': 'images/stationaries/correction-tape-removebg.webp',
	'Glue': 'images/stationaries/glue-regular-removebg.webp',
	'Glue Stick (Small)': 'images/stationaries/glue-stick-removebg.webp',
	'Glue Stick (Big)': 'images/stationaries/glue-stick-removebg.webp',
	'Bond Paper (A4)': 'images/stationaries/a4_bond-paper-removebg.webp',
	'Bond Paper (Long)': 'images/stationaries/long_bond-paper-removebg.webp',
	'Bond Paper (Short)': 'images/stationaries/short_bond-paper-removebg.webp',
	'Manila Paper': 'images/stationaries/manila-paper-removebg.webp',
	'Folder (Colored Long)': 'images/stationaries/folder_long-removebg.webp',
	'Folder (Long Cover)': 'images/stationaries/folder_long-removebg.webp',
	'Folder (Long)': 'images/stationaries/folder_long-removebg.webp',
	'Folder (Colored Short)': 'images/stationaries/folder_short-removebg.webp',
	'Folder (Short Cover)': 'images/stationaries/folder_short-removebg.webp',
	'Folder (Short)': 'images/stationaries/folder_short-removebg.webp',
	'Long Brown Envelope': 'images/stationaries/envelope-brown-long-removebg.webp',
	'Short Brown Envelope': 'images/stationaries/envelope-brown-short-removebg.webp',
	'Plastic Envelope (Short)': 'images/stationaries/envelope_short-plastic-removebg.webp',
	'Binder Clips': 'images/stationaries/binder_clip-removebg.webp',
	'Binder Clips (Large)': 'images/stationaries/binder_clip-removebg.webp',
	'Paper Fastener': 'images/stationaries/fasteners-removebg.webp',
	'Thumbtacks': 'images/stationaries/push-pins-removebg.webp',
	'Protractor': 'images/stationaries/protractor-removebg.webp',
	'Ruler': 'images/stationaries/transparent-ruler-removebg.webp',
	'Scissors': 'images/stationaries/scissor-removebg.webp',
	'Rexona Deo': 'images/hygiene/deodorant.webp',
	'Toothbrush': 'images/hygiene/toothbrush.webp',
	'Toothpaste': 'images/hygiene/toothpaste.webp',
	'Wet Wipes': 'images/hygiene/baby-wipes.webp',
	'Band Aid with Cotton Balls': 'images/hygiene/band-aid-removebg.webp',
	'CBAA T-Shirt (XS, S, M, L, XL, 2XL, 3XL)': 'images/attires/qcu_shirt-uniform-boys.webp',
	'JPIA T-Shirt (XS, S, M, L, XL, 2XL)': 'images/attires/jpia_shirt-white-green.webp',
	'Female Blouse (XS, S, M, L, XL, 2XL, 3XL, 4XL, 5XL)': 'images/attires/qcu-uniform-girls.webp',
	'Female Slacks (XS, S, M, L, XL, 2XL, 3XL, 4XL)': 'images/attires/qcu_pants.webp',
	'Male Polo (XS, S, M, L, XL, 2XL, 3XL, 4XL)': 'images/attires/qcu_shirt-uniform-boys.webp',
	'Male Pants (XS, S, M, L, XL, 2XL, 3XL, 4XL, 5XL)': 'images/attires/qcu_pants.webp',
	'P.E. T-Shirt (XS, S, M, L, XL, 2XL, 3XL, 4XL, 5XL)': 'images/attires/pe_shirt-yellow.webp',
	'P.E. Pants (XS, S, M, L, XL, 2XL, 3XL, 4XL, 5XL)': 'images/attires/pe_pants-blue.webp',
	'NSTP T-Shirt (XS, S, M, L, XL, 2XL, 3XL, 4XL, 5XL)': 'images/attires/nstp_shirt-green.webp',
	'CCS (IT, IS, CS) Department Uniforms': 'images/attires/qcu_shirt-uniform-boys.webp',
	'COE (ECE, IE, CE) Department Uniforms': 'images/attires/qcu_shirt-uniform-boys.webp',
	'COA (BSA, BSMA) Department Uniforms': 'images/attires/qcu-uniform-girls.webp',
	'COB (ENTREP) Department Uniforms': 'images/attires/qcu_shirt-uniform-boys.webp',
	'COED (EDUC) Department Uniforms': 'images/attires/faculty-blue.webp',
	'ID Lace Case (Landscape)': 'images/lanyards/id_lace-case-landscape.webp',
	'ID Lace Case (Portrait)': 'images/lanyards/id_lace-case-portrait.webp',
	'Lanyard (Admin)': 'images/lanyards/lanyard-admin.webp',
	'Lanyard (Faculty)': 'images/lanyards/lanyard-faculty.webp',
	'Lanyard (BS Accountancy)': 'images/lanyards/lanyard-accountancy.webp',
	'Lanyard (BS Computer Engineering)': 'images/lanyards/lanyard_computer-engineering.webp',
	'Lanyard (BS Computer Science)': 'images/lanyards/lanyard_computer-science.webp',
	'Lanyard (BS Education)': 'images/lanyards/lanyard-early-childhood-education.webp',
	'Lanyard (BS Electrical Engineering)': 'images/lanyards/lanyard-electronic-engineering.webp',
	'Lanyard (BS Electronics Engineering)': 'images/lanyards/lanyard-electronic-engineering.webp',
	'Lanyard (BS Entrep)': 'images/lanyards/lanyard-entrepreneurship.webp',
	'Lanyard (BS Industrial Engineering)': 'images/lanyards/lanyard-industrial-engineering.webp',
	'Lanyard (BS Information System)': 'images/lanyards/lanyard_information-systems.webp',
	'Lanyard (BS Information Technology)': 'images/lanyards/lanyard-information-technology.webp',
	'Lanyard (BS Management in Accounting)': 'images/lanyards/lanyard-management-accountancy.webp'
};

const productImageSets: Record<string, string[]> = {
	'Badge Pin (25MM)': ['images/accessories/small_pin-removebg.webp', 'images/accessories/small_pin2-removebg.webp', 'images/accessories/small_pin_1_-removebg.webp'],
	'Coin Purse': ['images/accessories/cinamoroll-wallet-removebg-.webp', 'images/accessories/wallet-hellokitty-removebg.webp'],
	'Regular Keychain': ['images/accessories/medium_keychain-removebg.webp', 'images/accessories/medium-keychains-removebg.webp', 'images/accessories/keychain_medium-removebg.webp'],
	'Big Keychain': ['images/accessories/large-keychain-removebg.webp', 'images/accessories/large_keychain-removebg.webp'],
	'Flower Hair Clip': [
		'images/accessories/flower_blue-green-removebg.webp', 'images/accessories/flower_pink-green-removebg.webp',
		'images/accessories/flower_pink-removebg.webp', 'images/accessories/flower_red-removebg.webp',
		'images/accessories/flower_violet-removebg.webp', 'images/accessories/flower_white-pink-removebg.webp',
		'images/accessories/flower_white-removebg.webp', 'images/accessories/flower_yellow-green-removebg.webp',
		'images/accessories/flower_yellow-removebg.webp'
	],
	'Hair Clip (Large)': [
		'images/accessories/butterfly-blue-removebg-preview.webp', 'images/accessories/butterfly-pink-removebg.webp',
		'images/accessories/butterfly-violet-removebg.webp', 'images/accessories/butterfly-yellow-removebg.webp'
	],
	'Ballpen (Sign Pen)': ['images/stationaries/sign_pen-blue-removebg.webp', 'images/stationaries/sign_pen-red-removebg.webp'],
	'Filler Notebook': ['images/stationaries/notebook-1.webp', 'images/stationaries/notebook.webp'],
	Facemask: ['images/hygiene/face_mask-black-50-removebg.webp', 'images/hygiene/face_mask-white-10-removebg.webp']
};

export const productCatalog: Product[] = categoryDefinitions.flatMap(({ category, prefix, items }) =>
	items.map((item, index) => {
		const name = typeof item === 'string' ? item : item.name;
		const variants = productVariants[name];

		return {
			id: `${prefix.toLowerCase()}-${index + 1}`,
			name,
			image: productImages[name] ?? productImageSets[name]?.[0],
			images: productImageSets[name],
			sku: variants?.[0]?.sku ?? `${prefix}-${String(index + 1).padStart(3, '0')}`,
			category,
			...(variants ? { variants, price: variants[0].price } : typeof item === 'string' ? {} : { price: item.price })
		};
	})
);
