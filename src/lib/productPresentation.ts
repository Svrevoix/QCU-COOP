const productThumbnailBaseClasses =
	'w-full h-full max-h-[92%] max-w-[92%] object-contain mx-auto my-auto drop-shadow-sm transition-transform duration-300 group-hover:scale-105';
const productOrientationClasses: Record<string, string> = {
	'Ballpen (Black)': '-rotate-[5deg]',
	'Ballpen (Blue)': '-rotate-[5deg]',
	'Ballpen (Red)': '-rotate-[7deg]',
	'Ballpen (Gel Ink)': '-rotate-[32deg] scale-90',
	'Marker (Permanent)': '-rotate-[5deg]',
	'Marker (Whiteboard)': '-rotate-[5deg]',
	'Lanyard (BS Computer Engineering)': '-rotate-[16deg]',
	'Lanyard (BS Computer Science)': '-rotate-[16deg]',
	'Lanyard (BS Information System)': '-rotate-[10deg]'
};

export function productThumbnailClasses(productName: string) {
	return `${productThumbnailBaseClasses} ${productOrientationClasses[productName] ?? ''}`.trim();
}
