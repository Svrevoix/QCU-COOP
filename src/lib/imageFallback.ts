export function handleImageError(event: Event, label = 'Product image') {
	const image = event.currentTarget;
	if (!(image instanceof HTMLImageElement)) return;

	const fallback = document.createElement('span');
	fallback.className = 'image-fallback';
	fallback.setAttribute('role', 'img');
	fallback.setAttribute('aria-label', `No image available for ${label}`);
	fallback.textContent = 'No Image Available';
	fallback.style.display = 'grid';
	fallback.style.width = '100%';
	fallback.style.height = '100%';
	fallback.style.minHeight = '4rem';
	fallback.style.placeItems = 'center';
	fallback.style.padding = '1rem';
	fallback.style.boxSizing = 'border-box';
	fallback.style.color = '#7890b6';
	fallback.style.fontSize = '0.7rem';
	fallback.style.fontWeight = '700';
	fallback.style.textAlign = 'center';
	fallback.style.lineHeight = '1.3';

	image.replaceWith(fallback);
}