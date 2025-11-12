# Supabase Storage Setup Guide

## Quick Setup for Media Upload Feature

This guide will help you set up the required Supabase storage bucket for the media upload functionality.

---

## Prerequisites
- Supabase project active
- Admin access to Supabase dashboard

---

## Setup Steps

### Option 1: Using Supabase Dashboard (Easiest)

#### 1. Navigate to Storage
1. Open your Supabase project dashboard
2. Click on **Storage** in the left sidebar
3. Click **New bucket** button

#### 2. Create Bucket
- **Name**: `whatsapp-media`
- **Public bucket**: ✅ Enable (checked)
- **File size limit**: 100 MB
- **Allowed MIME types**: Leave empty (allow all)
- Click **Create bucket**

#### 3. Verify Bucket
- You should see `whatsapp-media` in the buckets list
- Public status should show "Public"
- Click on the bucket to verify it's empty

#### 4. Test Upload
- Try uploading a test image through the dashboard
- Verify you can access the public URL
- Delete the test file

---

### Option 2: Using SQL (Advanced)

#### 1. Open SQL Editor
1. Go to **SQL Editor** in Supabase dashboard
2. Click **New query**

#### 2. Create Bucket
```sql
-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'whatsapp-media',
  'whatsapp-media',
  true,
  104857600,  -- 100MB in bytes
  NULL        -- Allow all MIME types
);
```

#### 3. Set Up Policies
```sql
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'whatsapp-media'
);

-- Allow authenticated users to update their files
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'whatsapp-media')
WITH CHECK (bucket_id = 'whatsapp-media');

-- Allow authenticated users to delete their files
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'whatsapp-media');

-- Allow public read access to all files
CREATE POLICY "Allow public access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'whatsapp-media');
```

#### 4. Run Query
- Click **Run** or press `Ctrl+Enter`
- Verify success message appears
- Check **Storage** section to see the new bucket

---

## Verification

### Test 1: Bucket Exists
```sql
SELECT * FROM storage.buckets WHERE id = 'whatsapp-media';
```
**Expected**: One row with public = true

### Test 2: Policies Applied
```sql
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%whatsapp-media%';
```
**Expected**: Multiple policy rows

### Test 3: Upload via Dashboard
1. Go to Storage → whatsapp-media
2. Click **Upload file**
3. Select any small image
4. Verify upload succeeds
5. Click on file → Copy URL
6. Paste URL in browser
7. Verify image loads

---

## Folder Structure

The application will automatically create this structure:

```
whatsapp-media/
  └── media/
      ├── image/
      │   └── [uploaded image files]
      ├── video/
      │   └── [uploaded video files]
      ├── audio/
      │   └── [uploaded audio files]
      └── document/
          └── [uploaded document files]
```

**Note**: Folders are created automatically on first upload.

---

## Security Configuration

### Recommended Settings

#### 1. File Size Limits
- **Images**: 5 MB
- **Videos**: 16 MB
- **Audio**: 16 MB
- **Documents**: 100 MB

These are enforced in the application code AND at the bucket level.

#### 2. MIME Type Restrictions (Optional)
If you want to restrict file types at the bucket level:

```sql
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/png',
  'image/gif',
  'video/mp4',
  'video/3gpp',
  'audio/mpeg',
  'audio/ogg',
  'audio/aac',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]
WHERE id = 'whatsapp-media';
```

#### 3. Rate Limiting
Consider enabling rate limiting in Supabase:
- Max uploads per user per hour: 100
- Max storage per user: 500 MB

---

## Troubleshooting

### Issue: "Bucket already exists"
**Solution**: The bucket was already created. Check Storage section.

### Issue: Upload fails with "Permission denied"
**Solution**:
1. Verify bucket is public
2. Check RLS policies are applied
3. Ensure user is authenticated

### Issue: Files not accessible
**Solution**:
1. Verify bucket public status is enabled
2. Check public read policy exists
3. Test URL in incognito mode

### Issue: Large files fail
**Solution**:
1. Check bucket file size limit
2. Verify file under limit for type
3. Check network connection

---

## Maintenance

### Regular Cleanup (Recommended)

#### Option 1: Manual Cleanup
```sql
-- Delete files older than 90 days
DELETE FROM storage.objects
WHERE bucket_id = 'whatsapp-media'
  AND created_at < NOW() - INTERVAL '90 days';
```

#### Option 2: Automatic Cleanup (Edge Function)
Create a scheduled Edge Function:
```typescript
// supabase/functions/cleanup-old-media/index.ts
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const { data, error } = await supabase
    .storage
    .from('whatsapp-media')
    .list('media', {
      limit: 1000,
      sortBy: { column: 'created_at', order: 'asc' }
    });

  if (error) throw error;

  const oldFiles = data.filter(file =>
    new Date(file.created_at) < ninetyDaysAgo
  );

  for (const file of oldFiles) {
    await supabase.storage
      .from('whatsapp-media')
      .remove([`media/${file.name}`]);
  }

  return new Response(
    JSON.stringify({ deleted: oldFiles.length }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

### Monitor Storage Usage

```sql
-- Check total storage used
SELECT
  bucket_id,
  COUNT(*) as file_count,
  SUM(metadata->>'size')::bigint / 1024 / 1024 as total_mb
FROM storage.objects
WHERE bucket_id = 'whatsapp-media'
GROUP BY bucket_id;
```

---

## Cost Considerations

### Supabase Storage Pricing
- **Free Tier**: 1 GB storage
- **Pro Tier**: 100 GB included, then $0.021/GB/month
- **Bandwidth**: Free egress up to 2x storage limit

### Optimization Tips
1. Compress images before upload
2. Use appropriate video quality
3. Regular cleanup of old files
4. Monitor usage dashboard

---

## Alternative: Use External Storage

If you prefer external storage (e.g., AWS S3, Cloudflare R2):

### Update ConfigPanel.tsx
```typescript
// Replace Supabase upload with your provider
const { url } = await uploadToS3(file);
handleUpdate('mediaUrl', url);
```

### Benefits
- More control over storage
- Potentially lower costs
- Existing infrastructure integration

---

## Support

### Getting Help
1. Check Supabase docs: https://supabase.com/docs/guides/storage
2. Supabase Discord: https://discord.supabase.com
3. GitHub Issues: Report bugs in project repo

### Common Questions

**Q: Can I use a different bucket name?**
A: Yes, but update `whatsapp-media` in ConfigPanel.tsx

**Q: How do I migrate existing media?**
A: Upload through the UI or bulk import via Supabase CLI

**Q: Can I restrict upload by user role?**
A: Yes, modify RLS policies to check user role

**Q: How do I back up media files?**
A: Use Supabase CLI: `supabase storage download whatsapp-media`

---

## Next Steps

After setup:
1. ✅ Test upload in the application
2. ✅ Verify public URL access
3. ✅ Send test media via WhatsApp flow
4. ✅ Set up monitoring
5. ✅ Schedule regular cleanups

---

**Last Updated**: 2025-10-18
**Version**: 1.0
**Status**: Production Ready
