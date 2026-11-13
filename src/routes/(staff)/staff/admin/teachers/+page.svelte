<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	let { data, form }: PageProps = $props();
	const today = new Date().toISOString().slice(0, 10);
</script>

<svelte:head><title>Teacher Membership | QCU Coop Admin</title></svelte:head>
<div class="admin-page">
	<p class="admin-eyebrow">Administration / Cooperative members</p>
	<h1 class="admin-title">Teacher Membership</h1>
	<p class="admin-subtitle">Manage each teacher’s cooperative membership. Teachers with an active, in-date membership receive 20% off their online store order.</p>
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
					<td><strong>{membership?.status || 'No record'}</strong>{#if membership}<small>{membership.membership_no} · {membership.start_date} to {membership.end_date || 'No end date'}</small>{/if}</td>
					<td>
						<form method="POST" action="?/saveMembership" use:enhance>
							<input type="hidden" name="teacherId" value={teacher.id}/>
							{#if membership}<input type="hidden" name="membershipId" value={membership.id}/>{/if}
							<label>Membership number<input name="membershipNo" required value={membership?.membership_no || ''} placeholder="e.g. M-000123"/></label>
							<div class="dates"><label>Start date<input name="startDate" type="date" required value={membership?.start_date || today}/></label><label>End date<input name="endDate" type="date" value={membership?.end_date || ''}/></label></div>
							<label class="check"><input name="active" type="checkbox" value="true" checked={membership?.status?.toLowerCase() === 'active'}/><span>Active membership</span></label>
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
	:global(html[data-theme='dark'] .notice){border:1px solid #2f5289;background:#152b4a;color:#b9d5ff}
	:global(html[data-theme='dark'] .notice.error){border-color:#7f3039;background:#3b1f27;color:#fecaca}
</style>
