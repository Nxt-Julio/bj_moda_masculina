import { v2 as cloudinary } from 'cloudinary';
import { getAdminFirestore } from './firebaseAdmin.js';
import { buildTaxonomyFields, hasStoredTaxonomy } from '../src/data/catalogTaxonomy.js';

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

async function loadExistingCloudinaryProducts(firestore) {
  const snapshot = await firestore.collection(PRODUCTS_COLLECTION).get();
  const products = new Map();

  snapshot.forEach((documentSnapshot) => {
    const data = documentSnapshot.data();
    if (data.cloudinaryPublicId) {
      products.set(data.cloudinaryPublicId, {
        id: documentSnapshot.id,
        data,
      });
    }
  });

  return products;
}

export function hasDuplicateCloudinaryProduct(existingProducts, cloudinaryPublicId) {
  return existingProducts.has(cloudinaryPublicId);
}

export function buildProductPayload(resource) {
  const timestamp = nowIso();
  const taxonomy = buildTaxonomyFields({ fallbackText: resource.public_id });

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
    ...taxonomy,

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
  const existingProducts = await loadExistingCloudinaryProducts(firestore);
  let created = 0;
  let skipped = 0;
  let updated = 0;
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

      const existing = existingProducts.get(resource.public_id);
      if (existing) {
        const taxonomy = buildTaxonomyFields({ fallbackText: resource.public_id });

        if (!hasStoredTaxonomy(existing.data) && taxonomy.groupSlug && taxonomy.subgroupSlug) {
          batch.set(
            firestore.collection(PRODUCTS_COLLECTION).doc(existing.id),
            {
              ...taxonomy,
              updatedAt: nowIso(),
            },
            { merge: true }
          );
          batchSize += 1;
          updated += 1;
          await commitBatchIfNeeded();
          continue;
        }

        skipped += 1;
        continue;
      }

      const productRef = firestore.collection(PRODUCTS_COLLECTION).doc(createDeterministicDocId(resource.public_id));
      batch.set(productRef, buildProductPayload(resource));
      batchSize += 1;
      created += 1;
      existingProducts.set(resource.public_id, { id: productRef.id, data: buildProductPayload(resource) });

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
    updated,
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
  logger.log(`- registros atualizados: ${summary.updated}`);
  logger.log(`- erros: ${summary.errors}`);

  return {
    found: resources.length,
    ...summary,
  };
}
