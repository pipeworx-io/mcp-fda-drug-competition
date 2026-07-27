interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Orange Book competitive intelligence from FDA's monthly official data ZIP.
 */

const ZIP_URL = 'https://www.fda.gov/media/76860/download?attachment=';
const MAX_ZIP = 5_000_000;
const MAX_FILE = 30_000_000;

const listSchema = (key: string) => ({
  type: 'object', properties: {
    returned: { type: 'number' }, [key]: { type: 'array', items: { type: 'object' } },
    source: { type: 'string' }, dataset_updated: { type: 'string' },
  }, required: ['returned', key, 'source'],
});

const tools: McpToolExport['tools'] = [
  {
    name: 'orange_book_product_search',
    description: 'Search FDA Orange Book products by ingredient, trade name, applicant, or application number. Returns NDA/ANDA status, therapeutic-equivalence codes, RLD/reference-standard flags, strength, route, and approval date.',
    inputSchema: { type: 'object', properties: {
      query: { type: 'string', description: 'Ingredient, trade name, or applicant substring.' },
      application_number: { type: 'string', description: 'Exact NDA/ANDA application number.' },
      include_discontinued: { type: 'boolean', description: 'Include DISCN products (default false).' },
      limit: { type: 'number', description: 'Results (1-100, default 25).' },
    }},
    outputSchema: listSchema('products'),
  },
  {
    name: 'orange_book_competition_profile',
    description: 'Profile FDA Orange Book competition for an ingredient or trade name: matched applications/products, NDA versus ANDA holders, RLD/reference standards, patents, and exclusivities. Approved ANDAs indicate regulatory approval, not launch, supply, substitution, or market share.',
    inputSchema: { type: 'object', properties: {
      drug: { type: 'string', description: 'Ingredient or trade name.' },
      limit: { type: 'number', description: 'Product rows (1-100, default 50).' },
    }, required: ['drug'] },
    outputSchema: { type: 'object', properties: {
      drug: { type: 'string' }, matched_products: { type: 'number' },
      nda_applications: { type: 'number' }, anda_applications: { type: 'number' },
      applicants: { type: 'array', items: { type: 'string' } },
      products: { type: 'array', items: { type: 'object' } },
      patents: { type: 'array', items: { type: 'object' } },
      exclusivities: { type: 'array', items: { type: 'object' } },
      interpretation: { type: 'string' },
    }, required: ['drug', 'matched_products', 'nda_applications', 'anda_applications', 'applicants', 'products', 'patents', 'exclusivities', 'interpretation'] },
  },
  {
    name: 'orange_book_application_detail',
    description: 'Retrieve all FDA Orange Book product, patent, and exclusivity rows for one NDA or ANDA application. Patent and exclusivity dates are FDA listings, not a legal conclusion about enforceability or actual generic entry.',
    inputSchema: { type: 'object', properties: {
      application_number: { type: 'string', description: 'NDA/ANDA number, digits only or with prefix.' },
    }, required: ['application_number'] },
    outputSchema: { type: 'object', properties: {
      application_number: { type: 'string' }, products: { type: 'array', items: { type: 'object' } },
      patents: { type: 'array', items: { type: 'object' } }, exclusivities: { type: 'array', items: { type: 'object' } },
      source: { type: 'string' },
    }, required: ['application_number', 'products', 'patents', 'exclusivities', 'source'] },
  },
  {
    name: 'orange_book_patent_expirations',
    description: 'Find listed Orange Book patent expirations in a date window, optionally filtered by drug/applicant through matching product applications. Dates are sponsor-submitted FDA listings and do not establish freedom to operate or a certain launch date.',
    inputSchema: { type: 'object', properties: {
      from_date: { type: 'string', description: 'Start YYYY-MM-DD.' },
      to_date: { type: 'string', description: 'End YYYY-MM-DD.' },
      drug: { type: 'string', description: 'Optional ingredient, trade name, or applicant.' },
      limit: { type: 'number', description: 'Results (1-100, default 25).' },
    }, required: ['from_date', 'to_date'] },
    outputSchema: listSchema('patents'),
  },
  {
    name: 'orange_book_exclusivity_expirations',
    description: 'Find FDA Orange Book exclusivity expirations in a date window, optionally filtered by drug/applicant. Exclusivity codes have program-specific meanings; expiration alone does not guarantee generic approval or launch.',
    inputSchema: { type: 'object', properties: {
      from_date: { type: 'string', description: 'Start YYYY-MM-DD.' },
      to_date: { type: 'string', description: 'End YYYY-MM-DD.' },
      drug: { type: 'string', description: 'Optional ingredient, trade name, or applicant.' },
      limit: { type: 'number', description: 'Results (1-100, default 25).' },
    }, required: ['from_date', 'to_date'] },
    outputSchema: listSchema('exclusivities'),
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const data = await loadOrangeBook();
  switch (name) {
    case 'orange_book_product_search': return productSearch(data, args);
    case 'orange_book_competition_profile': return competitionProfile(data, args);
    case 'orange_book_application_detail': return applicationDetail(data, args);
    case 'orange_book_patent_expirations': return expirations(data, args, 'patents');
    case 'orange_book_exclusivity_expirations': return expirations(data, args, 'exclusivities');
    default: throw new Error(`Unknown tool: ${name}`);
  }
}

interface OrangeData {
  products: Array<Record<string, string>>;
  patents: Array<Record<string, string>>;
  exclusivities: Array<Record<string, string>>;
  updated: string | null;
}

function productSearch(data: OrangeData, args: Record<string, unknown>) {
  const query = stringArg(args.query)?.toLowerCase();
  const application = normalizeApplication(stringArg(args.application_number));
  if (!query && !application) throw new Error('Provide query or application_number.');
  const includeDiscontinued = args.include_discontinued === true;
  const products = data.products.filter((row) =>
    (includeDiscontinued || row.Type !== 'DISCN')
    && (!application || row.Appl_No === application)
    && (!query || [row.Ingredient, row.Trade_Name, row.Applicant, row.Applicant_Full_Name]
      .some((v) => v?.toLowerCase().includes(query)))).slice(0, intArg(args.limit, 25, 1, 100));
  return resultList('products', products.map(projectProduct), data);
}

function competitionProfile(data: OrangeData, args: Record<string, unknown>) {
  const drug = requiredString(args, 'drug');
  const q = drug.toLowerCase();
  const all = data.products.filter((row) => [row.Ingredient, row.Trade_Name]
    .some((v) => v?.toLowerCase().includes(q)));
  const applications = new Set(all.map((r) => r.Appl_No));
  const products = all.slice(0, intArg(args.limit, 50, 1, 100)).map(projectProduct);
  return {
    drug,
    matched_products: all.length,
    nda_applications: new Set(all.filter((r) => r.Appl_Type === 'N').map((r) => r.Appl_No)).size,
    anda_applications: new Set(all.filter((r) => r.Appl_Type === 'A').map((r) => r.Appl_No)).size,
    applicants: [...new Set(all.map((r) => r.Applicant_Full_Name || r.Applicant).filter(Boolean))].slice(0, 100),
    products,
    patents: data.patents.filter((r) => applications.has(r.Appl_No)).slice(0, 100).map(projectPatent),
    exclusivities: data.exclusivities.filter((r) => applications.has(r.Appl_No)).slice(0, 100).map(projectExclusivity),
    dataset_updated: data.updated,
    source: source(),
    interpretation: 'Orange Book product rows show FDA approvals, not commercial launch, current supply, market share, automatic substitutability in every jurisdiction, or patent enforceability. Multiple strengths/products can share an application and must not be counted as separate competitors.',
  };
}

function applicationDetail(data: OrangeData, args: Record<string, unknown>) {
  const application = normalizeApplication(requiredString(args, 'application_number'));
  return {
    application_number: application,
    products: data.products.filter((r) => r.Appl_No === application).map(projectProduct),
    patents: data.patents.filter((r) => r.Appl_No === application).map(projectPatent),
    exclusivities: data.exclusivities.filter((r) => r.Appl_No === application).map(projectExclusivity),
    dataset_updated: data.updated,
    source: source(),
    interpretation: 'Patent and exclusivity listings are regulatory data, not legal advice or a prediction of generic entry.',
  };
}

function expirations(data: OrangeData, args: Record<string, unknown>, kind: 'patents' | 'exclusivities') {
  const from = isoArg(args.from_date);
  const to = isoArg(args.to_date);
  if (from > to) throw new Error('from_date must not be after to_date');
  const q = stringArg(args.drug)?.toLowerCase();
  const applications = q ? new Set(data.products.filter((row) =>
    [row.Ingredient, row.Trade_Name, row.Applicant, row.Applicant_Full_Name]
      .some((v) => v?.toLowerCase().includes(q))).map((r) => r.Appl_No)) : null;
  const dateKey = kind === 'patents' ? 'Patent_Expire_Date_Text' : 'Exclusivity_Date';
  const matching = data[kind].filter((r) => {
    const value = parseFdaDate(r[dateKey]);
    return value && value >= from && value <= to && (!applications || applications.has(r.Appl_No));
  }).sort((a, b) => String(parseFdaDate(a[dateKey])).localeCompare(String(parseFdaDate(b[dateKey]))))
    .slice(0, intArg(args.limit, 25, 1, 100));
  const rows = kind === 'patents' ? matching.map(projectPatent) : matching.map(projectExclusivity);
  return resultList(kind, rows, data);
}

async function loadOrangeBook(): Promise<OrangeData> {
  const response = await fetch(ZIP_URL, { headers: { Accept: 'application/zip' } });
  if (!response.ok) throw new Error(`FDA Orange Book download failed (${response.status})`);
  const declared = Number(response.headers.get('content-length') ?? 0);
  if (declared > MAX_ZIP) throw new Error('FDA Orange Book ZIP exceeds size limit.');
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length > MAX_ZIP) throw new Error('FDA Orange Book ZIP exceeds size limit.');
  const files = await unzipTextFiles(bytes);
  const products = parseDelimited(requiredFile(files, 'products.txt'));
  const patents = parseDelimited(requiredFile(files, 'patent.txt'));
  const exclusivities = parseDelimited(requiredFile(files, 'exclusivity.txt'));
  return {
    products, patents, exclusivities,
    updated: response.headers.get('last-modified') ? new Date(response.headers.get('last-modified')!).toISOString() : null,
  };
}

async function unzipTextFiles(bytes: Uint8Array): Promise<Map<string, string>> {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0 && i >= bytes.length - 65_558; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Orange Book ZIP central directory not found.');
  const total = dv.getUint16(eocd + 10, true);
  let offset = dv.getUint32(eocd + 16, true);
  const decoder = new TextDecoder();
  const files = new Map<string, string>();
  for (let i = 0; i < total; i++) {
    if (offset + 46 > bytes.length || dv.getUint32(offset, true) !== 0x02014b50) break;
    const method = dv.getUint16(offset + 10, true);
    const compressedSize = dv.getUint32(offset + 20, true);
    const uncompressedSize = dv.getUint32(offset + 24, true);
    const nameLength = dv.getUint16(offset + 28, true);
    const extraLength = dv.getUint16(offset + 30, true);
    const commentLength = dv.getUint16(offset + 32, true);
    const localOffset = dv.getUint32(offset + 42, true);
    const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength)).toLowerCase();
    offset += 46 + nameLength + extraLength + commentLength;
    if (!name.endsWith('.txt')) continue;
    if (uncompressedSize > MAX_FILE) throw new Error('Orange Book file exceeds size limit.');
    if (localOffset + 30 > bytes.length || dv.getUint32(localOffset, true) !== 0x04034b50) continue;
    const localNameLength = dv.getUint16(localOffset + 26, true);
    const localExtraLength = dv.getUint16(localOffset + 28, true);
    const start = localOffset + 30 + localNameLength + localExtraLength;
    const payload = bytes.subarray(start, start + compressedSize);
    const text = method === 0 ? decoder.decode(payload) : method === 8 ? await inflateText(payload) : null;
    if (text == null) throw new Error(`Unsupported Orange Book ZIP compression method ${method}.`);
    if (text.length > MAX_FILE) throw new Error('Orange Book file exceeds size limit.');
    files.set(name.split('/').at(-1)!, text);
  }
  return files;
}

async function inflateText(payload: Uint8Array): Promise<string> {
  const source = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(payload); controller.close(); } });
  return new Response(source.pipeThrough(new DecompressionStream('deflate-raw'))).text();
}

function parseDelimited(text: string): Array<Record<string, string>> {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  const headers = lines.shift()?.split('~').map(normalizeHeader) ?? [];
  return lines.map((line) => Object.fromEntries(line.split('~').map((value, index) => [headers[index], value.trim()])));
}
function normalizeHeader(value: string): string {
  return value.trim().replaceAll(' ', '_').replace(/[^\w]/g, '');
}
function requiredFile(files: Map<string, string>, name: string): string {
  const value = files.get(name);
  if (!value) throw new Error(`Orange Book ZIP missing ${name}`);
  return value;
}
const projectProduct = (r: Record<string, string>) => compact({
  ingredient: r.Ingredient, dosage_form_route: r.DFRoute, trade_name: r.Trade_Name,
  applicant: r.Applicant_Full_Name || r.Applicant, strength: r.Strength,
  application_type: r.Appl_Type === 'A' ? 'ANDA' : r.Appl_Type === 'N' ? 'NDA' : r.Appl_Type,
  application_number: r.Appl_No, product_number: r.Product_No, te_code: r.TE_Code,
  approval_date: parseFdaDate(r.Approval_Date), rld: r.RLD === 'Yes', reference_standard: r.RS === 'Yes',
  marketing_status: r.Type,
});
const projectPatent = (r: Record<string, string>) => compact({
  application_number: r.Appl_No, product_number: r.Product_No, patent_number: r.Patent_No,
  expiration_date: parseFdaDate(r.Patent_Expire_Date_Text), drug_substance: r.Drug_Substance_Flag === 'Y',
  drug_product: r.Drug_Product_Flag === 'Y', use_code: r.Patent_Use_Code,
  delist_requested: r.Delist_Flag === 'Y', submission_date: parseFdaDate(r.Submission_Date),
});
const projectExclusivity = (r: Record<string, string>) => compact({
  application_number: r.Appl_No, product_number: r.Product_No,
  exclusivity_code: r.Exclusivity_Code, expiration_date: parseFdaDate(r.Exclusivity_Date),
});
function resultList(key: string, rows: unknown[], data: OrangeData) {
  return { returned: rows.length, [key]: rows, dataset_updated: data.updated, source: source() };
}
function source() { return 'FDA Orange Book monthly data files'; }
function parseFdaDate(value: string | undefined): string | null {
  if (!value || /prior to/i.test(value)) return null;
  const parsed = new Date(`${value} 00:00:00 UTC`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}
function isoArg(value: unknown): string {
  const result = requiredValue(value, 'date');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result)) throw new Error('dates must use YYYY-MM-DD');
  return result;
}
function normalizeApplication(value: string | null): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  if (!digits || digits.length > 6) throw new Error('application_number must contain up to 6 digits');
  return digits.padStart(6, '0');
}
function requiredString(args: Record<string, unknown>, key: string) { return requiredValue(args[key], key); }
function requiredValue(value: unknown, key: string): string {
  const result = stringArg(value);
  if (!result) throw new Error(`${key} is required`);
  return result;
}
function stringArg(value: unknown): string | null { return typeof value === 'string' && value.trim() ? value.trim() : null; }
function intArg(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value); return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.trunc(parsed))) : fallback;
}
function compact<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== null && v !== undefined && v !== '')) as T;
}

export default { tools, callTool, meter: { credits: 4 } } satisfies McpToolExport;
