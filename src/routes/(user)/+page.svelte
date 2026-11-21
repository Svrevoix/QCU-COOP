<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { handleImageError } from '$lib/imageFallback';

	// 5 Hero Gallery Products (Matches 5-Card Panoramic Pedestals in Reference)
	const heroGallery = [
		{
			id: 'hero-1',
			name: 'Male Polo Barong',
			category: 'Official Attire',
			desc: 'Official campus daily uniform with standard university crest embroidery.',
			price: 490,
			sku: 'IT00078',
			image: 'images/attires/qcu_shirt-uniform-boys.webp',
			tag: 'Required'
		},
		{
			id: 'hero-2',
			name: 'Female Collared Blouse',
			category: 'Official Attire',
			desc: 'Tailored campus collared blouse with embroidered collar insignia.',
			price: 485,
			sku: 'IT00028',
			image: 'images/attires/qcu-uniform-girls.webp',
			tag: 'Required'
		},
		{
			id: 'hero-3',
			name: 'P.E. Athletic Shirt',
			category: 'Physical Education',
			desc: 'Official athletic gold and navy shirt with quick-dry performance weave.',
			price: 265,
			sku: 'IT00108',
			image: 'images/attires/pe_shirt-yellow.webp',
			tag: 'All Programs'
		},
		{
			id: 'hero-4',
			name: 'BS IT Department Lanyard',
			category: 'Campus Accessories',
			desc: 'High-density woven lanyard in official College of Computer Studies colors.',
			price: 85,
			sku: 'IT00052',
			image: 'images/lanyards/lanyard-information-technology.webp',
			tag: 'Best Seller'
		},
		{
			id: 'hero-5',
			name: 'A4 Bond Paper Ream (500s)',
			category: 'Academic Supplies',
			desc: '70 GSM premium multipurpose copy paper for assignments and examinations.',
			price: 220,
			sku: 'IT00010',
			image: 'images/stationaries/a4_bond-paper-removebg.webp',
			tag: 'In Stock'
		}
	];

	let activeHeroIndex = $state(2); // Center card active by default
	let isPaused = $state(false);

	function showPrevHero() {
		activeHeroIndex = (activeHeroIndex - 1 + heroGallery.length) % heroGallery.length;
	}

	function showNextHero() {
		activeHeroIndex = (activeHeroIndex + 1) % heroGallery.length;
	}

	// Dynamic Count-Up Animation for Key Metrics
	let metricsRef: HTMLElement | null = $state(null);
	let count1 = $state(0);
	let count2 = $state(0);
	let count3 = $state(0);
	let hasAnimated = false;

	function runCountUp() {
		const duration = 1500;
		const startTime = performance.now();

		function step(currentTime: number) {
			const elapsed = currentTime - startTime;
			const progress = Math.min(elapsed / duration, 1);
			// Smooth easeOutExpo curve for super satisfying fast ticker effect
			const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

			count1 = Math.round(100 * ease);
			count2 = Math.round(15000 * ease);
			count3 = Math.round(485 * ease);

			if (progress < 1) {
				requestAnimationFrame(step);
			} else {
				count1 = 100;
				count2 = 15000;
				count3 = 485;
			}
		}
		requestAnimationFrame(step);
	}

	// Curated 4 slides for Section 3 Promo Showcase Strip ("Style Statement")
	const promoSlides = [
		{
			id: 'slide-1',
			eyebrow: '— Official Department Gear —',
			title: 'Style Statement',
			description:
				'Elevate your daily routine with department collections. Engineered to withstand demanding academic life, our essentials deliver daily versatility without compromising on university pride.',
			buttonText: 'Explore More',
			buttonHref: '#catalog',
			items: [
				{
					src: 'images/lanyards/lanyard-information-technology.webp',
					pos: 'pointer-events-none absolute -left-4 -top-6 sm:-left-6 sm:-top-8 h-32 w-32 sm:h-44 sm:w-44 opacity-85 select-none',
					imgClass: 'h-full w-full object-contain rotate-45 drop-shadow-md'
				},
				{
					src: 'images/accessories/small_pin-removebg.webp',
					pos: 'pointer-events-none absolute top-4 sm:top-6 left-[22%] sm:left-[26%] h-10 w-10 sm:h-12 sm:w-12 -rotate-12 opacity-90 select-none',
					imgClass: 'h-full w-full object-contain drop-shadow-sm'
				},
				{
					src: 'images/accessories/clips-black-removebg.webp',
					pos: 'pointer-events-none absolute top-4 sm:top-6 right-[22%] sm:right-[26%] h-10 w-10 sm:h-12 sm:w-12 rotate-12 opacity-90 select-none',
					imgClass: 'h-full w-full object-contain drop-shadow-sm'
				},
				{
					src: 'images/lanyards/lanyard-accountancy.webp',
					pos: 'pointer-events-none absolute -right-4 -top-6 sm:-right-6 sm:-top-8 h-32 w-32 sm:h-44 sm:w-44 opacity-85 select-none',
					imgClass: 'h-full w-full object-contain -rotate-45 drop-shadow-md'
				},
				{
					src: 'images/accessories/QCU_keychain-removebg.webp',
					pos: 'pointer-events-none absolute left-3 sm:left-10 top-1/2 -translate-y-1/2 h-14 w-14 sm:h-16 sm:w-16 -rotate-6 opacity-90 select-none',
					imgClass: 'h-full w-full object-contain drop-shadow-md'
				},
				{
					src: 'images/stationaries/binder_clip-removebg.webp',
					pos: 'pointer-events-none absolute bottom-4 sm:bottom-8 left-6 sm:left-14 h-11 w-11 sm:h-13 sm:w-13 rotate-12 opacity-85 select-none',
					imgClass: 'h-full w-full object-contain drop-shadow-sm'
				},
				{
					src: 'images/stationaries/correction-tape-removebg.webp',
					pos: 'pointer-events-none absolute -bottom-2 sm:-bottom-1 left-[23%] sm:left-[26%] h-12 w-12 sm:h-14 sm:w-14 rotate-12 opacity-90 select-none',
					imgClass: 'h-full w-full object-contain drop-shadow-md'
				},
				{
					src: 'images/accessories/small_pin_1_-removebg.webp',
					pos: 'pointer-events-none absolute bottom-5 sm:bottom-8 right-[23%] sm:right-[26%] h-11 w-11 sm:h-13 sm:w-13 -rotate-6 opacity-90 select-none',
					imgClass: 'h-full w-full object-contain drop-shadow-sm'
				},
				{
					src: 'images/stationaries/sign_pen-blue-removebg.webp',
					pos: 'pointer-events-none absolute -right-4 -bottom-6 sm:-right-6 sm:-bottom-8 h-32 w-32 sm:h-44 sm:w-44 -rotate-45 opacity-85 select-none',
					imgClass: 'h-full w-full object-contain drop-shadow-md'
				}
			]
		},
		{
			id: 'slide-2',
			eyebrow: '— Campus Accessories & Pins —',
			title: 'Everyday Identity',
			description:
				'Complete your university silhouette with official collegiate charms, pins, and emblems. Distinct accents designed to celebrate every major and organizational achievement.',
			buttonText: 'View Accessories',
			buttonHref: '#catalog',
			items: [
				{
					src: 'images/lanyards/lanyard-comp-eng.webp',
					pos: 'pointer-events-none absolute -left-4 -top-6 sm:-left-6 sm:-top-8 h-32 w-32 sm:h-44 sm:w-44 opacity-85 select-none',
					imgClass: 'h-full w-full object-contain rotate-45 drop-shadow-md'
				},
				{
					src: 'images/accessories/ECE_keychain-removebg.webp',
					pos: 'pointer-events-none absolute top-4 sm:top-6 left-[22%] sm:left-[26%] h-11 w-11 sm:h-13 sm:w-13 -rotate-12 opacity-90 select-none',
					imgClass: 'h-full w-full object-contain drop-shadow-sm'
				},
				{
					src: 'images/accessories/small_pin2-removebg.webp',
					pos: 'pointer-events-none absolute top-4 sm:top-6 right-[22%] sm:right-[26%] h-10 w-10 sm:h-12 sm:w-12 rotate-12 opacity-90 select-none',
					imgClass: 'h-full w-full object-contain drop-shadow-sm'
				},
				{
					src: 'images/lanyards/lanyard-e-eng.webp',
					pos: 'pointer-events-none absolute -right-4 -top-6 sm:-right-6 sm:-top-8 h-32 w-32 sm:h-44 sm:w-44 opacity-85 select-none',
					imgClass: 'h-full w-full object-contain -rotate-45 drop-shadow-md'
				},
				{
					src: 'images/accessories/COB_keychain-removebg.webp',
					pos: 'pointer-events-none absolute left-3 sm:left-10 top-1/2 -translate-y-1/2 h-14 w-14 sm:h-16 sm:w-16 -rotate-6 opacity-90 select-none',
					imgClass: 'h-full w-full object-contain drop-shadow-md'
				},
				{
					src: 'images/accessories/butterfly-blue-removebg-preview.webp',
					pos: 'pointer-events-none absolute bottom-4 sm:bottom-8 left-6 sm:left-14 h-11 w-11 sm:h-13 sm:w-13 rotate-12 opacity-85 select-none',
					imgClass: 'h-full w-full object-contain drop-shadow-sm'
				},
				{
					src: 'images/accessories/hairpins-removebg.webp',
					pos: 'pointer-events-none absolute -bottom-2 sm:-bottom-1 left-[23%] sm:left-[26%] h-12 w-12 sm:h-14 sm:w-14 rotate-12 opacity-90 select-none',
					imgClass: 'h-full w-full object-contain drop-shadow-md'
				},
				{
					src: 'images/accessories/flower_pink-removebg.webp',
					pos: 'pointer-events-none absolute bottom-5 sm:bottom-8 right-[23%] sm:right-[26%] h-11 w-11 sm:h-13 sm:w-13 -rotate-6 opacity-90 select-none',
					imgClass: 'h-full w-full object-contain drop-shadow-sm'
				},
				{
					src: 'images/accessories/IT_keychain-removebg.webp',
					pos: 'pointer-events-none absolute -right-4 -bottom-6 sm:-right-6 sm:-bottom-8 h-32 w-32 sm:h-44 sm:w-44 -rotate-45 opacity-85 select-none',
					imgClass: 'h-full w-full object-contain drop-shadow-md'
				}
			]
		},
		{
			id: 'slide-3',
			eyebrow: '— Academic Supplies & Tools —',
			title: 'Study in Precision',
			description:
				'Equip your lecture hours and laboratory sessions with certified campus stationery, drafting tools, and daily desk essentials built for reliable precision all semester long.',
			buttonText: 'Shop Supplies',
			buttonHref: '#catalog',
			items: [
				{
					src: 'images/stationaries/notebook.webp',
					pos: 'pointer-events-none absolute -left-4 -top-6 sm:-left-6 sm:-top-8 h-28 w-28 sm:h-40 sm:w-40 opacity-85 select-none',
					imgClass: 'h-full w-full object-contain rotate-12 drop-shadow-md'
				},
				{
					src: 'images/stationaries/sharpener-removebg.webp',
					pos: 'pointer-events-none absolute top-4 sm:top-6 left-[22%] sm:left-[26%] h-10 w-10 sm:h-12 sm:w-12 -rotate-12 opacity-90 select-none',
					imgClass: 'h-full w-full object-contain drop-shadow-sm'
				},
				{
					src: 'images/stationaries/push-pins-removebg.webp',
					pos: 'pointer-events-none absolute top-4 sm:top-6 right-[22%] sm:right-[26%] h-10 w-10 sm:h-12 sm:w-12 rotate-12 opacity-90 select-none',
					imgClass: 'h-full w-full object-contain drop-shadow-sm'
				},
				{
					src: 'images/stationaries/transparent-ruler-removebg.webp',
					pos: 'pointer-events-none absolute -right-4 -top-6 sm:-right-6 sm:-top-8 h-32 w-32 sm:h-44 sm:w-44 opacity-85 select-none',
					imgClass: 'h-full w-full object-contain -rotate-45 drop-shadow-md'
				},
				{
					src: 'images/stationaries/scissor-removebg.webp',
					pos: 'pointer-events-none absolute left-3 sm:left-10 top-1/2 -translate-y-1/2 h-14 w-14 sm:h-16 sm:w-16 -rotate-12 opacity-90 select-none',
					imgClass: 'h-full w-full object-contain drop-shadow-md'
				},
				{
					src: 'images/stationaries/eraser-white-removebg.webp',
					pos: 'pointer-events-none absolute bottom-4 sm:bottom-8 left-6 sm:left-14 h-11 w-11 sm:h-13 sm:w-13 rotate-12 opacity-85 select-none',
					imgClass: 'h-full w-full object-contain drop-shadow-sm'
				},
				{
					src: 'images/stationaries/protractor-removebg.webp',
					pos: 'pointer-events-none absolute -bottom-2 sm:-bottom-1 left-[23%] sm:left-[26%] h-12 w-12 sm:h-14 sm:w-14 rotate-12 opacity-90 select-none',
					imgClass: 'h-full w-full object-contain drop-shadow-md'
				},
				{
					src: 'images/stationaries/fasteners-removebg.webp',
					pos: 'pointer-events-none absolute bottom-5 sm:bottom-8 right-[23%] sm:right-[26%] h-11 w-11 sm:h-13 sm:w-13 -rotate-6 opacity-90 select-none',
					imgClass: 'h-full w-full object-contain drop-shadow-sm'
				},
				{
					src: 'images/stationaries/ballpen-blue-removebg.webp',
					pos: 'pointer-events-none absolute -right-4 -bottom-6 sm:-right-6 sm:-bottom-8 h-32 w-32 sm:h-44 sm:w-44 -rotate-45 opacity-85 select-none',
					imgClass: 'h-full w-full object-contain drop-shadow-md'
				}
			]
		},
		{
			id: 'slide-4',
			eyebrow: '— College Pride & Heritage —',
			title: 'The Pride of QCians',
			description:
				'Showcase your university journey with signature department lanyards, commemorative badges, and collectible tokens crafted with care by the QCU Cooperative.',
			buttonText: 'Discover Heritage',
			buttonHref: '#catalog',
			items: [
				{
					src: 'images/lanyards/lanyard-entrep.webp',
					pos: 'pointer-events-none absolute -left-4 -top-6 sm:-left-6 sm:-top-8 h-32 w-32 sm:h-44 sm:w-44 opacity-85 select-none',
					imgClass: 'h-full w-full object-contain rotate-45 drop-shadow-md'
				},
				{
					src: 'images/accessories/small_pin-removebg.webp',
					pos: 'pointer-events-none absolute top-4 sm:top-6 left-[22%] sm:left-[26%] h-10 w-10 sm:h-12 sm:w-12 -rotate-12 opacity-90 select-none',
					imgClass: 'h-full w-full object-contain drop-shadow-sm'
				},
				{
					src: 'images/accessories/EDUC_keychain-removebg.webp',
					pos: 'pointer-events-none absolute top-4 sm:top-6 right-[22%] sm:right-[26%] h-11 w-11 sm:h-13 sm:w-13 rotate-12 opacity-90 select-none',
					imgClass: 'h-full w-full object-contain drop-shadow-sm'
				},
				{
					src: 'images/lanyards/lanyard-manage-acc.webp',
					pos: 'pointer-events-none absolute -right-4 -top-6 sm:-right-6 sm:-top-8 h-32 w-32 sm:h-44 sm:w-44 opacity-85 select-none',
					imgClass: 'h-full w-full object-contain -rotate-45 drop-shadow-md'
				},
				{
					src: 'images/accessories/ICE_keychain-removebg.webp',
					pos: 'pointer-events-none absolute left-3 sm:left-10 top-1/2 -translate-y-1/2 h-14 w-14 sm:h-16 sm:w-16 -rotate-6 opacity-90 select-none',
					imgClass: 'h-full w-full object-contain drop-shadow-md'
				},
				{
					src: 'images/accessories/butterfly-pink-removebg.webp',
					pos: 'pointer-events-none absolute bottom-4 sm:bottom-8 left-6 sm:left-14 h-11 w-11 sm:h-13 sm:w-13 rotate-12 opacity-85 select-none',
					imgClass: 'h-full w-full object-contain drop-shadow-sm'
				},
				{
					src: 'images/stationaries/binder_clip-removebg.webp',
					pos: 'pointer-events-none absolute -bottom-2 sm:-bottom-1 left-[23%] sm:left-[26%] h-12 w-12 sm:h-14 sm:w-14 rotate-12 opacity-90 select-none',
					imgClass: 'h-full w-full object-contain drop-shadow-md'
				},
				{
					src: 'images/accessories/small_pin_1_-removebg.webp',
					pos: 'pointer-events-none absolute bottom-5 sm:bottom-8 right-[23%] sm:right-[26%] h-11 w-11 sm:h-13 sm:w-13 -rotate-6 opacity-90 select-none',
					imgClass: 'h-full w-full object-contain drop-shadow-sm'
				},
				{
					src: 'images/lanyards/lanyard-i-eng.webp',
					pos: 'pointer-events-none absolute -right-4 -bottom-6 sm:-right-6 sm:-bottom-8 h-32 w-32 sm:h-44 sm:w-44 -rotate-45 opacity-85 select-none',
					imgClass: 'h-full w-full object-contain drop-shadow-md'
				}
			]
		}
	];

	let activePromoSlide = $state(0);
	let isPromoPaused = $state(false);

	function prevPromoSlide() {
		activePromoSlide = (activePromoSlide - 1 + promoSlides.length) % promoSlides.length;
	}

	function nextPromoSlide() {
		activePromoSlide = (activePromoSlide + 1) % promoSlides.length;
	}

	onMount(() => {
		const timer = setInterval(() => {
			if (!isPaused) {
				activeHeroIndex = (activeHeroIndex + 1) % heroGallery.length;
			}
		}, 3200);

		const promoTimer = setInterval(() => {
			if (!isPromoPaused) {
				activePromoSlide = (activePromoSlide + 1) % promoSlides.length;
			}
		}, 4500);

		let observer: IntersectionObserver | null = null;
		if (metricsRef && typeof IntersectionObserver !== 'undefined') {
			observer = new IntersectionObserver(
				(entries) => {
					if (entries[0]?.isIntersecting && !hasAnimated) {
						hasAnimated = true;
						runCountUp();
						observer?.disconnect();
					}
				},
				{ threshold: 0.25 }
			);
			observer.observe(metricsRef);
		} else {
			count1 = 100;
			count2 = 15000;
			count3 = 485;
		}

		return () => {
			clearInterval(timer);
			clearInterval(promoTimer);
			observer?.disconnect();
		};
	});

	function getHeroCardClasses(offset: number) {
		if (offset === 0) {
			return 'h-80 sm:h-96 w-52 sm:w-64 bg-white border-slate-200 shadow-sm scale-105 z-20 opacity-100 flex';
		}
		if (offset === 1 || offset === heroGallery.length - 1) {
			return 'h-72 sm:h-84 w-40 sm:w-52 bg-slate-50 border-slate-200/90 scale-95 z-10 opacity-75 hover:opacity-95 flex';
		}
		return 'h-64 sm:h-76 w-36 sm:w-44 bg-slate-50/80 border-slate-200/70 scale-90 z-0 opacity-40 hover:opacity-70 hidden md:flex';
	}

	function getHeroTagClasses(offset: number) {
		return offset === 0 ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-200 text-slate-600';
	}

	// Curated 8 items for "Final Call for These Favorites!" (Exact 4x2 grid matching reference)
	const curatedFavorites = [
		{
			id: 'fav-1',
			name: 'College Male Polo Barong',
			desc: 'Tailored campus staple with embroidered QCU chest crest built for everyday academic wear.',
			price: 490,
			sku: 'IT00078',
			category: 'Uniform',
			image: 'images/attires/qcu_shirt-uniform-boys.webp'
		},
		{
			id: 'fav-2',
			name: 'College Female Blouse',
			desc: 'Classic university tailored cut with regulation collar insignia and preshrunk comfort weave.',
			price: 485,
			sku: 'IT00028',
			category: 'Uniform',
			image: 'images/attires/qcu-uniform-girls.webp'
		},
		{
			id: 'fav-3',
			name: 'P.E. Athletic T-Shirt',
			desc: 'Official athletic gold and navy shirt engineered with moisture-wicking breathable fabric.',
			price: 265,
			sku: 'IT00108',
			category: 'Athletics',
			image: 'images/attires/pe_shirt-yellow.webp'
		},
		{
			id: 'fav-4',
			name: 'P.E. Regulation Joggers',
			desc: 'Comfort-fit navy athletic sweatpants with white side piping and durable elastic waist.',
			price: 385,
			sku: 'IT00099',
			category: 'Athletics',
			image: 'images/attires/pe_pants-blue.webp'
		},
		{
			id: 'fav-5',
			name: 'BS IT Department Lanyard',
			desc: 'Heavy-duty woven ribbon with official College of Computer Studies colors and metal swivel clip.',
			price: 85,
			sku: 'IT00052',
			category: 'Lanyard',
			image: 'images/lanyards/lanyard-information-technology.webp'
		},
		{
			id: 'fav-6',
			name: 'BSA Accountancy Lanyard',
			desc: 'Emerald green department ID lace with precision typography and safety breakaway buckle.',
			price: 85,
			sku: 'IT00055',
			category: 'Lanyard',
			image: 'images/lanyards/lanyard-accountancy.webp'
		},
		{
			id: 'fav-7',
			name: 'A4 Bond Paper Ream (500s)',
			desc: '70 GSM premium multipurpose white copy paper for semester projects, reports, and exams.',
			price: 220,
			sku: 'IT00010',
			category: 'Supplies',
			image: 'images/stationaries/a4_bond-paper-removebg.webp'
		},
		{
			id: 'fav-8',
			name: 'Official QCU Ruled Notebook',
			desc: '80 leaves high-grade lined student notebook featuring official university seal and rule margins.',
			price: 45,
			sku: 'IT00192',
			category: 'Supplies',
			image: 'images/stationaries/notebook.webp'
		}
	];

	// FAQ Accordion State (Accessible for students under FAQs)
	let openFaq = $state<number | null>(null);
	function toggleFaq(index: number) {
		openFaq = openFaq === index ? null : index;
	}

	const faqs = [
		{
			q: 'How does member pricing work for students and faculty?',
			a: 'All enrolled QCU students and university employees are automatically eligible for co-op member rates. Simply log in using your student ID (23-XXXX) or employee ID (10-XXXX) to view discounted prices and save on official gear.'
		},
		{
			q: 'Where do I collect my order on campus?',
			a: 'Orders are prepared for pickup at the QCU Co-op Store, located at the Bautista Building Basement Level (San Bartolome Campus). Present your order number at Counter 1 during store hours.'
		},
		{
			q: 'What if my uniform size does not fit?',
			a: 'We have fitting booths available right at our Bautista Hall counter. Size exchanges are accommodated within 7 school days with original tags intact.'
		},
		{
			q: 'What is the Annual Patronage Refund?',
			a: 'Every purchase you make is logged to your account. At the end of the fiscal year, the cooperative distributes a portion of its operating surplus back to active shoppers based on annual spending.'
		}
	];
</script>

<svelte:head>
	<title>QCU Coop Store | Official Campus Marketplace</title>
	<meta
		name="description"
		content="Official Quezon City University cooperative store for campus uniforms, department lanyards, and academic supplies at member rates."
	/>
</svelte:head>

<div class="landing-page-root w-full bg-white text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">

	<!-- ══════════════════════════════════════════════════════════════════════ -->
	<!-- 1. EDITORIAL HERO SECTION                                             -->
	<!--    (Exact match to Reference Section 1: Title, Subtitle, Pill, 5-Card) -->
	<!-- ══════════════════════════════════════════════════════════════════════ -->
	<section
		id="top"
		class="relative w-full pt-14 sm:pt-20 pb-16 overflow-hidden bg-linear-to-b from-slate-50/50 via-white to-white text-center"
	>
		<!-- Subtle ambient blue gradient behind hero for premium depth -->
		<div
			class="pointer-events-none absolute inset-0 select-none opacity-50"
			style="background: radial-gradient(circle at 50% 12%, rgba(29, 78, 216, 0.08) 0%, transparent 60%);"
			aria-hidden="true"
		></div>

		<div class="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			
			<!-- Eyebrow Tag: Clean, High-Contrast QCU Badge -->
			<div class="inline-flex items-center rounded-full border border-blue-200/90 bg-blue-50/80 px-4 py-1.5 text-xs font-bold tracking-wide text-blue-700 shadow-2xs backdrop-blur-xs mb-4">
				<span>Quezon City University • Official Cooperative Store</span>
			</div>

			<!-- Hero Headline: Bold, Powerful, Executive Typography in Oxford Navy -->
			<h1 class="text-3xl sm:text-5xl md:text-6xl font-extrabold text-[#071739] tracking-tight leading-[1.14] max-w-4xl mx-auto">
				Discover Campus Attire That Lasts A Lifetime
			</h1>

			<!-- Sub-headline Paragraph -->
			<p class="mt-4 text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed font-normal">
				Your trusted campus cooperative for authentic Quezon City University uniforms, department merchandise, and academic supplies at student-friendly member rates.
			</p>

			<!-- Action CTA Buttons: Signature QCU Royal Blue & Crisp White Pill -->
			<div class="mt-7 flex flex-wrap items-center justify-center gap-3.5">
				<a
					href="#catalog"
					class="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 px-7 py-3 text-xs sm:text-sm font-bold tracking-wide text-white transition-colors duration-200"
				>
					<span>Shop The Collection</span>
					<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
					</svg>
				</a>

				<a
					href={page.data.user ? '/shop' : '/login'}
					class="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white hover:bg-slate-50 px-6 py-3 text-xs sm:text-sm font-bold text-slate-700 shadow-2xs transition-all hover:border-slate-400"
				>
					<span>{page.data.user ? 'Store Dashboard' : 'Sign In with Student ID'}</span>
				</a>
			</div>

			<!-- 5-Card Panoramic Hero Pedestal Gallery (Exact match to Reference 5 Hands with QCU Signature Styling) -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="mt-12 sm:mt-16 flex items-center justify-center gap-3 sm:gap-5 overflow-hidden select-none py-4"
				onmouseenter={() => (isPaused = true)}
				onmouseleave={() => (isPaused = false)}
			>
				{#each heroGallery as item, index}
					{@const offset = (index - activeHeroIndex + heroGallery.length) % heroGallery.length}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<div
						class="transition-all duration-700 ease-out flex-col justify-between items-center rounded-3xl p-4 cursor-pointer shrink-0 border {getHeroCardClasses(offset)}"
						onclick={() => (activeHeroIndex = index)}
					>
						<span class="rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-wide {getHeroTagClasses(offset)}">
							{item.tag}
						</span>

						<!-- Cutout Image Center -->
						<div class="flex items-center justify-center h-44 sm:h-56 w-full p-2">
							<img
								src={item.image}
								alt={item.name}
								onerror={(event) => handleImageError(event, item.name)}
								class="max-h-full max-w-full object-contain drop-shadow-md select-none transition-transform duration-300 hover:scale-105"
								draggable="false"
							/>
						</div>

						<!-- Bottom Label -->
						<div class="text-center pb-2 w-full">
							<span class="text-xs sm:text-sm font-bold text-[#071739] line-clamp-1 block">
								{item.name}
							</span>
							<span class="text-xs font-black text-blue-600 block mt-0.5">
								₱{item.price.toFixed(2)}
							</span>
						</div>
					</div>
				{/each}
			</div>

			<!-- Slider Dots: Royal Blue Active Indicator -->
			<div class="mt-8 flex items-center justify-center gap-2">
				{#each heroGallery as _, i}
					<button
						type="button"
						class="transition-all duration-300 rounded-full {activeHeroIndex === i ? 'w-6 h-2 bg-blue-600' : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'}"
						onclick={() => (activeHeroIndex = i)}
						aria-label={`Go to slide ${i + 1}`}
					></button>
				{/each}
			</div>

		</div>
	</section>

	<!-- ══════════════════════════════════════════════════════════════════════ -->
	<!-- 2. EDITORIAL FEATURE SPOTLIGHT                                        -->
	<!--    (Exact match to Reference Section 2: "Where Timeless Craftsmanship...") -->
	<!-- ══════════════════════════════════════════════════════════════════════ -->
	<section class="py-20 sm:py-28 bg-white">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
			
			<div class="max-w-2xl mx-auto mb-12 sm:mb-16">
				<span class="text-xs font-bold tracking-wide text-blue-600 block mb-2">
					Craftsmanship & Compliance
				</span>
				<h2 class="text-2xl sm:text-4xl font-extrabold text-[#071739] tracking-tight leading-snug">
					Where Timeless Craftsmanship Meets <span class="text-blue-600 block sm:inline">Modern Elegance</span>
				</h2>
				<p class="mt-4 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
					A university uniform piece is more than an ensemble — it is a reflection of your pride, elegance, and academic journey. Every piece is crafted in modern and seamless designs, giving light to every university dress code standard, balanced with durable daily resilience. Our collection is made so you may step onto campus in style and confidence.
				</p>
			</div>

			<!-- Large Hero Studio Cutout (Matches Giant Floating Diamond Bracelet) -->
			<div class="relative flex items-center justify-center w-full max-w-2xl mx-auto py-6 sm:py-10">
				<!-- Center Cutout -->

				<div class="relative z-10 flex flex-col items-center justify-center w-full">
					<div class="relative flex items-center justify-center h-64 sm:h-80 w-full">
						<img
							src="images/attires/qcu_shirt-uniform-boys.webp"
							alt="Official QCU Male Polo Barong"
							onerror={(event) => handleImageError(event, 'QCU Uniform')}
							class="max-h-full max-w-full object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-105"
						/>
					</div>

					<!-- Soft Shadow / Surface Reflection -->
					<div class="mt-2 h-4 w-64 rounded-full bg-slate-300/50 filter blur-md" aria-hidden="true"></div>
				</div>
			</div>

			<!-- Key Metrics Strip: Grounded, Clean, Trustworthy with Smooth Fast Count-Up Animation -->
			<div
				bind:this={metricsRef}
				class="mt-10 pt-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
			>
				<div>
					<span class="block text-2xl sm:text-3xl font-extrabold text-[#071739] tabular-nums">
						{count1}%
					</span>
					<span class="text-xs text-slate-500 font-medium">Dress Code Compliant</span>
				</div>
				<div>
					<span class="block text-2xl sm:text-3xl font-extrabold text-[#071739] tabular-nums">
						{count2.toLocaleString()}+
					</span>
					<span class="text-xs text-slate-500 font-medium">Scholars Equipped</span>
				</div>
				<div>
					<span class="block text-2xl sm:text-3xl font-extrabold text-[#071739] tabular-nums">
						₱{count3}
					</span>
					<span class="text-xs text-slate-500 font-medium">Base Member Rate</span>
				</div>
				<div>
					<span class="block text-2xl sm:text-3xl font-extrabold text-[#071739]">
						Counter 1
					</span>
					<span class="text-xs text-slate-500 font-medium">Fast-Lane Pickup</span>
				</div>
			</div>

		</div>
	</section>

	<!-- ══════════════════════════════════════════════════════════════════════ -->
	<!-- 3. HORIZONTAL PROMO STRIP ("Style Statement")                         -->
	<!--    (Exact match to Reference Section 3: Floating items & Dots)         -->
	<!-- ══════════════════════════════════════════════════════════════════════ -->
	<section class="py-16 sm:py-20 bg-white">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			
			<div
				class="relative rounded-3xl border border-slate-200/90 bg-linear-to-r from-slate-50 via-white to-blue-50/40 overflow-hidden shadow-xs group"
				onmouseenter={() => (isPromoPaused = true)}
				onmouseleave={() => (isPromoPaused = false)}
				role="region"
				aria-label="Promotional Showcase Carousel"
			>
				<!-- Sliding Carousel Track -->
				<div
					class="flex promo-carousel-track"
					style="transform: translateX(-{activePromoSlide * 100}%);"
				>
					{#each promoSlides as slide, slideIdx}
						<div
							class="w-full shrink-0 relative px-6 pt-12 pb-20 sm:px-14 sm:pt-16 sm:pb-24 text-center overflow-hidden min-h-[380px] sm:min-h-[420px] flex flex-col justify-center items-center transition-all duration-700 ease-out {activePromoSlide === slideIdx ? 'opacity-100 scale-100' : 'opacity-25 scale-95'}"
						>
							<!-- Peripheral Floating Cutout Accessories with Ambient Levitation -->
							{#each slide.items as item, itemIdx}
								<div
									class="{item.pos} transition-all duration-700 ease-out {activePromoSlide === slideIdx ? 'opacity-90 scale-100 translate-y-0' : 'opacity-0 scale-85 translate-y-3'}"
								>
									<div class="h-full w-full {itemIdx % 3 === 0 ? 'promo-drift-1' : itemIdx % 3 === 1 ? 'promo-drift-2' : 'promo-drift-3'}">
										<img
											src={item.src}
											alt=""
											class={item.imgClass}
											loading="lazy"
											onerror={handleImageError}
										/>
									</div>
								</div>
							{/each}

							<!-- Center Content with Cinematic Staggered Entrance -->
							<div
								class="relative z-10 max-w-md mx-auto transition-all duration-700 delay-150 ease-out {activePromoSlide === slideIdx ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}"
							>
								<p class="text-xs font-bold tracking-wide text-blue-600 mb-1">
									{slide.eyebrow}
								</p>

								<h2 class="text-2xl sm:text-3xl font-extrabold text-[#071739] tracking-tight">
									{slide.title}
								</h2>

								<p class="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
									{slide.description}
								</p>

								<div class="mt-6">
									<a
										href={slide.buttonHref}
										class="inline-flex items-center gap-1.5 rounded-full border border-blue-600/40 bg-white hover:bg-blue-50 px-6 py-2.5 text-xs font-bold text-blue-700 shadow-2xs transition-all hover:border-blue-600 hover:shadow-xs hover:scale-105 active:scale-95"
									>
										<span>{slide.buttonText}</span>
										<span>→</span>
									</a>
								</div>
							</div>
						</div>
					{/each}
				</div>

				<!-- Slider Indicator Dots (Interactive & Animated) -->
				<div class="absolute bottom-6 sm:bottom-8 left-0 right-0 z-20 flex items-center justify-center gap-1.5">
					{#each promoSlides as _, idx}
						<button
							type="button"
							onclick={() => (activePromoSlide = idx)}
							aria-label="Go to slide {idx + 1}"
							class="h-1.5 rounded-full transition-all duration-500 ease-out cursor-pointer {activePromoSlide === idx ? 'w-6 bg-blue-600 shadow-2xs' : 'w-1.5 bg-slate-300 hover:bg-slate-400'}"
						></button>
					{/each}
				</div>

			</div>

		</div>
	</section>

	<!-- ══════════════════════════════════════════════════════════════════════ -->
	<!-- 4. ASYMMETRIC BENTO CATEGORY GRID                                     -->
	<!--    (Exact match to Reference Section 4: Bracelets, Earrings, Necklaces, Rings) -->
	<!-- ══════════════════════════════════════════════════════════════════════ -->
	<section class="py-16 sm:py-24 bg-white">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			
			<!-- Bento 2-Column Grid (Left Tall Tile + Right 3 Tiles) -->
			<div class="grid grid-cols-1 md:grid-cols-12 gap-5">
				
				<!-- Left Tall Tile: "Official Uniforms" (Matches Large "Bracelets" Tile) -->
				<div class="md:col-span-6 rounded-3xl bg-linear-to-b from-slate-50 to-white border border-slate-200/90 p-8 sm:p-10 flex flex-col justify-between group transition-all duration-300 hover:border-blue-300 hover:shadow-md min-h-115">
					<div class="text-left">
						<h3 class="text-base font-extrabold text-[#071739] tracking-wide">
							Uniforms
						</h3>
						<p class="text-xs text-slate-500 mt-1 leading-relaxed max-w-60 font-normal">
							Tailored movement to add dignity and comfort to every university day.
						</p>
					</div>

					<div class="my-6 flex items-center justify-center h-64 w-full">
						<img
							src="images/attires/qcu-uniform-girls.webp"
							alt="Official Blouse Uniform"
							onerror={(event) => handleImageError(event, 'QCU Uniform Blouse')}
							class="max-h-full max-w-full object-contain drop-shadow-xl transition-transform duration-300 group-hover:scale-105"
						/>
					</div>

					<div class="text-left pt-2">
						<a
							href={page.data.user ? '/shop' : '/login'}
							class="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
						>
							<span>Explore Collection</span>
							<span>→</span>
						</a>
					</div>
				</div>

				<!-- Right Column: 3 Tiles (Top 2 Small Tiles + Bottom Wide Tile) -->
				<div class="md:col-span-6 flex flex-col gap-5">
					
					<!-- Top 2 Small Tiles -->
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-5 flex-1">
						
						<!-- Tile 1 (Dark Oxford Navy): "Lanyards" (Matches Dark "Earrings" Tile) -->
						<div class="rounded-3xl bg-[#071739] p-6 flex flex-col justify-between text-left group min-h-55 shadow-sm">
							<div>
								<div class="flex items-center justify-between">
									<h3 class="text-sm font-extrabold text-white tracking-wide">
										Lanyards
									</h3>
									<span class="rounded-full bg-blue-900/60 border border-blue-400/30 px-2 py-0.5 text-[9px] font-bold text-blue-200">
										BSIT • BSA • COE
									</span>
								</div>
								<p class="text-xs text-slate-400 mt-1 leading-snug font-normal">
									Certified department colorways with metal badge clips.
								</p>
							</div>

							<div class="my-3 flex items-center justify-center h-28 w-full">
								<img
									src="images/lanyards/lanyard-information-technology.webp"
									alt="Department Lanyard"
									onerror={(event) => handleImageError(event, 'Lanyard')}
									class="max-h-full max-w-full object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105"
								/>
							</div>

							<div>
								<a
									href={page.data.user ? '/shop' : '/login'}
									class="text-xs font-bold text-blue-300 hover:text-white"
								>
									View Lanyards →
								</a>
							</div>
						</div>

						<!-- Tile 2 (Light Slate): "Athletics" (Matches Light "Necklaces" Tile) -->
						<div class="rounded-3xl bg-slate-50 border border-slate-200/90 p-6 flex flex-col justify-between text-left group min-h-55">
							<div>
								<h3 class="text-sm font-extrabold text-[#071739] tracking-wide">
									Athletics
								</h3>
								<p class="text-xs text-slate-500 mt-1 leading-snug font-normal">
									Moisture-wicking athletic tees and jogging pants.
								</p>
							</div>

							<div class="my-3 flex items-center justify-center h-28 w-full">
								<img
									src="images/attires/pe_shirt-yellow.webp"
									alt="P.E. Shirt"
									onerror={(event) => handleImageError(event, 'P.E. Shirt')}
									class="max-h-full max-w-full object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105"
								/>
							</div>

							<div>
								<a
									href={page.data.user ? '/shop' : '/login'}
									class="text-xs font-bold text-blue-600 hover:text-blue-800"
								>
									View Athletics →
								</a>
							</div>
						</div>

					</div>

					<!-- Bottom Wide Tile (Deep Midnight Sapphire): "Stationery" (Matches Dark "Rings" Tile) -->
					<div class="rounded-3xl bg-[#081a42] p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-4 group min-h-47.5 text-left shadow-sm">
						<div class="flex-1">
							<h3 class="text-sm font-extrabold text-white tracking-wide">
								Stationery & Exam Packs
							</h3>
							<p class="text-xs text-slate-300 mt-1 leading-relaxed max-w-xs font-normal">
								A4 bond paper reams, blue examination books, and university notebooks.
							</p>
							<div class="mt-4">
								<a
									href={page.data.user ? '/shop' : '/login'}
									class="text-xs font-bold text-blue-300 hover:text-white"
								>
									Explore Supplies →
								</a>
							</div>
						</div>

						<div class="h-28 w-28 shrink-0 flex items-center justify-center">
							<img
								src="images/stationaries/a4_bond-paper-removebg.webp"
								alt="Bond Paper Ream"
								onerror={(event) => handleImageError(event, 'Bond Paper')}
								class="max-h-full max-w-full object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105"
							/>
						</div>
					</div>

				</div>

			</div>

		</div>
	</section>

	<!-- ══════════════════════════════════════════════════════════════════════ -->
	<!-- 5. CURATED 8-PRODUCT CATALOG ("Final Call for These Favorites!")      -->
	<!--    (Exact match to Reference Section 5: 4-Col x 2-Row Grid + Buy Now)  -->
	<!-- ══════════════════════════════════════════════════════════════════════ -->
	<section id="catalog" class="py-16 sm:py-24 bg-white">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			
			<!-- Split Header (Matches Left Title + Right Description in Reference) -->
			<div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 mb-8">
				<div class="text-left">
					<span class="text-xs font-bold tracking-wide text-blue-600 block mb-1">
						Campus Essentials
					</span>
					<h2 class="text-2xl sm:text-3xl font-extrabold text-[#071739] tracking-tight">
						Final Call For These Favorites!
					</h2>
				</div>

				<div class="text-left sm:text-right max-w-xs">
					<p class="text-xs text-slate-500 leading-relaxed font-normal">
						These campus favorites are high in demand! Reserve yours online for fast-lane pickup at the Bautista Hall basement store.
					</p>
				</div>
			</div>

			<!-- 4-Column x 2-Row Product Grid (Exact 8 Cards Matching Reference) -->
			<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
				{#each curatedFavorites as product (product.id)}
					<div class="group flex flex-col justify-between rounded-2xl bg-white border border-slate-200/90 p-5 transition-all duration-200 hover:border-blue-300 hover:shadow-lg text-left">
						
						<!-- Centered Product Cutout Container -->
						<div class="relative flex h-44 w-full items-center justify-center p-3 rounded-xl bg-slate-50/80 border border-slate-100 overflow-hidden">
							<span class="absolute top-2 left-2 rounded-full bg-white border border-slate-200 px-2.5 py-0.5 text-[9px] font-bold tracking-wide text-slate-700 shadow-2xs">
								{product.category}
							</span>

							<img
								src={product.image}
								alt={product.name}
								onerror={(event) => handleImageError(event, product.name)}
								class="max-h-full max-w-full object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-105 select-none"
								draggable="false"
							/>
						</div>

						<!-- Card Meta -->
						<div class="pt-3.5 flex flex-col flex-1 justify-between">
							<div>
								<h3 class="font-bold text-sm text-[#071739] line-clamp-1 group-hover:text-blue-600 transition-colors">
									{product.name}
								</h3>
								<p class="text-xs text-slate-500 font-normal mt-1 line-clamp-2 leading-relaxed">
									{product.desc}
								</p>
							</div>

							<!-- Price & "Buy Now" Link (Signature QCU Blue Action) -->
							<div class="mt-4 flex items-center justify-between pt-1">
								<span class="text-base font-black text-[#071739]">
									₱{product.price}
								</span>

								<a
									href={page.data.user ? '/shop' : '/login'}
									class="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
								>
									Buy Now
								</a>
							</div>
						</div>

					</div>
				{/each}
			</div>

		</div>
	</section>

	<!-- ══════════════════════════════════════════════════════════════════════ -->
	<!-- 6. EDITORIAL SPLIT PROMO BANNER ("Elevate Your Style Instantly")       -->
	<!--    (Exact match to Reference Section 6: Copy + 4-Photo Angle Mosaic)   -->
	<!-- ══════════════════════════════════════════════════════════════════════ -->
	<section class="py-16 sm:py-24 bg-white">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			
			<div class="relative rounded-3xl bg-linear-to-r from-slate-50 via-white to-blue-50/50 border border-slate-200/90 overflow-hidden shadow-xs">
				<div class="grid grid-cols-1 lg:grid-cols-12 items-center">
					
					<!-- Left Column Copy (Compact, balanced vertical padding) -->
					<div class="lg:col-span-6 p-6 sm:p-8 lg:py-10 lg:pl-14 lg:pr-6 space-y-3.5 text-left z-10">
						<span class="text-xs font-bold tracking-wide text-blue-600 block">
							• Cooperative Privilege •
						</span>

						<h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#071739] tracking-tight leading-snug">
							Elevate Your Style <span class="text-blue-600 block sm:inline">Instantly</span>
						</h2>

						<p class="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal max-w-sm">
							Elevate quality that complements your campus routine. Made to inspire scholars every day with authentic university uniforms, campus supplies, and annual member dividends.
						</p>

						<div class="pt-2">
							<a
								href="#catalog"
								class="inline-flex items-center justify-center gap-1.5 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 px-6 py-2.5 text-xs sm:text-sm font-bold tracking-wide text-white transition-colors duration-200"
							>
								<span>Shop The Collection</span>
								<span>→</span>
							</a>
						</div>
					</div>

					<!-- Right Column: Floating Non-Clickable Translucent Attire & Merchandise (No containers, matching reference) -->
					<div class="lg:col-span-6 relative w-full h-full min-h-[340px] sm:min-h-[380px] lg:min-h-[420px] flex items-center justify-center lg:justify-end overflow-hidden pointer-events-none select-none">
						<!-- Floating Group (Soft, faded, translucent, non-clickable) -->
						<div class="flex items-center gap-6 sm:gap-10 -rotate-[10deg] sm:-rotate-[12deg] -mr-2 sm:-mr-4 lg:-mr-6 scale-95 sm:scale-100 opacity-75">
							
							<!-- Column 1 (Left): Male Polo Barong + Female Blouse -->
							<div class="flex flex-col gap-6 sm:gap-8 items-center">
								<!-- Male Polo Barong -->
								<div class="h-36 sm:h-44 w-32 sm:w-42 flex items-center justify-center">
									<img
										src="images/attires/qcu_shirt-uniform-boys.webp"
										alt=""
										class="h-full w-full object-contain drop-shadow-md"
										loading="lazy"
										onerror={handleImageError}
									/>
								</div>

								<!-- Female Blouse -->
								<div class="h-48 sm:h-60 w-36 sm:w-46 flex items-center justify-center">
									<img
										src="images/attires/qcu-uniform-girls.webp"
										alt=""
										class="h-full w-full object-contain drop-shadow-md"
										loading="lazy"
										onerror={handleImageError}
									/>
								</div>
							</div>

							<!-- Column 2 (Right): BS IT Lanyard & Keychain + PE Shirt -->
							<div class="flex flex-col gap-6 sm:gap-8 items-center">
								<!-- BS IT Lanyard & QCU Keychain -->
								<div class="h-48 sm:h-60 w-36 sm:w-46 flex flex-col items-center justify-center relative">
									<img
										src="images/lanyards/lanyard-information-technology.webp"
										alt=""
										class="h-[65%] w-auto object-contain drop-shadow-sm -rotate-12"
										loading="lazy"
										onerror={handleImageError}
									/>
									<img
										src="images/accessories/QCU_keychain-removebg.webp"
										alt=""
										class="h-14 w-14 sm:h-18 sm:w-18 object-contain drop-shadow-md -mt-3.5"
										loading="lazy"
										onerror={handleImageError}
									/>
								</div>

								<!-- P.E. Athletic Shirt -->
								<div class="h-36 sm:h-44 w-32 sm:w-42 flex items-center justify-center">
									<img
										src="images/attires/pe_shirt-yellow.webp"
										alt=""
										class="h-full w-full object-contain drop-shadow-md"
										loading="lazy"
										onerror={handleImageError}
									/>
								</div>
							</div>

						</div>
					</div>

				</div>
			</div>

		</div>
	</section>

	<!-- ══════════════════════════════════════════════════════════════════════ -->
	<!-- 7. FREQUENTLY ASKED QUESTIONS (COLLAPSIBLE ACCORDION)                  -->
	<!-- ══════════════════════════════════════════════════════════════════════ -->
	<section id="faq" class="py-16 sm:py-20 bg-white">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
			
			<div class="max-w-3xl mx-auto mb-10">
				<span class="text-xs font-bold tracking-wide text-blue-600 block mb-1">
					Student Guidance
				</span>
				<h2 class="text-2xl sm:text-3xl font-extrabold text-[#071739] tracking-tight">
					Frequently Asked Questions
				</h2>
			</div>

			<div class="max-w-3xl mx-auto space-y-3 text-left">
				{#each faqs as faq, index}
					<div class="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
						<button
							type="button"
							class="flex w-full items-center justify-between p-4 sm:p-5 text-xs sm:text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors"
							onclick={() => toggleFaq(index)}
							aria-expanded={openFaq === index}
						>
							<span>{faq.q}</span>
							<span class="ml-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-transform duration-200 {openFaq === index ? 'rotate-180 text-blue-600 bg-blue-50' : ''}">
								<svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
									<path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
								</svg>
							</span>
						</button>

						{#if openFaq === index}
							<div class="border-t border-slate-100 px-4 sm:px-5 pb-5 pt-3 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal bg-slate-50/50">
								{faq.a}
							</div>
						{/if}
					</div>
				{/each}
			</div>

		</div>
	</section>

	<!-- ══════════════════════════════════════════════════════════════════════ -->
	<!-- 8. MINIMALIST LUXURY FOOTER                                           -->
	<!--    (Exact match to Reference Section 7: White bg, Columns, Watermark)  -->
	<!-- ══════════════════════════════════════════════════════════════════════ -->
	<footer class="relative bg-white text-slate-600 pt-16 pb-12 overflow-hidden">
		
		<!-- Background Subtle Watermark Emblem (Matches Geometric Diamond in Reference) -->
		<div class="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 opacity-[0.03] select-none h-96 w-96 text-blue-900" aria-hidden="true">
			<svg viewBox="0 0 200 200" fill="none" class="h-full w-full stroke-current" stroke-width="1.5">
				<polygon points="100,10 190,70 190,130 100,190 10,130 10,70" />
				<circle cx="100" cy="100" r="60" />
				<circle cx="100" cy="100" r="30" />
			</svg>
		</div>

		<div class="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			
			<div class="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-slate-200 text-left">
				
				<!-- Column 1: Brand & Bio (Matches Left Column in Reference) -->
				<div class="md:col-span-5 space-y-3">
					<div class="flex items-center gap-2.5">
						<img src="/images/logo/qcu_cooplogo.png" alt="QCU COOP" class="h-7 w-auto object-contain" />
						<span class="text-xs font-extrabold tracking-wide text-[#071739]">QCU Coop Store</span>
					</div>

					<p class="text-xs text-slate-500 leading-relaxed max-w-xs font-normal">
						Official campus multipurpose cooperative providing certified Quezon City University apparel, course merchandise, and academic supplies.
					</p>

					<!-- Social Links Row: Facebook & Instagram Logos Only -->
					<div class="flex items-center gap-2.5 pt-2">
						<a
							href="https://facebook.com"
							target="_blank"
							rel="noopener noreferrer"
							aria-label="Facebook"
							class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 shadow-2xs"
						>
							<svg viewBox="0 0 24 24" class="h-4 w-4 fill-current">
								<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
							</svg>
						</a>
						<a
							href="https://instagram.com"
							target="_blank"
							rel="noopener noreferrer"
							aria-label="Instagram"
							class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 hover:border-pink-500 hover:bg-pink-50 hover:text-pink-600 transition-all duration-200 shadow-2xs"
						>
							<svg viewBox="0 0 24 24" class="h-4 w-4 fill-none stroke-current stroke-2" stroke-linecap="round" stroke-linejoin="round">
								<rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
								<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
								<line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
							</svg>
						</a>
					</div>
				</div>

				<!-- Column 2: Pages (Matches Reference Col 2) -->
				<div class="md:col-span-2 space-y-2.5">
					<h3 class="text-xs font-bold text-[#071739] tracking-wide">Pages</h3>
					<ul class="space-y-1.5 text-xs text-slate-500 font-medium">
						<li><a href="#top" class="hover:text-blue-600 transition-colors">Home</a></li>
						<li><a href="#catalog" class="hover:text-blue-600 transition-colors">Catalog</a></li>
						<li><a href="#catalog" class="hover:text-blue-600 transition-colors">Uniforms</a></li>
						<li><a href="#catalog" class="hover:text-blue-600 transition-colors">Lanyards</a></li>
					</ul>
				</div>

				<!-- Column 3: Inner Pages (Matches Reference Col 3) -->
				<div class="md:col-span-2 space-y-2.5">
					<h3 class="text-xs font-bold text-[#071739] tracking-wide">Inner Pages</h3>
					<ul class="space-y-1.5 text-xs text-slate-500 font-medium">
						<li><a href="/login" class="hover:text-blue-600 transition-colors">Sign In</a></li>
						<li><a href="/login?mode=signup" class="hover:text-blue-600 transition-colors">Register</a></li>
						<li><a href="#faq" class="hover:text-blue-600 transition-colors">FAQs</a></li>
						<li><a href="#catalog" class="hover:text-blue-600 transition-colors">Bautista Hub</a></li>
					</ul>
				</div>

				<!-- Column 4: Utility Pages (Matches Reference Col 4) -->
				<div class="md:col-span-3 space-y-2.5">
					<h3 class="text-xs font-bold text-[#071739] tracking-wide">Utility Pages</h3>
					<ul class="space-y-1.5 text-xs text-slate-500 font-medium">
						<li><span class="text-slate-500">CDA Reg. No. 2022-8014</span></li>
						<li><span class="text-slate-500">Mon–Sat, 8am–5pm</span></li>
						<li><span class="text-slate-500">Bautista Hall Basement</span></li>
						<li><span class="text-slate-500">San Bartolome, Novaliches</span></li>
					</ul>
				</div>

			</div>

			<!-- Bottom Center Copyright (Matches Reference Bottom Center) -->
			<div class="pt-8 text-center text-xs text-slate-400 font-medium">
				<p>© 2026 Quezon City University Multipurpose Cooperative. All Rights Reserved.</p>
			</div>

		</div>
	</footer>

</div>

<style>
	/* Ultra-smooth slide track glide with Apple-style cubic-bezier */
	.promo-carousel-track {
		transition: transform 850ms cubic-bezier(0.16, 1, 0.3, 1);
		will-change: transform;
	}

	/* Soft floating ambient physics for scattered accessories */
	@keyframes promo-drift-1 {
		0%, 100% {
			transform: translateY(0px) rotate(0deg);
		}
		50% {
			transform: translateY(-8px) rotate(1.5deg);
		}
	}

	@keyframes promo-drift-2 {
		0%, 100% {
			transform: translateY(0px) rotate(0deg);
		}
		50% {
			transform: translateY(-11px) rotate(-2deg);
		}
	}

	@keyframes promo-drift-3 {
		0%, 100% {
			transform: translateY(0px) rotate(0deg);
		}
		50% {
			transform: translateY(6px) rotate(1deg);
		}
	}

	.promo-drift-1 {
		animation: promo-drift-1 5.5s ease-in-out infinite alternate;
	}

	.promo-drift-2 {
		animation: promo-drift-2 6.5s ease-in-out infinite alternate;
	}

	.promo-drift-3 {
		animation: promo-drift-3 4.8s ease-in-out infinite alternate;
	}
</style>
