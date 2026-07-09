import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Region and credentials come from the Lambda execution environment;
// INVOICES_BUCKET is injected by Terraform.
const client = new S3Client({});
const BUCKET = process.env.INVOICES_BUCKET ?? '';

export const putPdf = async (key: string, body: Buffer): Promise<void> => {
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: 'application/pdf',
    }),
  );
};

// The bucket is private — downloads go through short-lived presigned links.
export const presignPdf = (key: string, expiresInSeconds = 900): Promise<string> =>
  getSignedUrl(client, new GetObjectCommand({ Bucket: BUCKET, Key: key }), {
    expiresIn: expiresInSeconds,
  });

export const deletePdf = async (key: string): Promise<void> => {
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
};
