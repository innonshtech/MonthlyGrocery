import { supabase } from '../src/config/supabase';
import { readDb, writeDb } from '../src/config/localDb';

// Grocery product images with clean product representations
const PRODUCT_IMAGE_SOURCES = [
  {
    sku_pattern: 'AASH-ATTA',
    file_name: 'aashirvaad_atta_10kg.png',
    source_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80'
  },
  {
    sku_pattern: 'FORT-MUST',
    file_name: 'fortune_mustard_oil_5l.png',
    source_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80'
  },
  {
    sku_pattern: 'TATA-SALT',
    file_name: 'tata_salt_lite_1kg.png',
    source_url: 'https://images.unsplash.com/photo-1618038483079-b86a3e40760c?w=600&auto=format&fit=crop&q=80'
  },
  {
    sku_pattern: 'AMUL-GHEE',
    file_name: 'amul_pure_ghee_1l.png',
    source_url: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=600&auto=format&fit=crop&q=80'
  },
  {
    sku_pattern: 'DAAWAT-RICE',
    file_name: 'daawat_basmati_rice_5kg.png',
    source_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80'
  },
  {
    sku_pattern: 'TATA-TOOR',
    file_name: 'tata_sampann_toor_dal_1kg.png',
    source_url: 'https://images.unsplash.com/photo-1612966608967-302915b06f2e?w=600&auto=format&fit=crop&q=80'
  },
  {
    sku_pattern: 'EVER-MASALA',
    file_name: 'everest_garam_masala_100g.png',
    source_url: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=600&auto=format&fit=crop&q=80'
  },
  {
    sku_pattern: 'TATA-TEA',
    file_name: 'tata_tea_gold_500g.png',
    source_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80'
  },
  {
    sku_pattern: 'SURF-EXCEL',
    file_name: 'surf_excel_detergent_3kg.png',
    source_url: 'https://images.unsplash.com/photo-1603052875302-d376b7c0638a?w=600&auto=format&fit=crop&q=80'
  },
  {
    sku_pattern: 'DETTOL-HW',
    file_name: 'dettol_liquid_handwash_900ml.png',
    source_url: 'https://images.unsplash.com/photo-1585998082988-067f827150a0?w=600&auto=format&fit=crop&q=80'
  },
  {
    sku_pattern: 'MAGGI-NOODLE',
    file_name: 'maggi_masala_noodles_12pack.png',
    source_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80'
  },
  {
    sku_pattern: 'BRIT-GOODDAY',
    file_name: 'britannia_good_day_600g.png',
    source_url: 'https://images.unsplash.com/photo-1558961317-19277a22f782?w=600&auto=format&fit=crop&q=80'
  },
  {
    sku_pattern: 'LIZOL-FL',
    file_name: 'lizol_floor_cleaner_2l.png',
    source_url: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&auto=format&fit=crop&q=80'
  },
  {
    sku_pattern: 'CAD-BOURN',
    file_name: 'cadbury_bournvita_1kg.png',
    source_url: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=600&auto=format&fit=crop&q=80'
  }
];

async function uploadAndSyncBucketImages() {
  console.log('=== Uploading Product PNGs to Supabase Storage Bucket ===');

  const uploadedMap: { [sku: string]: string } = {};

  for (const item of PRODUCT_IMAGE_SOURCES) {
    console.log(`Processing image for SKU pattern: ${item.sku_pattern}...`);
    try {
      // 1. Fetch image buffer from source
      const res = await fetch(item.source_url);
      if (!res.ok) {
        console.warn(`Failed to fetch source image for ${item.file_name}`);
        continue;
      }
      const buffer = Buffer.from(await res.arrayBuffer());

      // 2. Upload to Supabase bucket 'product-images'
      const filePath = `products/${item.file_name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, buffer, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) {
        console.error(`Upload error for ${item.file_name}:`, uploadError.message);
        continue;
      }

      // 3. Get the permanent public Supabase Storage CDN URL
      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      console.log(`✓ Uploaded to Supabase Bucket: ${publicUrlData.publicUrl}`);
      uploadedMap[item.sku_pattern] = publicUrlData.publicUrl;
    } catch (err: any) {
      console.error(`Exception during upload for ${item.file_name}:`, err.message);
    }
  }

  // 4. Update Supabase 'products' table with Bucket URLs
  console.log('\n--- Syncing Supabase Database Table "products" ---');
  const { data: dbProducts, error: fetchError } = await supabase.from('products').select('id, sku');
  
  if (!fetchError && dbProducts) {
    for (const prod of dbProducts) {
      for (const [pattern, bucketUrl] of Object.entries(uploadedMap)) {
        if (prod.sku && prod.sku.includes(pattern)) {
          const { error: updateError } = await supabase
            .from('products')
            .update({ image_url: bucketUrl })
            .eq('id', prod.id);
          
          if (!updateError) {
            console.log(`Updated product [${prod.sku}] with Supabase Bucket URL`);
          }
        }
      }
    }
  }

  // 5. Update localDb banners if needed
  console.log('\n--- Syncing Local Database Banners with Supabase Bucket ---');
  const localDb = readDb();
  if (localDb.promotional_banners && localDb.promotional_banners.length > 0) {
    localDb.promotional_banners[0].image_url = 'https://xlnebedclqcmgfbfqkbm.supabase.co/storage/v1/object/public/banners/banner_staples_discount.png';
    localDb.promotional_banners[1].image_url = 'https://xlnebedclqcmgfbfqkbm.supabase.co/storage/v1/object/public/banners/banner_free_delivery.png';
    writeDb(localDb);
    console.log('Local DB banners successfully updated!');
  }

  console.log('\n✅ Supabase Storage Bucket setup and Product PNG image mapping completed successfully!');
}

uploadAndSyncBucketImages().then(() => process.exit(0));
