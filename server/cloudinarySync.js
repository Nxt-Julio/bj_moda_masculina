import { v2 as cloudinary } from 'cloudinary';
import { getAdminFirestore } from './firebaseAdmin.js';

const PRODUCTS_COLLECTION = 'products';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${name}`);
  }
  return value;
}

function nowIso() {
  return new Date().toISOString();
}

function configureCloudinary() {
  cloudinary.config({
    cloud_name: requireEnv('CLOUDINARY_CLOUD_NAME'),
    api_key: requireEnv('CLOUDINARY_API_KEY'),
    api_secret: requireEnv('CLOUDINARY_API_SECRET'),
  });
}

export async function fetchCloudinaryImages(logger = console) {
  configureCloudinary();

  const resources = [];
  let nextCursor;
  let page = 1;

  do {
    const response = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'image',
      max_results: 500,
      next_cursor: nextCursor,
    });

    const pageItems = response.resources || [];
    logger.log(`[cloudinary] pagina ${page}: ${pageItems.length} imagem(ns) recebida(s)`);

    resources.push(...pageItems);
    nextCursor = response.next_cursor;
    page += 1;
  } while (nextCursor);

  return resources;
}

async function loadExistingCloudinaryPublicIds(firestore) {
  const snapshot = await firestore.collection(PRODUCTS_COLLECTION).get();
  const ids = new Set();

  snapshot.forEach((documentSnapshot) => {
    const data = documentSnapshot.data();
    if (data.cloudinaryPublicId) {
      ids.add(data.cloudinaryPublicId);
    }
  });

  return ids;
}

export function hasDuplicateCloudinaryProduct(existingPublicIds, cloudinaryPublicId) {
  return existingPublicIds.has(cloudinaryPublicId);
}

export function buildProductPayload(resource) {
  const timestamp = nowIso();

  return {
    nome: '',
    preco: 0,
    estoque: 0,
    imagemUrl: resource.secure_url,
    cloudinaryPublicId: resource.public_id,
    formato: resource.format || '',
    createdAt: timestamp,
    updatedAt: timestamp,
    origem: 'cloudinary',
    ativo: true,

    name: '',
    priceCents: 0,
    stock: 0,
    imageUrl: resource.secure_url,
    active: true,
    description: '',
    descricao: '',
  };
}

function createDeterministicDocId(cloudinaryPublicId) {
  return `cloudinary_${Buffer.from(cloudinaryPublicId).toString('base64url')}`;
}

export async function saveImagesToFirestore(firestore, resources, logger = console) {
  const existingPublicIds = await loadExistingCloudinaryPublicIds(firestore);
  let created = 0;
  let skipped = 0;
  let errors = 0;

  let batch = firestore.batch();
  let batchSize = 0;

  async function commitBatchIfNeeded(force = false) {
    if (batchSize === 0) {
      return;
    }

    if (batchSize >= 400 || force) {
      await batch.commit();
      batch = firestore.batch();
      batchSize = 0;
    }
  }

  for (const resource of resources) {
    try {
      if (!resource.secure_url || !resource.public_id) {
        throw new Error('Imagem sem secure_url ou public_id.');
      }

      if (hasDuplicateCloudinaryProduct(existingPublicIds, resource.public_id)) {
        skipped += 1;
        continue;
      }

      const productRef = firestore.collection(PRODUCTS_COLLECTION).doc(createDeterministicDocId(resource.public_id));
      batch.set(productRef, buildProductPayload(resource));
      batchSize += 1;
      created += 1;
      existingPublicIds.add(resource.public_id);

      await commitBatchIfNeeded();
    } catch (error) {
      errors += 1;
      logger.error(`[firestore] erro ao processar ${resource.public_id || 'imagem-sem-id'}: ${error.message}`);
    }
  }

  await commitBatchIfNeeded(true);

  return {
    created,
    skipped,
    errors,
  };
}

export async function syncCloudinaryToFirestore(options = {}) {
  const logger = options.logger || console;
  const firestore = options.firestore || getAdminFirestore();

  logger.log('[sync] iniciando sincronizacao Cloudinary -> Firestore');
  const resources = await fetchCloudinaryImages(logger);
  logger.log(`[sync] total de imagens encontradas: ${resources.length}`);

  const summary = await saveImagesToFirestore(firestore, resources, logger);

  logger.log('[sync] resumo final');
  logger.log(`- imagens encontradas: ${resources.length}`);
  logger.log(`- registros criados: ${summary.created}`);
  logger.log(`- registros ja existentes: ${summary.skipped}`);
  logger.log(`- erros: ${summary.errors}`);

  return {
    found: resources.length,
    ...summary,
  };
}
