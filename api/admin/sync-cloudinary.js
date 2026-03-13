import { assertAdminByBearerToken } from '../../server/firebaseAdmin.js';
import { syncCloudinaryToFirestore } from '../../server/cloudinarySync.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metodo nao permitido.' });
  }

  try {
    const { firestore, email } = await assertAdminByBearerToken(req.headers.authorization);
    const summary = await syncCloudinaryToFirestore({ firestore });

    return res.status(200).json({
      ok: true,
      requestedBy: email,
      ...summary,
    });
  } catch (error) {
    const statusCode =
      error.message === 'Token de autorizacao ausente.' ||
      error.message === 'Token de autorizacao invalido.' ||
      error.message === 'Acesso restrito ao administrador.'
        ? 401
        : 500;

    return res.status(statusCode).json({
      ok: false,
      error: error.message || 'Falha ao sincronizar imagens do Cloudinary.',
    });
  }
}
