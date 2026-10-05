// End-to-end API test. Start the backend against a THROWAWAY database first, then run:
//   API=http://localhost:5000 node tests/api.smoke.mjs
// It creates uniquely-named users, so it can be re-run safely.
const API = process.env.API || 'http://localhost:5000';
const run = Date.now().toString(36);
let passed = 0; let failed = 0;

const call = async (path, { method = 'GET', body, token } = {}) => {
  const res = await fetch(API + path, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
};
const check = (name, condition, extra = '') => {
  if (condition) { passed++; console.log(`  ok   ${name}`); } else { failed++; console.log(`  FAIL ${name} ${extra}`); }
};
const EMULATOR = !!process.env.NO_PARTIAL_INDEX; // emulators (e.g. FerretDB) lack atomic findAndModify / partial indexes
const loc = { village: 'Test Village', district: `Dist${run}`, state: 'Assam' };
const register = (name, role, extra = {}) => call('/api/user/register', { method: 'POST', body: { name, email: `${name.toLowerCase().replace(/\W/g, '')}.${run}@example.info`, password: 'secret123', role, phone: '+91 98765 43210', age: 30, address: 'Somewhere', pinCode: '781001', location: loc, ...extra } });
const login = async (name) => (await call('/api/user/login', { method: 'POST', body: { email: `${name.toLowerCase().replace(/\W/g, '')}.${run}@example.info`, password: 'secret123' } })).data;

console.log('Auth & validation');
let r = await register('Wanda Worker', 'worker', { profession: 'Carpenter', experience: 5 });
check('register worker (4+ letter TLD email accepted)', r.status === 201, JSON.stringify(r.data));
r = await register('Wanda Worker', 'worker', { profession: 'Carpenter' });
check('duplicate email -> 409', r.status === 409);
r = await call('/api/user/register', { method: 'POST', body: { name: 'X', email: `short.${run}@example.com`, password: '123', role: 'customer' } });
check('short password -> 400 (was never enforced before)', r.status === 400);
r = await call('/api/user/register', { method: 'POST', body: { name: 'X', email: { $ne: 1 }, password: 'secret123', role: 'customer' } });
check('non-string email -> 400, not 500', r.status === 400);
r = await call('/api/user/register', { method: 'POST', body: { name: 'X', email: `pin.${run}@example.com`, password: 'secret123', role: 'customer', pinCode: '12' } });
check('invalid PIN -> 400, not 500', r.status === 400, JSON.stringify(r.data));
await register('Wally Worker2', 'worker', { profession: 'Plumber', experience: 2 });
await register('Walt Worker3', 'worker', { profession: 'Carpenter', experience: 9 });
await register('Carl Customer', 'customer');
const worker3 = await login('Walt Worker3');
const worker = await login('Wanda Worker'); const worker2 = await login('Wally Worker2'); const customer = await login('Carl Customer');
check('login returns token and both _id and id', !!worker.token && !!worker.user?._id && !!worker.user?.id);
r = await call('/api/user/login', { method: 'POST', body: { email: 'nobody@example.com', password: 'x' } });
check('bad login -> 401', r.status === 401);
r = await call('/api/user/me', { token: 'garbage' });
check('bad token -> 401', r.status === 401);

console.log('Public search & privacy');
r = await call(`/api/workers?district=${loc.district}&minRate=abc&maxExperience=zzz`);
check('junk numeric filters do not crash (200)', r.status === 200, String(r.status));
check('worker search lists registered workers', r.data.workers?.length === 3);
check('public worker list hides phone and email', r.data.workers.every((w) => w.phone === undefined && w.email === undefined));
const workerId = worker.user._id;
r = await call(`/api/workers/${workerId}`);
check('public worker detail hides phone', r.status === 200 && r.data.worker.phone === undefined);
r = await call('/api/workers/not-an-id');
check('invalid worker id -> 400, not 500', r.status === 400);
r = await call('/api/workers/me', { method: 'PUT', token: worker.token, body: { profileImage: 'javascript:alert(1)' } });
check('non-image profileImage rejected', r.status === 400);
r = await call('/api/workers/me', { method: 'PUT', token: worker.token, body: { bio: 'Good carpenter', expectedRate: 'abc' } });
check('bad number in profile -> 400, not 500', r.status === 400, String(r.status));

console.log('Quick bookings');
const bookBody = { workerId, description: 'Fix door', location: loc };
const both = await Promise.all([call('/api/booking', { method: 'POST', token: customer.token, body: bookBody }), call('/api/booking', { method: 'POST', token: customer.token, body: bookBody })]);
const created = both.filter((x) => x.status === 201); const dup = both.filter((x) => x.status === 409);
// This guarantee comes from a partial unique index, which needs real MongoDB 6+ (set NO_PARTIAL_INDEX=1 for emulators that lack it)
if (process.env.NO_PARTIAL_INDEX) console.log('  skip two simultaneous identical bookings (needs MongoDB partial indexes)');
else check('two simultaneous identical bookings -> exactly one created', created.length === 1 && dup.length === 1, both.map((x) => x.status).join(','));
const bookingId = created[0]?.data.booking?._id;
if (created.length > 1) for (const extra of created.slice(1)) await call(`/api/booking/${extra.data.booking._id}/status`, { method: 'PUT', token: customer.token, body: { status: 'cancelled' } }); // emulator cleanup so later checks stay meaningful
r = await call('/api/booking/my', { token: customer.token });
check('worker phone hidden from customer while booking is pending', r.data.bookings?.find((b) => b._id === bookingId)?.worker?.phone === undefined);
r = await call(`/api/booking/${bookingId}/status`, { method: 'PUT', token: worker.token, body: { status: 'accepted' } });
check('worker accepts booking', r.status === 200);
r = await call('/api/booking/my', { token: customer.token });
check('worker phone visible once accepted', !!r.data.bookings?.find((b) => b._id === bookingId)?.worker?.phone);
r = await call(`/api/booking/${bookingId}/status`, { method: 'PUT', token: customer.token, body: { status: 'completed' } });
check('customer cannot complete a booking -> 400', r.status === 400);
r = await call(`/api/booking/${bookingId}/status`, { method: 'PUT', token: worker.token, body: { status: 'completed' } });
check('worker completes booking', r.status === 200);

console.log('Reviews');
r = await call('/api/reviews', { method: 'POST', token: customer.token, body: { bookingId, rating: 'abc' } });
check('non-numeric rating -> 400', r.status === 400);
r = await call('/api/reviews', { method: 'POST', token: customer.token, body: { bookingId, rating: 5, comment: 'Great' } });
check('review saved', r.status === 201, JSON.stringify(r.data));
r = await call('/api/reviews', { method: 'POST', token: customer.token, body: { bookingId, rating: 4 } });
check('duplicate review -> 409', r.status === 409);
r = await call(`/api/workers/${workerId}`);
check('worker rating recalculated', r.data.worker?.rating === 5 && r.data.worker?.reviewCount === 1);

console.log('Long jobs (post & apply)');
r = await call('/api/jobs', { method: 'POST', token: customer.token, body: { title: `Build shed ${run}`, description: 'Wood shed', profession: 'Carpenter', location: loc, jobType: 'contract', payment: 5000, paymentUnit: 'total', positions: 1 } });
check('customer posts job', r.status === 201, JSON.stringify(r.data));
const jobId = r.data.job?._id;
r = await call('/api/jobs', { method: 'POST', token: customer.token, body: { title: 'x', description: 'y', profession: 'z', location: { village: 'v' }, jobType: 'contract', payment: 1 } });
check('job without district/state -> 400, not 500', r.status === 400);
const apps = await Promise.all([call(`/api/jobs/${jobId}/apply`, { method: 'POST', token: worker.token, body: { message: 'Hi' } }), call(`/api/jobs/${jobId}/apply`, { method: 'POST', token: worker2.token, body: { message: 'Hi' } })]);
check('two workers apply', apps.every((a) => a.status === 201));
r = await call(`/api/jobs/${jobId}/apply`, { method: 'POST', token: worker.token, body: {} });
check('applying twice -> 409', r.status === 409);
const appIds = apps.map((a) => a.data.application._id);
const accepts = await Promise.all(appIds.map((id) => call(`/api/applications/${id}/status`, { method: 'PUT', token: customer.token, body: { status: 'accepted' } })));
const okCount = accepts.filter((a) => a.status === 200).length;
r = await call(`/api/jobs/${jobId}/applications`, { token: customer.token });
const acceptedStored = r.data.applications.filter((a) => a.status === 'accepted').length;
check('1 position + 2 simultaneous accepts -> NEVER more than 1 hired', acceptedStored <= 1 && okCount <= 1, accepts.map((a) => a.status).join(','));
if (EMULATOR) {
  if (acceptedStored === 0) { await call(`/api/applications/${appIds[0]}/status`, { method: 'PUT', token: customer.token, body: { status: 'accepted' } }); }
  console.log('  skip "exactly one winner" check (needs MongoDB atomic findOneAndUpdate)');
} else {
  check('...and exactly one is hired (a winner is always chosen)', okCount === 1 && acceptedStored === 1);
}
r = await call(`/api/jobs/${jobId}/applications`, { token: customer.token });
check('job is now hired', r.data.job.status === 'hired');
r = await call(`/api/jobs/${jobId}`);
check('hired job is hidden from the public by id', r.status === 404);
r = await call(`/api/jobs/${jobId}`, { token: customer.token });
check('owner can still open their own hired job', r.status === 200);
r = await call(`/api/jobs?district=${loc.district}&status=hired`);
check('public search ignores ?status=hired', r.data.jobs?.length === 0);
r = await call(`/api/jobs/${jobId}/status`, { method: 'PUT', token: customer.token, body: { status: 'completed' } });
check('hired -> completed', r.status === 200);
r = await call(`/api/jobs/${jobId}/status`, { method: 'PUT', token: customer.token, body: { status: 'open' } });
check('completed -> open rejected', r.status === 400);

console.log('Long jobs with several positions');
r = await call('/api/jobs', { method: 'POST', token: customer.token, body: { title: `Harvest ${run}`, description: 'Need hands', profession: 'Farmer', location: loc, jobType: 'hourly', payment: 400, paymentUnit: 'day', positions: 2 } });
const job2 = r.data.job?._id;
const apps2 = await Promise.all([worker, worker2, worker3].map((w) => call(`/api/jobs/${job2}/apply`, { method: 'POST', token: w.token, body: {} })));
const accepts2 = await Promise.all(apps2.map((a) => call(`/api/applications/${a.data.application._id}/status`, { method: 'PUT', token: customer.token, body: { status: 'accepted' } })));
r = await call(`/api/jobs/${job2}/applications`, { token: customer.token });
const accepted2 = r.data.applications.filter((a) => a.status === 'accepted').length;
check('2 positions + 3 simultaneous accepts -> NEVER more than 2 hired', accepted2 <= 2 && accepts2.filter((a) => a.status === 200).length <= 2, accepts2.map((a) => a.status).join(','));
if (!EMULATOR) check('...and exactly two are hired', accepted2 === 2 && r.data.job.status === 'hired');

console.log('Sequential accepts fill positions correctly');
r = await call('/api/jobs', { method: 'POST', token: customer.token, body: { title: `Paint ${run}`, description: 'Walls', profession: 'Painter', location: loc, jobType: 'contract', payment: 900, paymentUnit: 'day', positions: 2 } });
const job3 = r.data.job._id;
const apps3 = [];
for (const w of [worker, worker2, worker3]) apps3.push((await call(`/api/jobs/${job3}/apply`, { method: 'POST', token: w.token, body: {} })).data.application._id);
r = await call(`/api/applications/${apps3[0]}/status`, { method: 'PUT', token: customer.token, body: { status: 'accepted' } });
check('first of 2 positions accepted, job stays open', r.status === 200 && r.data.jobStatus === 'open', JSON.stringify(r.data).slice(0, 120));
r = await call(`/api/applications/${apps3[1]}/status`, { method: 'PUT', token: customer.token, body: { status: 'accepted' } });
check('second accept fills the job -> hired', r.status === 200 && r.data.jobStatus === 'hired');
r = await call(`/api/jobs/${job3}/applications`, { token: customer.token });
check('leftover pending applicant auto-rejected', r.data.applications.find((a) => a._id === apps3[2])?.status === 'rejected');
r = await call(`/api/applications/${apps3[2]}/status`, { method: 'PUT', token: customer.token, body: { status: 'accepted' } });
check('cannot accept after job is full (400/409)', r.status === 400 || r.status === 409);

console.log('Distance search by PIN code');
// 781001 Guwahati (searcher) | 781005 ~5 km | 781101 ~10 km | 784001 Tezpur ~114 km | 000001 does not exist
await register('Near Nick', 'worker', { profession: 'GeoCarpenter', experience: 1, pinCode: '781005' });
await register('Mid Mia', 'worker', { profession: 'GeoCarpenter', experience: 1, pinCode: '781101' });
await register('Far Fred', 'worker', { profession: 'GeoCarpenter', experience: 1, pinCode: '784001' });
r = await register('Lost Lee', 'worker', { profession: 'GeoCarpenter', experience: 1, pinCode: '000001' });
check('register with an unknown PIN returns a warning (not an error)', r.status === 201 && /could not locate/i.test(r.data.warning || ''));
const geoBase = `/api/workers?district=${loc.district}&profession=GeoCarpenter`;
r = await call(`${geoBase}&pinCode=781001`);
const names = (r.data.workers || []).map((w) => w.name);
check('default radius is 30 km: nearby workers included', names.includes('Near Nick') && names.includes('Mid Mia'), names.join(','));
check('...and the worker 114 km away is excluded', !names.includes('Far Fred'));
check('...and the worker with an unknown PIN is excluded and counted', !names.includes('Lost Lee') && r.data.geo?.skippedUnknownPin === 1, JSON.stringify(r.data.geo));
check('every result carries a sensible distanceKm', r.data.workers.every((w) => typeof w.distanceKm === 'number' && w.distanceKm <= 30));
check('results are sorted nearest first', r.data.workers.every((w, i, a) => i === 0 || a[i - 1].distanceKm <= w.distanceKm));
const nick = r.data.workers.find((w) => w.name === 'Near Nick');
check('781001 -> 781005 is about 5 km', nick && nick.distanceKm > 3 && nick.distanceKm < 8, String(nick?.distanceKm));
check('total reflects the filtered list', r.data.total === r.data.workers.length);
r = await call(`${geoBase}&pinCode=781001&radiusKm=10`);
check('radiusKm=10 keeps only the closer ones', r.status === 200 && r.data.workers.every((w) => w.distanceKm <= 10) && !r.data.workers.some((w) => w.name === 'Mid Mia' && w.distanceKm > 10));
r = await call(`${geoBase}&pinCode=781001&radiusKm=200`);
check('radiusKm=200 now includes Tezpur', (r.data.workers || []).some((w) => w.name === 'Far Fred'));
r = await call(`${geoBase}&pinCode=781001&radiusKm=abc`);
check('junk radius falls back to 30 km (no crash)', r.status === 200 && r.data.geo?.radiusKm === 30);
r = await call(`${geoBase}&pinCode=12`);
check('malformed PIN -> 400 with a clear message', r.status === 400 && /6 digits/.test(r.data.message));
r = await call(`${geoBase}&pinCode=000001`);
check('unknown search PIN -> 400 with a clear message', r.status === 400 && /could not find/i.test(r.data.message));
r = await call(`${geoBase}`);
check('without a PIN there is no distance filtering', r.status === 200 && r.data.workers.length === 4 && r.data.workers[0].distanceKm === undefined);
r = await call(`${geoBase}&pinCode=781001&radiusKm=200&limit=2&page=2`);
check('pagination works on distance results', r.status === 200 && r.data.count === 1 && r.data.total === 3 && r.data.pages === 2, JSON.stringify([r.data.count, r.data.total, r.data.pages]));

// Jobs: distance comes from the job's own PIN, or the poster's PIN by default (customer lives at 781001)
r = await call('/api/jobs', { method: 'POST', token: customer.token, body: { title: `Near job ${run}`, description: 'd', profession: 'GeoPlumber', location: loc, jobType: 'contract', payment: 100 } });
check('job inherits the poster PIN code', r.status === 201 && r.data.job.pinCode === '781001', JSON.stringify(r.data.job?.pinCode));
r = await call('/api/jobs', { method: 'POST', token: customer.token, body: { title: `Far job ${run}`, description: 'd', profession: 'GeoPlumber', location: loc, jobType: 'contract', payment: 100, pinCode: '784001' } });
check('job can have its own PIN code', r.status === 201 && r.data.job.pinCode === '784001');
r = await call('/api/jobs', { method: 'POST', token: customer.token, body: { title: 'bad', description: 'd', profession: 'GeoPlumber', location: loc, jobType: 'contract', payment: 100, pinCode: '12' } });
check('invalid job PIN -> 400', r.status === 400);
r = await call(`/api/jobs?district=${loc.district}&profession=GeoPlumber&pinCode=781101`);
const jt = (r.data.jobs || []).map((j) => j.title);
check('worker at 781101 sees the near job (within 30 km) with a distance', jt.includes(`Near job ${run}`) && typeof r.data.jobs[0].distanceKm === 'number', jt.join(','));
check('...but not the job in Tezpur', !jt.includes(`Far job ${run}`));
r = await call(`/api/jobs?district=${loc.district}&profession=GeoPlumber&pinCode=781101&radiusKm=200`);
check('wider radius shows both jobs', (r.data.jobs || []).length === 2);

console.log('Misc');
r = await fetch(API + '/api/user/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad json' });
check('malformed JSON -> 400', r.status === 400);
r = await call('/api/nope');
check('unknown route -> 404', r.status === 404);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
