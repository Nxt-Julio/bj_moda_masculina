import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import { buildProductPayload, fetchCloudinaryImages, hasDuplicateCloudinaryProduct, saveImagesToFirestore, syncCloudinaryToFirestore } from '../server/cloudinarySync.js';

const isExecutedDirectly = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;

if (isExecutedDirectly) {
  syncCloudinaryToFirestore().catch((error) => {
    console.error('[sync] falha fatal:', error.message);
    process.exit(1);
  });
}

export {
  buildProductPayload,
  fetchCloudinaryImages,
  hasDuplicateCloudinaryProduct,
  saveImagesToFirestore,
  syncCloudinaryToFirestore,
};
