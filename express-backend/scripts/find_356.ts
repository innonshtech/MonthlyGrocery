import { pool } from '../src/config/db';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

async function check356() {
  const total = await pool.query('SELECT count(*) FROM products');
  const availableTrue = await pool.query('SELECT count(*) FROM products WHERE available = true');
  const availableFalse = await pool.query('SELECT count(*) FROM products WHERE available = false');
  const stockGtZero = await pool.query('SELECT count(*) FROM products WHERE stock > 0');
  const shopGroup = await pool.query('SELECT shop_id, count(*) FROM products GROUP BY shop_id');
  const cityGroup = await pool.query('SELECT city, count(*) FROM products GROUP BY city');
  const distinctSku = await pool.query('SELECT count(DISTINCT sku) FROM products');
  const distinctName = await pool.query('SELECT count(DISTINCT name) FROM products');

  console.log('Total products in DB:', total.rows[0].count);
  console.log('Distinct SKU:', distinctSku.rows[0].count);
  console.log('Distinct Name:', distinctName.rows[0].count);
  console.log('available = true:', availableTrue.rows[0].count);
  console.log('available = false:', availableFalse.rows[0].count);
  console.log('stock > 0:', stockGtZero.rows[0].count);
  console.log('shop groups:', shopGroup.rows);
  console.log('city groups:', cityGroup.rows);

  // Check Excel catalog if exists
  const excelPath = path.resolve(__dirname, '../../../monthlygrocery_sample_catalog.xlsx');
  if (fs.existsSync(excelPath)) {
    try {
      const workbook = XLSX.readFile(excelPath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);
      console.log('Excel file rows count:', rows.length);
      const noImageInExcel = rows.filter(r => !r.primary_image_url && !r.image_url && !r.images && !r.image_url_2);
      console.log('Excel file rows without image:', noImageInExcel.length);
    } catch (e: any) {
      console.log('Excel read error:', e.message);
    }
  }

  // Also check if any category sum or condition = 356
  const catRes = await pool.query('SELECT primary_category, count(*) FROM products GROUP BY primary_category');
  console.log('Category counts:', catRes.rows);

  await pool.end();
}

check356();
