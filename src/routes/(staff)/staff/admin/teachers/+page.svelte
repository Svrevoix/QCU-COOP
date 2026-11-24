<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	let { data, form }: PageProps = $props();
	const today = new Date().toISOString().slice(0, 10);
	let archivesOpen = $state(false);
	const archivedTeachers = $derived(data.teachers.filter((teacher) => {
		const membership = teacher.membership;
		return membership && (!membership.active_membership || (membership.end_date && membership.end_date < today));
	}));
</script>

<svelte:head><title>Teacher Membership | QCU Coop Admin</title></svelte:head>
<div class="admin-page">
	<p class="admin-eyebrow">Administration / Cooperative members</p>
	<h1 class="admin-title">Teacher Membership</h1>
	<p class="admin-subtitle">Manage each teacher’s cooperative membership. Teachers with an active, in-date membership receive 20% off their online store order.</p>
	<div class="membership-actions">
		<p>Membership records and archive</p>
		<button class="archives-button" type="button" aria-expanded={archivesOpen} aria-controls="membership-archives" onclick={() => (archivesOpen = !archivesOpen)}>
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 7.5h17v13h-17zM2.5 3.5h19v4h-19zM9 12h6" /></svg>
			{archivesOpen ? 'Close Archives' : 'Archives'}
			<span>{archivedTeachers.length}</span>
		</button>
	</div>
	{#if archivesOpen}
		<section class="archives-panel" id="membership-archives" aria-labelledby="archives-title">
			<div class="archives-heading"><div><p class="admin-eyebrow">Membership records</p><h2 id="archives-title">Archived memberships</h2><p>Inactive or expired teacher memberships.</p></div><span>{archivedTeachers.length} records</span></div>
			<div class="archives-table-wrap"><table><thead><tr><th>Teacher</th><th>Employee number</th><th>Membership number</th><th>Membership period</th><th>Status</th></tr></thead><tbody>
				{#each archivedTeachers as teacher (teacher.id)}
					{@const membership = teacher.membership}
					<tr><td>{[teacher.first_name, teacher.last_name].filter(Boolean).join(' ') || 'Unnamed teacher'}</td><td>{teacher.employee_no || teacher.school_id || '—'}</td><td>{membership?.membership_number}</td><td>{membership?.start_date} to {membership?.end_date || 'No end date'}</td><td><span class="archive-status">{membership?.active_membership ? 'Expired' : 'Inactive'}</span></td></tr>
				{:else}<tr><td colspan="5" class="empty">No archived memberships.</td></tr>{/each}
			</tbody></table></div>
		</section>
	{/if}
	{#if form?.success}<p class="notice" role="status">{form.message}</p>{/if}
	{#if form?.message && !form?.success}<p class="notice error" role="alert">{form.message}</p>{/if}
	<div class="table-wrap"><table>
		<thead><tr><th>Teacher</th><th>Employee number</th><th>Email</th><th>Membership record</th><th>Manage membership</th></tr></thead>
		<tbody>
			{#each data.teachers as teacher (teacher.id)}
				{@const membership = teacher.membership}
				<tr>
					<td>{[teacher.first_name, teacher.last_name].filter(Boolean).join(' ') || 'Unnamed teacher'}</td>
					<td>{teacher.employee_no || teacher.school_id || '—'}</td>
					<td>{teacher.email || '—'}</td>
					<td><strong>{membership ? (membership.active_membership ? 'active' : 'inactive') : 'No record'}</strong>{#if membership}<small>{membership.membership_number} · {membership.start_date} to {membership.end_date || 'No end date'}</small>{/if}</td>
					<td>
						<form method="POST" action="?/saveMembership" use:enhance>
							<input type="hidden" name="teacherId" value={teacher.id}/>
							{#if membership}<input type="hidden" name="membershipId" value={membership.id}/>{/if}
							<label>Membership number<input name="membershipNo" required value={membership?.membership_number || ''} placeholder="e.g. M-000123"/></label>
							<div class="dates"><label>Start date<input name="startDate" type="date" required value={membership?.start_date || today}/></label><label>End date<input name="endDate" type="date" required value={membership?.end_date || ''}/></label></div>
							<label class="check"><input name="active" type="checkbox" value="true" checked={membership?.active_membership}/><span>Active membership</span></label>
							<button type="submit">{membership ? 'Save membership' : 'Add membership'}</button>
						</form>
					</td>
				</tr>
			{:else}<tr><td colspan="5" class="empty">No teacher profiles found.</td></tr>{/each}
		</tbody>
	</table></div>
</div>

<style>
	.admin-page{padding:2rem;max-width:1400px;margin:auto}.admin-eyebrow{color:#2563eb;font-size:.72rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.admin-title{margin:.35rem 0;font-size:1.8rem;font-weight:800}.admin-subtitle{margin:0 0 1.5rem;color:#64748b}.table-wrap{overflow-x:auto;border:1px solid #dbe3ef;border-radius:.75rem;background:white}table{width:100%;border-collapse:collapse;text-align:left}th,td{padding:.9rem 1rem;border-bottom:1px solid #e8edf4;font-size:.85rem;vertical-align:top}th{color:#52647c;background:#f7f9fc;font-size:.72rem;text-transform:uppercase;letter-spacing:.06em}td{color:#1e293b}td strong{color:#1e293b}td small{display:block;margin-top:.3rem;color:#64748b}form{min-width:22rem;display:grid;gap:.55rem}label{display:grid;gap:.25rem;color:#475569;font-size:.7rem;font-weight:700}input:not([type=checkbox]){color-scheme:light;min-width:0;border:1px solid #cbd5e1;border-radius:.4rem;background:#fff;padding:.45rem .55rem;font:inherit;color:#1e293b}.dates{display:grid;grid-template-columns:1fr 1fr;gap:.5rem}.check{display:flex;align-items:center;gap:.45rem}.check input{accent-color:#2563eb}button{justify-self:start;border:0;border-radius:.45rem;background:#2563eb;padding:.55rem .8rem;color:#fff;font:inherit;font-size:.75rem;font-weight:750;cursor:pointer}.notice{margin:.75rem 0;padding:.75rem 1rem;border-radius:.5rem;background:#eff6ff;color:#1d4ed8}.notice.error{background:#fef2f2;color:#b91c1c}.empty{text-align:center;color:#64748b;padding:2rem}
	.membership-actions{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin:0 0 .75rem}.membership-actions p{margin:0;color:#64748b;font-size:.78rem}.archives-button{display:inline-flex;align-items:center;gap:.55rem;border:1px solid #31517d;border-radius:.6rem;background:linear-gradient(135deg,#1c3558,#142743);padding:.7rem .95rem;color:#eaf2ff;font-weight:800;box-shadow:0 8px 18px #07152d30}.archives-button svg{width:1rem;height:1rem;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}.archives-button span{border-radius:999px;background:#2b4f83;padding:.15rem .45rem;color:#bfdbfe;font-size:.65rem}.archives-panel{margin:0 0 1rem;border:1px solid #31517d;border-radius:.8rem;background:linear-gradient(145deg,#172a45,#12223a);padding:1rem}.archives-heading{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.8rem}.archives-heading .admin-eyebrow{margin:0 0 .25rem}.archives-heading h2{margin:0;color:#edf4ff;font-size:1rem}.archives-heading p:last-child{margin:.25rem 0 0;color:#a9bad0;font-size:.75rem}.archives-heading>span{border-radius:999px;background:#203a60;padding:.35rem .6rem;color:#bfdbfe;font-size:.7rem;font-weight:800}.archives-table-wrap{overflow-x:auto}.archives-panel th{background:#101d35}.archives-panel td,.archives-panel th{border-color:#334866;color:#dbe7fb}.archive-status{display:inline-block;border-radius:999px;background:#27354a;padding:.2rem .5rem;color:#cbd5e1;font-size:.68rem;font-weight:800}
	table{min-width:58rem}
	form input:not([type=checkbox]){box-sizing:border-box;width:100%;min-height:2.75rem}
	form button{min-height:2.75rem;padding:.65rem .85rem}
	.table-wrap{-webkit-overflow-scrolling:touch}
	@media(max-width:650px){.admin-page{padding:1.25rem 1rem 2rem}.admin-subtitle{line-height:1.5}}
	:global(html[data-theme='dark'] .table-wrap){border-color:#334866;background:#172640}
	:global(html[data-theme='dark'] .admin-subtitle){color:#b8c8dd}
	:global(html[data-theme='dark'] th){border-color:#334866;background:#101d35;color:#b8c8dd}
	:global(html[data-theme='dark'] td){border-color:#334866;color:#c9d6e8}
	:global(html[data-theme='dark'] td strong){color:#edf4ff}
	:global(html[data-theme='dark'] td small){color:#a9bad0}
	:global(html[data-theme='dark'] label){color:#b8c8dd}
	:global(html[data-theme='dark'] input:not([type=checkbox])){color-scheme:dark;border-color:#415878;background:#101d35;color:#edf4ff}
	:global(html[data-theme='dark'] input::placeholder){color:#8192ab}
	:global(html[data-theme='dark'] .empty){color:#a9bad0}
	:global(html[data-theme='dark'] .membership-actions p){color:#b8c8dd}
	:global(html[data-theme='dark'] .notice){border:1px solid #2f5289;background:#152b4a;color:#b9d5ff}
	:global(html[data-theme='dark'] .notice.error){border-color:#7f3039;background:#3b1f27;color:#fecaca}
</style>
