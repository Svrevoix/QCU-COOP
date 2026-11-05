import type { ProductCategory } from '$lib/products';

export type ProductSubcategory = {
	category: ProductCategory;
	name: string;
	tags: string[];
};

export const productSubcategories: ProductSubcategory[] = [
	{
		category: 'supplies',
		name: 'Pens & Writing Instruments',
		tags: ['Ballpen', 'Pencil', 'Eraser', 'Sharpener']
	},
	{ category: 'supplies', name: 'Markers & Chalk', tags: ['Marker', 'Chalk'] },
	{ category: 'supplies', name: 'Glues & Adhesives', tags: ['Glue'] },
	{ category: 'supplies', name: 'Tapes', tags: ['Tape'] },
	{ category: 'supplies', name: 'Sheets & Pads', tags: ['Pads', 'Papers'] },
	{ category: 'supplies', name: 'Cards & Notebooks', tags: ['Index Card', 'Filler Notebook'] },
	{ category: 'supplies', name: 'Folders & Envelopes', tags: ['Folders', 'Envelopes'] },
	{ category: 'supplies', name: 'Fasteners & Clips', tags: ['Clips', 'Fastener', 'Thumbtacks'] },
	{
		category: 'supplies',
		name: 'Measuring & Cutting Tools',
		tags: ['Ruler', 'Protractor', 'Scissors']
	},
	{ category: 'uniforms', name: 'T-Shirts (Org & Core)', tags: ['CBAA T-Shirt', 'JPIA T-Shirt'] },
	{ category: 'uniforms', name: 'Female Blouse', tags: ['Female Blouse'] },
	{ category: 'uniforms', name: 'Female Slacks', tags: ['Female Slacks'] },
	{ category: 'uniforms', name: 'Male Uniforms', tags: ['Male Polo', 'Male Pants'] },
	{ category: 'uniforms', name: 'Department Uniforms', tags: ['Uniforms'] },
	{ category: 'uniforms', name: 'P.E. Tops', tags: ['PE Tops'] },
	{ category: 'uniforms', name: 'P.E. Bottoms', tags: ['PE Bottoms'] },
	{ category: 'uniforms', name: 'NSTP Apparel', tags: ['NSTP'] },
	{
		category: 'merchandise',
		name: 'Jackets & Outerwear',
		tags: ['QCU Jacket', 'QCPU Jacket', 'SALE QCU Jacket']
	},
	{ category: 'merchandise', name: 'Weather Gear', tags: ['QCU Umbrella', 'SALE QCU Umbrella'] },
	{ category: 'merchandise', name: 'Thermal Bottles', tags: ['Thermal Bottle'] },
	{ category: 'merchandise', name: 'ID Items & Cases', tags: ['ID Lace Case'] },
	{
		category: 'merchandise',
		name: 'Lanyards (Staff & Colleges)',
		tags: [
			'Admin Staff Lanyard',
			'Faculty Staff Lanyard',
			'Accountancy Lanyard',
			'Engineering Lanyard',
			'Entrepreneurship Lanyard',
			'Computer Studies Lanyard'
		]
	},
	{ category: 'merchandise', name: 'Keychains & Pins', tags: ['Keychain', 'Badge Pin'] },
	{
		category: 'merchandise',
		name: 'Novelties & Stickers',
		tags: ['San Rio', 'Sticker Pack', 'Coin Purse']
	},
	{ category: 'food', name: 'Sodas', tags: ['Soda', 'Kasalo'] },
	{
		category: 'food',
		name: 'Milk, Juices & Healthy Drinks',
		tags: ['Chocolate Milk', 'Strawberry Milk', 'Sparkling Drink', 'Juice', 'Vitamilk']
	},
	{ category: 'food', name: 'Snacks & Biscuits', tags: ['Wafers', 'Deedo'] },
	{ category: 'food', name: 'Disposable Cups & Bowls', tags: ['Paper Cups', 'Paper Bowl'] },
	{ category: 'food', name: 'Disposable Plates', tags: ['Paper Plate', 'Siomai Plate'] },
	{
		category: 'food',
		name: 'Utensils',
		tags: ['Wooden Fork', 'Wooden Spoon', 'Wooden Spoon & Fork', 'Toothpick']
	},
	{
		category: 'care',
		name: 'Oral & Body Grooming',
		tags: ['Toothbrush', 'Toothpaste', 'Deodorant', 'Bar Soap', 'Baby Powder']
	},
	{ category: 'care', name: 'Wipes & Tissues', tags: ['Tissue', 'Wet Wipes', 'Napkin'] },
	{ category: 'care', name: 'Personal Protection', tags: ['Facemask', 'Hairnet', 'Alcohol'] },
	{ category: 'care', name: 'Medical First Aid', tags: ['Band Aid'] },
	{
		category: 'care',
		name: 'Dishwashing & Utility Cleaning',
		tags: ['Dishwashing Liquid', 'Sponge']
	},
	{ category: 'bags', name: 'Utility Bags', tags: ['Eco Bag', 'Lunchbox'] },
	{ category: 'bags', name: 'Hair Accessories', tags: ['Hair Clip', 'Flower Hair Clip'] },
	{
		category: 'bags',
		name: 'Fashion Pins & Fasteners',
		tags: ['Fashion Pin', 'Pardible', 'Pardible with Design']
	},
	{
		category: 'textbooks',
		name: 'Accounting Textbooks',
		tags: ['CFAS Textbook', 'FAR Textbook', 'IA Textbook']
	},
	{ category: 'operations', name: 'Credit Services (Loans)', tags: ['Regular Loan'] },
	{
		category: 'operations',
		name: 'Space & Canteen Lease',
		tags: ['Space Rental', 'Canteen Stall Rental']
	},
	{
		category: 'operations',
		name: 'Cooperative Fees',
		tags: ['Membership Fee', 'Subscription Fee', 'Reprint Receipt Fee', 'Uniform Additional Fee']
	},
	{ category: 'operations', name: 'Annual Services', tags: ['Annual Picture', 'Yearbook'] }
];

const genericTagWords = new Set([
	'blouse',
	'bottoms',
	'pants',
	'polo',
	'slacks',
	't',
	'tops',
	'shirt'
]);
const tagMatchTerms: Record<string, string[]> = {
	'Male Polo': ['male polo'],
	'Male Pants': ['male pants'],
	'PE Tops': ['p e t shirt'],
	'PE Bottoms': ['p e pants'],
	NSTP: ['nstp t shirt'],
	Uniforms: ['department uniforms'],
	Juice: ['deedoo', 'tropicana', 'pocari sweat'],
	'Admin Staff Lanyard': ['admin'],
	'Faculty Staff Lanyard': ['faculty'],
	'Accountancy Lanyard': ['accountancy', 'management in accounting'],
	'Engineering Lanyard': [
		'computer engineering',
		'electrical engineering',
		'electronics engineering',
		'industrial engineering'
	],
	'Entrepreneurship Lanyard': ['entrep'],
	'Computer Studies Lanyard': ['computer science', 'information system', 'information technology'],
	Wafers: ['richeese', 'richoco'],
	Deodorant: ['rexona deo'],
	'Bar Soap': ['safeguard bar'],
	'IA Textbook': ['intermediate accounting']
};

export function productMatchesTag(productName: string, tag: string) {
	const normalizedProductName = productName.toLowerCase().replace(/[^a-z0-9]+/g, ' ');
	const normalizedTag = tag.toLowerCase().replace(/[^a-z0-9]+/g, ' ');
	const matchTerms = tagMatchTerms[tag];

	if (matchTerms) return matchTerms.some((term) => normalizedProductName.includes(term));
	if (normalizedProductName.includes(normalizedTag)) return true;

	return normalizedTag
		.split(' ')
		.map((word) => word.replace(/s$/, ''))
		.filter((word) => word.length > 2 && !genericTagWords.has(word))
		.some((word) => normalizedProductName.includes(word));
}
