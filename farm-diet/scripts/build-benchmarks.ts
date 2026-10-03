import ExcelJS from 'exceljs';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { CATEGORIES, calculateNineCategories, median, netProfitRate, numeric, selectTop10, sumCosts, MIN_COHORT, type Costs, type Benchmark, type BenchmarkData } from '../src/lib/farm';

async function main() {

const sourceDir = process.env.FARM_DIET_RAW_DIR ?? path.resolve('data/raw');
const dataPath = process.env.FARM_DIET_DATA_FILE ?? path.join(sourceDir, '박대헌_시설채소_수박 외 10개 품목(2015-2024).xlsx');
const codebookPath = process.env.FARM_DIET_CODEBOOK_FILE ?? path.join(sourceDir, '3. 농산물소득조사_시설채소_변수코드북_2015-2024.xlsx');
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile(dataPath);
const sheet = workbook.getWorksheet('2024년');
if (!sheet) throw new Error('필수 시트 2024년이 없습니다.');
const headers = Array.from({ length: sheet.columnCount }, (_, i) => String(sheet.getRow(1).getCell(i + 1).value ?? ''));
const required = ['조사표번호','도명','시군명','작목명','기준면적','농가고유번호','총수입_금액','순수익_금액','소득_금액','경영비_비용','생산비_비용','소농구비_비용','기타비용_비용', ...CATEGORIES.flatMap(c => [...c.fields])];
for (const key of required) if (headers.filter(h => h === key).length !== 1) throw new Error(`필수 헤더 누락 또는 중복: ${key}`);
const codebook = new ExcelJS.Workbook(); await codebook.xlsx.readFile(codebookPath);
const definitions = codebook.getWorksheet('시설채소_2023-2024');
if (!definitions || definitions.rowCount - 1 !== headers.length) throw new Error('코드북 변수 수가 원본과 다릅니다.');
headers.forEach((header, i) => { if (String(definitions.getRow(i + 2).getCell(2).value).trim() !== header.trim()) throw new Error(`코드북 헤더 불일치: ${i + 1}`); });
type Raw = { row: number; fields: Record<string, unknown> };
const raw: Raw[] = [];
for (let n = 3; n <= sheet.rowCount; n++) {
  if (!sheet.getRow(n).hasValues) continue;
  const fields = Object.fromEntries(required.map(key => [key, sheet.getRow(n).getCell(headers.indexOf(key) + 1).value]));
  raw.push({ row: n, fields });
}
const identityCounts = new Map<string, number>(); const formCounts = new Map<string, number>();
for (const r of raw) {
  const key = JSON.stringify([r.fields['농가고유번호'], r.fields['작목명']]);
  identityCounts.set(key, (identityCounts.get(key) ?? 0) + 1);
  const form = String(r.fields['조사표번호']); formCounts.set(form, (formCounts.get(form) ?? 0) + 1);
}
type Valid = { crop: string; region: string; farmer: string; revenue: number; net: number; rate: number; costs: Costs; omitted: number };
const valid: Valid[] = []; const exclusions: { row: number; reason: string }[] = []; let blankCount = 0;
for (const { row, fields } of raw) {
  try {
    if (numeric(fields['기준면적']) !== 300) throw new Error('기준면적 300평 불일치');
    const crop = String(fields['작목명'] ?? '').trim(); const region = String(fields['도명'] ?? '').trim(); const farmer = String(fields['농가고유번호'] ?? '').trim(); const form = String(fields['조사표번호'] ?? '').trim();
    if (!crop || !region || !farmer || !form) throw new Error('필수 식별값 누락');
    if (identityCounts.get(JSON.stringify([fields['농가고유번호'], fields['작목명']]))! > 1) throw new Error('동일 농가·작목 식별 충돌: 관련 조사표 모두 보류');
    if (formCounts.get(form)! > 1) throw new Error('조사표번호 중복');
    const revenue = numeric(fields['총수입_금액']); const net = numeric(fields['순수익_금액']); const income = numeric(fields['소득_금액']); const operating = numeric(fields['경영비_비용']); const production = numeric(fields['생산비_비용']);
    if (revenue === null || revenue <= 0 || net === null || income === null || operating === null || production === null) throw new Error('성과지표 누락 또는 총수입 비양수');
    if (numeric(fields['자가노동비_비용']) === null) throw new Error('자가노동비 누락: 기회비용·순위 검증 불가');
    for (const key of [...CATEGORIES.flatMap(c => [...c.fields]),'소농구비_비용','기타비용_비용']) {
      if (fields[key] !== null && fields[key] !== undefined && numeric(fields[key]) === null) throw new Error(`숫자 변환 불가: ${key}`);
      if ((numeric(fields[key]) ?? 0) < 0) throw new Error(`음수 비용: ${key}`);
    }
    const costs = calculateNineCategories(fields, true);
    const omitted = (numeric(fields['소농구비_비용']) ?? 0) + (numeric(fields['기타비용_비용']) ?? 0);
    // 빈 비용은 회계 총액을 재현할 때만 구조적 무투입 후보로 허용합니다. 임의 추정하지 않습니다.
    const residuals = [revenue - operating - income, revenue - production - net, operating - (sumCosts(costs) - costs.opportunity + omitted), production - operating - costs.opportunity];
    if (residuals.some(v => Math.abs(v) > 5)) throw new Error('회계 관계 검산 실패(허용오차 5원)');
    blankCount += CATEGORIES.flatMap(c => [...c.fields]).filter(key => numeric(fields[key]) === null).length;
    valid.push({ crop, region, farmer, revenue, net, rate: netProfitRate(net, revenue), costs, omitted });
  } catch (error) { exclusions.push({ row, reason: (error as Error).message }); }
}
function aggregate(rows: Valid[], crop: string, region: string): Benchmark {
  const top = selectTop10(rows);
  return { crop, region, cohortSize: rows.length, top10Count: top.length, top10Share: top.length / rows.length * 100,
    eligible: rows.length >= MIN_COHORT && top.length >= 5,
    medianRevenue: median(top.map(r => r.revenue)), medianNetProfit: median(top.map(r => r.net)), medianNetProfitRate: median(top.map(r => r.rate)), medianOmittedCosts: median(top.map(r => r.omitted)),
    costs: Object.fromEntries(CATEGORIES.map(c => [c.key, median(top.map(r => r.costs[c.key]))])) as Costs };
}
const crops = [...new Set(valid.map(r => r.crop))]; const regions = [...new Set(raw.map(r => String(r.fields['도명'])))];
const data: BenchmarkData & { provenance: object } = {
  year: 2024, baseAreaPyeong: 300, minCohortSize: MIN_COHORT, regions,
  quality: { rawRows: raw.length, validRows: valid.length, excludedRows: exclusions.length, uniqueFarmCount: new Set(valid.map(r => r.farmer)).size, cropCount: crops.length, blankCostCellsVerifiedAsZero: blankCount, exclusions,
    policy: ['동일 농가·작목 식별 충돌은 관련 행 모두 보류', '자가노동비 누락 행 보류', '빈 비용은 0 가정으로 회계 관계 재현(오차 5원 이내) 시에만 허용; 실제 무투입의 확정 증거는 아님', '경계 동점 전원 포함', '지역 유효 표본 50건·상위군 5건 이상'] },
  provenance: { dataFile: path.basename(dataPath), codebookFile: path.basename(codebookPath), sheet: '2024년', headerRow: 1, unitRow: 2, columns: headers.length, dataSha256: createHash('sha256').update(await readFile(dataPath)).digest('hex'), codebookSha256: createHash('sha256').update(await readFile(codebookPath)).digest('hex') },
  crops: crops.map(crop => { const rows = valid.filter(r => r.crop === crop); return { crop, national: aggregate(rows, crop, '전국'), regions: Object.fromEntries(regions.filter(region => rows.some(r => r.region === region)).map(region => [region, aggregate(rows.filter(r => r.region === region), crop, region)])) }; })
};
await mkdir('src/data', { recursive: true });
await writeFile('src/data/benchmark-2024.json', JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log(`Farm Diet benchmark build\nYear: 2024\nRaw records: ${raw.length}\nValid records: ${valid.length}\nExcluded: ${exclusions.length}\nBase area: 300 pyeong\nCrop count: ${crops.length}`);
for (const c of data.crops) console.log(`${c.crop}: cohort ${c.national.cohortSize}, top ${c.national.top10Count}`);
console.log('Regional eligible:', data.crops.flatMap(c => Object.values(c.regions).filter(r => r.eligible).map(r => `${r.region} ${r.crop} (${r.cohortSize}/${r.top10Count})`)));
console.log('Exclusions:', exclusions); console.log('benchmark-2024.json generated successfully');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
