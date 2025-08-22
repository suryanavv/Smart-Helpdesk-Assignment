import 'dotenv/config';

interface RegisterResponse {
	token: string;
}

interface TicketResponse {
	_id: string;
}

interface SuggestionResponse {
	_id?: string;
}

async function main() {
	const base = 'http://localhost:8080/api';

	// Register
	const reg = await fetch(`${base}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Smoke', email: 'smoke@example.com', password: 'password' }) });
	const regData = await reg.json() as RegisterResponse;
	const token = regData.token;

	// Create ticket
	const tResp = await fetch(`${base}/tickets`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ title: 'Refund needed', description: 'I need a refund for incorrect charge on my card' }) });
	const ticket = await tResp.json() as TicketResponse;

	// Triage (requires agent; simulate by hitting endpoint with same token only for smoke)
	await fetch(`${base}/agent/triage`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ ticketId: ticket._id }) });

	// Suggestion
	const sResp = await fetch(`${base}/agent/suggestion/${ticket._id}`, { headers: { Authorization: `Bearer ${token}` } });
	const suggestion = await sResp.json() as SuggestionResponse;
	// eslint-disable-next-line no-console
	console.log({ ticketId: ticket._id, suggestionFound: !!suggestion?._id });
}

void main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });


