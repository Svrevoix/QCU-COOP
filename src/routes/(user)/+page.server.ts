import type { PageServerLoad } from './$types';
import { loadCustomerCatalog } from '$lib/server/customer-catalog';

export const load: PageServerLoad = async () => loadCustomerCatalog();
