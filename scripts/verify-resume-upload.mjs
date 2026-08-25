#!/usr/bin/env node
/**
 * Production resume-upload verification.
 *
 * Runs the real lifecycle against the live API — intent, direct PUT to R2,
 * confirm, download, delete — and checks each step actually did what it
 * claims. Nothing is mocked. If this passes, uploads genuinely work.
 *
 *   node scripts/verify-resume-upload.mjs
 *   node scripts/verify-resume-upload.mjs --api http://127.0.0.1:8000
 *
 * It creates one clearly-labelled test candidate so it can obtain a scoped
 * token the way a real person would. The resume it uploads is deleted at the
 * end; the candidate and lead rows are left behind and named "ZZ R2 VERIFY"
 * so they are obvious to remove from Django admin.
 */

const argv = process.argv.slice(2);
const apiFlag = argv.indexOf("--api");
const API = (
  apiFlag !== -1 ? argv[apiFlag + 1] : "https://usjobplacement-api.onrender.com"
).replace(/\/$/, "");

const pass = (m) => console.log(`  \x1b[32mPASS\x1b[0m  ${m}`);
const fail = (m) => {
  console.log(`  \x1b[31mFAIL\x1b[0m  ${m}`);
  failures += 1;
};
let failures = 0;

/** A genuine minimal PDF, so the server's magic-byte check has real bytes. */
function makePdf() {
  return Buffer.concat([
    Buffer.from("%PDF-1.7\n"),
    Buffer.from("R2 verification file. Safe to delete.\n".repeat(20)),
    Buffer.from("\n%%EOF"),
  ]);
}

async function json(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
  let body = null;
  try {
    body = await response.json();
  } catch {
    /* some responses have no body */
  }
  return { status: response.status, body };
}

console.log(`\nVerifying resume upload against ${API}\n`);

// ---------------------------------------------------------------- 1. health
const health = await json("/api/health/");
if (health.status !== 200) {
  console.log(`  API unreachable (${health.status}). Is the service awake?`);
  process.exit(1);
}

if (health.body?.uploads === true) {
  pass("health reports uploads: true — R2 credentials are configured");
} else {
  fail("health reports uploads: false — R2 is not configured on the server");
  console.log("\n  Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY");
  console.log("  and R2_BUCKET_NAME on Render, then redeploy.\n");
  process.exitCode = 1;
}

// ------------------------------------------------- 2. obtain a scoped token
const email = `zz-r2-verify+${Date.now()}@example.com`;
const assessment = await json("/api/assessments/", {
  method: "POST",
  body: JSON.stringify({
    full_name: "ZZ R2 VERIFY - delete me",
    email,
    work_status_pref: "other",
    target_role: "verification",
    experience_level: "3-5",
    work_mode: "remote",
    preferred_locations: "",
    answers: {},
    overall: 50,
    resume_score: 50,
    targeting_score: 50,
    ats_score: 50,
    interview_score: 50,
    website: "",
  }),
});
const token = assessment.body?.candidate_token;
if (assessment.status === 201 && token)
  pass("obtained a scoped candidate token");
else {
  fail(`could not obtain a token (${assessment.status})`);
  throw new Error("cannot continue without a token");
}
const auth = { Authorization: `Bearer ${token}` };

// ------------------------------------------------------ 3. unauthorized path
const noAuth = await json("/api/documents/", {
  method: "POST",
  body: JSON.stringify({ filename: "x.pdf", size_bytes: 100 }),
});
if (noAuth.status === 403) pass("unauthenticated upload is refused (403)");
else fail(`unauthenticated upload returned ${noAuth.status}, expected 403`);

// ------------------------------------------------------ 4. rejected filetype
const badType = await json("/api/documents/", {
  method: "POST",
  headers: auth,
  body: JSON.stringify({ filename: "virus.exe", size_bytes: 100 }),
});
if (badType.status === 400) pass("unsupported file type is refused (400)");
else fail(`.exe returned ${badType.status}, expected 400`);

// ---------------------------------------------------------------- 5. intent
const pdf = makePdf();
const intent = await json("/api/documents/", {
  method: "POST",
  headers: auth,
  body: JSON.stringify({
    filename: "r2-verification.pdf",
    content_type: "application/pdf",
    size_bytes: pdf.length,
  }),
});
if (intent.status !== 201 || !intent.body?.upload_url) {
  fail(`intent failed (${intent.status}): ${JSON.stringify(intent.body)}`);
  throw new Error("cannot continue without an upload URL");
}
pass(`presigned upload URL issued, expires in ${intent.body.expires_in}s`);
if (intent.body.upload_status === "pending")
  pass("record starts PENDING — a URL is not treated as an upload");
else fail(`record started as ${intent.body.upload_status}, expected pending`);

const resumeId = intent.body.resume_id;

// Any credential leaking into the response would be a serious defect.
const intentText = JSON.stringify(intent.body);
if (!/aws_secret|SECRET_ACCESS_KEY/i.test(intentText))
  pass("no secret credential appears in the API response");
else fail("a secret appears in the API response");

// ------------------------------------------------- 6. direct upload to R2
const put = await fetch(intent.body.upload_url, {
  method: "PUT",
  headers: { "Content-Type": "application/pdf" },
  body: pdf,
});
if (put.ok)
  pass(`file PUT directly to storage (${put.status}) — not via the API`);
else {
  fail(`direct PUT failed (${put.status})`);
  throw new Error("cannot continue without a stored object");
}

// --------------------------------------------------------------- 7. confirm
const confirm = await json(`/api/documents/${resumeId}/confirm`, {
  method: "POST",
  headers: auth,
  body: JSON.stringify({}),
});
if (confirm.status === 200 && confirm.body?.upload_status === "uploaded")
  pass(`upload confirmed, server reports ${confirm.body.size_bytes} bytes`);
else
  fail(`confirm returned ${confirm.status}: ${JSON.stringify(confirm.body)}`);

// -------------------------------------------------------------- 8. download
const download = await json(`/api/documents/${resumeId}/download`, {
  headers: auth,
});
if (download.status === 200 && download.body?.url) {
  pass(`signed download URL issued, expires in ${download.body.expires_in}s`);

  const fetched = await fetch(download.body.url);
  const bytes = Buffer.from(await fetched.arrayBuffer());
  if (bytes.equals(pdf)) pass("downloaded bytes match what was uploaded");
  else fail(`downloaded ${bytes.length} bytes, expected ${pdf.length}`);

  // The object must not be reachable without the signature.
  const unsigned = download.body.url.split("?")[0];
  const naked = await fetch(unsigned);
  if (!naked.ok)
    pass(`bucket is private — unsigned URL refused (${naked.status})`);
  else fail("THE BUCKET IS PUBLIC: the unsigned URL returned the file");
} else {
  fail(`download returned ${download.status}`);
}

// ---------------------------------------------------------------- 9. delete
const del = await json(`/api/documents/${resumeId}`, {
  method: "DELETE",
  headers: auth,
});
if (del.status === 200 && del.body?.upload_status === "deleted")
  pass("resume deleted, storage confirmed the object is gone");
else fail(`delete returned ${del.status}: ${JSON.stringify(del.body)}`);

const afterDelete = await json(`/api/documents/${resumeId}/download`, {
  headers: auth,
});
if (afterDelete.status !== 200)
  pass(`download refused after deletion (${afterDelete.status})`);
else fail("a deleted resume still produced a download URL");

// ----------------------------------------------------------------- summary
console.log(
  failures === 0
    ? `
[32mAll checks passed.[0m Resume upload works end to end in production.
` +
        `Remove the "ZZ R2 VERIFY" candidate and lead rows from Django admin.
`
    : `
[31m${failures} check(s) failed.[0m
`,
);
process.exitCode = failures === 0 ? 0 : 1;
