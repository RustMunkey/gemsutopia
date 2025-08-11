import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin Supabase client with service role key
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    console.log('Testing storage connection...');
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Service key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log('Service key starts with:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...');
    
    // Test 1: Try to access the product-images bucket directly
    console.log('Testing direct bucket access...');
    
    const { data: files, error: listError } = await adminSupabase.storage
      .from('product-images')
      .list();
    
    if (listError) {
      console.error('List files error:', listError);
      return NextResponse.json({
        success: false,
        error: 'Failed to list files in bucket',
        details: listError
      });
    }
    
    console.log('Files in bucket:', files);
    
    // Test 2: List buckets
    const { data: buckets, error: bucketsError } = await adminSupabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Buckets error:', bucketsError);
      return NextResponse.json({
        success: false,
        error: 'Failed to list buckets',
        details: bucketsError
      });
    }

    console.log('Available buckets:', buckets);

    // Test 2: Check if product-images bucket exists
    const productImagesBucket = buckets?.find(b => b.id === 'product-images');
    
    if (!productImagesBucket) {
      // Create the bucket if it doesn't exist
      console.log('Creating product-images bucket...');
      
      const { data: newBucket, error: createError } = await adminSupabase.storage.createBucket('product-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
        fileSizeLimit: 5242880 // 5MB
      });

      if (createError) {
        console.error('Create bucket error:', createError);
        return NextResponse.json({
          success: false,
          error: 'Failed to create bucket',
          details: createError
        });
      }

      console.log('Bucket created:', newBucket);
    }

    // Test 3: Try to upload a test file
    console.log('Testing file upload...');
    
    const testData = new TextEncoder().encode('test file content');
    const testPath = `test/test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await adminSupabase.storage
      .from('product-images')
      .upload(testPath, testData, {
        contentType: 'text/plain'
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({
        success: false,
        error: 'Failed to upload test file',
        details: uploadError,
        buckets: buckets
      });
    }

    console.log('Test upload successful:', uploadData);

    // Clean up test file
    await adminSupabase.storage.from('product-images').remove([testPath]);

    return NextResponse.json({
      success: true,
      message: 'Storage is working correctly',
      buckets: buckets,
      testUpload: uploadData
    });

  } catch (error) {
    console.error('Storage test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Storage test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}