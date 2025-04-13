import { BlobServiceClient } from '@azure/storage-blob';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

type UploadData = Buffer | Blob | ArrayBuffer | ArrayBufferView;

// Container names
export const CONTAINERS = {
  PRODUCT_IMAGES: 'product-images',
  USER_UPLOADS: 'user-uploads',
} as const;

// Initialize the BlobServiceClient
const getBlobServiceClient = () => {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('Azure Storage connection string not found');
  }
  return BlobServiceClient.fromConnectionString(connectionString);
};

// Get a container client
const getContainerClient = (containerName: string) => {
  const blobServiceClient = getBlobServiceClient();
  return blobServiceClient.getContainerClient(containerName);
};

// Upload a file to blob storage
export const uploadBlob = async (
  containerName: string,
  blobName: string,
  data: UploadData,
  contentType?: string
) => {
  const containerClient = getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  
  let length: number;
  if (data instanceof Buffer || data instanceof ArrayBuffer) {
    length = data.byteLength;
  } else if (data instanceof Blob) {
    length = data.size;
  } else {
    length = data.byteLength;
  }
  
  await blockBlobClient.upload(data, length, {
    blobHTTPHeaders: {
      blobContentType: contentType,
      blobCacheControl: 'public, max-age=31536000', // Cache for 1 year
    },
  });

  return blockBlobClient.url;
};

// Delete a blob
export const deleteBlob = async (containerName: string, blobName: string) => {
  const containerClient = getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.delete();
};

// Get a blob URL
export const getBlobUrl = (containerName: string, blobName: string) => {
  const containerClient = getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  return blockBlobClient.url;
};

// List all blobs in a container
export const listBlobs = async (containerName: string) => {
  const containerClient = getContainerClient(containerName);
  const blobs = [];
  for await (const blob of containerClient.listBlobsFlat()) {
    blobs.push({
      name: blob.name,
      url: `${containerClient.url}/${blob.name}`,
      contentType: blob.properties.contentType,
      createdOn: blob.properties.createdOn,
      lastModified: blob.properties.lastModified,
      size: blob.properties.contentLength,
    });
  }
  return blobs;
}; 