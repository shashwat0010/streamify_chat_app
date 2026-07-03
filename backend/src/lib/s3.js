import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";

dotenv.config();

const isAwsConfigured =
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_S3_BUCKET_NAME;

let s3Client = null;

if (isAwsConfigured) {
  s3Client = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
} else {
  console.log("AWS S3 credentials not fully configured. Using local file upload fallback mode.");
}

/**
 * Generates a pre-signed URL for client direct upload to S3.
 * If S3 is not configured, it returns a local upload URL mapping.
 * @param {string} fileName 
 * @param {string} fileType 
 * @returns {Promise<{uploadUrl: string, fileUrl: string, isMock: boolean}>}
 */
export async function generateUploadUrl(fileName, fileType) {
  const uniqueKey = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${fileName}`;

  if (isAwsConfigured && s3Client) {
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    const region = process.env.AWS_REGION || "us-east-1";
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: uniqueKey,
      ContentType: fileType,
    });

    // Signed URL expires in 15 minutes (900 seconds)
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
    const fileUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${uniqueKey}`;

    return {
      uploadUrl,
      fileUrl,
      isMock: false,
    };
  } else {
    // Graceful fallback: return a mock upload url pointing to our server's local endpoint
    const serverUrl = process.env.NODE_ENV === "production" ? "" : `http://localhost:${process.env.PORT || 5001}`;
    
    return {
      uploadUrl: `${serverUrl}/api/posts/local-upload-fallback?key=${uniqueKey}`,
      fileUrl: `${serverUrl}/uploads/${uniqueKey}`,
      isMock: true,
    };
  }
}
