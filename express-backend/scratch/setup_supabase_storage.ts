import { supabase } from '../src/config/supabase';

async function setupStorage() {
  console.log('--- Checking Supabase Storage Buckets ---');
  
  // 1. List buckets
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error('Error listing buckets:', listError.message);
    return;
  }

  console.log('Existing buckets:', buckets?.map(b => b.name));

  // 2. Ensure 'product-images' bucket exists
  const hasProductBucket = buckets?.some(b => b.name === 'product-images');
  if (!hasProductBucket) {
    console.log('Creating public bucket "product-images"...');
    const { data: newB, error: createError } = await supabase.storage.createBucket('product-images', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
    });
    if (createError) {
      console.error('Failed to create product-images bucket:', createError.message);
    } else {
      console.log('Successfully created "product-images" bucket!');
    }
  } else {
    console.log('"product-images" bucket already exists!');
  }

  // 3. Ensure 'banners' bucket exists
  const hasBannersBucket = buckets?.some(b => b.name === 'banners');
  if (!hasBannersBucket) {
    console.log('Creating public bucket "banners"...');
    const { data: newB, error: createError } = await supabase.storage.createBucket('banners', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
    });
    if (createError) {
      console.error('Failed to create banners bucket:', createError.message);
    } else {
      console.log('Successfully created "banners" bucket!');
    }
  } else {
    console.log('"banners" bucket already exists!');
  }

  // 4. List files inside product-images bucket
  const { data: files, error: filesError } = await supabase.storage.from('product-images').list('products');
  console.log('Files inside product-images/products:', files?.map(f => f.name));
}

setupStorage().then(() => process.exit(0));
