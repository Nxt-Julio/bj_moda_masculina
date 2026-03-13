import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { initialStore } from '../data/initialStore';
import { parsePriceToCents } from '../utils/formatters';

const StoreContext = createContext(null);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});
const adminEmails = new Set(
  String(import.meta.env.VITE_ADMIN_EMAILS || 'bjmodasocial@gmail.com,admin@bjmodas.com')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
);

function nowIso() {
  return new Date().toISOString();
}

function normalizeProduct(productId, data) {
  return {
    id: productId,
    ...data,
    name: data.name ?? data.nome ?? '',
    description: data.description ?? data.descricao ?? '',
    priceCents: data.priceCents ?? Math.round(Number(data.preco || 0) * 100),
    stock: data.stock ?? data.estoque ?? 0,
    imageUrl: data.imageUrl ?? data.imagemUrl ?? '',
    active: data.active ?? data.ativo ?? true,
  };
}

async function ensureSeedProducts() {
  const snapshot = await getDocs(collection(db, 'products'));
  if (!snapshot.empty) {
    return;
  }

  const batch = writeBatch(db);

  for (const product of initialStore.products) {
    batch.set(doc(db, 'products', String(product.id)), product);
  }

  await batch.commit();
}

async function ensureUserProfile(firebaseUser, fallbackName = '') {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const existingSnapshot = await getDoc(userRef);

  if (existingSnapshot.exists()) {
    return { id: existingSnapshot.id, ...existingSnapshot.data() };
  }

  const profile = {
    name: firebaseUser.displayName || fallbackName || 'Usuario',
    email: firebaseUser.email || '',
    role: adminEmails.has((firebaseUser.email || '').toLowerCase()) ? 'admin' : 'customer',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  await setDoc(userRef, profile);
  return { id: firebaseUser.uid, ...profile };
}

export function StoreProvider({ children }) {
  const [notice, setNotice] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isProductsReady, setIsProductsReady] = useState(false);

  useEffect(() => {
    ensureSeedProducts().catch((error) => {
      setNotice({ type: 'error', text: error.message || 'Nao foi possivel preparar os produtos iniciais.' });
    });
  }, []);

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch(() => {
      setNotice({ type: 'error', text: 'Nao foi possivel configurar a persistencia da sessao.' });
    });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          setCurrentUser(null);
          return;
        }

        const profile = await ensureUserProfile(firebaseUser);
        setCurrentUser({
          id: firebaseUser.uid,
          name: profile.name || firebaseUser.displayName || 'Usuario',
          email: firebaseUser.email || profile.email || '',
          role: profile.role || 'customer',
        });
      } catch (error) {
        setNotice({ type: 'error', text: error.message || 'Falha ao carregar o perfil do usuario.' });
      } finally {
        setIsBootstrapping(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const productsQuery = query(collection(db, 'products'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      productsQuery,
      (snapshot) => {
        setProducts(snapshot.docs.map((item) => normalizeProduct(item.id, item.data())));
        setIsProductsReady(true);
      },
      (error) => {
        setNotice({ type: 'error', text: error.message || 'Falha ao carregar os produtos.' });
        setIsProductsReady(true);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setOrders([]);
      setUsers([]);
      if (isProductsReady) {
        setIsBootstrapping(false);
      }
      return undefined;
    }

    const ordersQuery =
      currentUser.role === 'admin'
        ? query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
        : query(collection(db, 'orders'), where('userId', '==', currentUser.id), orderBy('createdAt', 'desc'));

    const unsubscribeOrders = onSnapshot(
      ordersQuery,
      (snapshot) => {
        setOrders(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
      },
      (error) => {
        setNotice({ type: 'error', text: error.message || 'Falha ao carregar os pedidos.' });
      }
    );

    let unsubscribeUsers = () => {};

    if (currentUser.role === 'admin') {
      const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      unsubscribeUsers = onSnapshot(
        usersQuery,
        (snapshot) => {
          setUsers(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
        },
        (error) => {
          setNotice({ type: 'error', text: error.message || 'Falha ao carregar os usuarios.' });
        }
      );
    }

    setIsBootstrapping(false);

    return () => {
      unsubscribeOrders();
      unsubscribeUsers();
    };
  }, [currentUser, isProductsReady]);

  const activeProducts = useMemo(() => products.filter((product) => product.active), [products]);
  const customerOrders = useMemo(() => orders, [orders]);
  const adminOrders = useMemo(() => orders, [orders]);

  const adminStats = useMemo(() => {
    const revenueCents = orders.filter((order) => order.status !== 'cancelado').reduce((sum, order) => sum + order.totalCents, 0);

    return {
      products: products.length,
      customers: users.filter((user) => user.role === 'customer').length,
      orders: orders.length,
      revenueCents,
    };
  }, [orders, products.length, users]);

  const clearNotice = () => setNotice(null);
  const pushNotice = (type, text) => setNotice({ type, text });

  const login = async ({ email, password }) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const result = await signInWithEmailAndPassword(auth, normalizedEmail, password);
    const profile = await ensureUserProfile(result.user);

    pushNotice('success', `Bem-vindo, ${profile.name || result.user.displayName || 'usuario'}.`);
    return {
      id: result.user.uid,
      name: profile.name || result.user.displayName || 'Usuario',
      email: result.user.email || normalizedEmail,
      role: profile.role || 'customer',
    };
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const profile = await ensureUserProfile(result.user);

      pushNotice('success', `Bem-vindo, ${profile.name || result.user.displayName || 'usuario'}.`);
      return {
        id: result.user.uid,
        name: profile.name || result.user.displayName || 'Usuario',
        email: result.user.email || profile.email || '',
        role: profile.role || 'customer',
      };
    } catch (error) {
      if (
        error?.code === 'auth/popup-blocked' ||
        error?.code === 'auth/popup-closed-by-user' ||
        error?.code === 'auth/cancelled-popup-request'
      ) {
        await signInWithRedirect(auth, googleProvider);
        return null;
      }

      throw error;
    }
  };

  const register = async ({ name, email, password }) => {
    if (!name || !email || !password || password.length < 6) {
      throw new Error('Preencha os dados corretamente (senha com 6+ caracteres).');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const result = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
    await updateProfile(result.user, { displayName: name.trim() });
    await ensureUserProfile(result.user, name.trim());

    pushNotice('success', 'Cadastro realizado com sucesso.');
    return result.user;
  };

  const logout = async () => {
    await signOut(auth);
    pushNotice('success', 'Sessao encerrada com sucesso.');
  };

  const createOrder = async (productId, quantity) => {
    if (!currentUser || currentUser.role !== 'customer') {
      throw new Error('Faca login como cliente para concluir a compra.');
    }

    const normalizedQuantity = Number(quantity);
    if (!Number.isInteger(normalizedQuantity) || normalizedQuantity <= 0) {
      throw new Error('Quantidade invalida.');
    }

    await runTransaction(db, async (transaction) => {
      const productRef = doc(db, 'products', String(productId));
      const productSnapshot = await transaction.get(productRef);

      if (!productSnapshot.exists()) {
        throw new Error('Produto nao encontrado.');
      }

      const product = productSnapshot.data();

      if (!product.active) {
        throw new Error('Produto indisponivel.');
      }

      if (product.stock < normalizedQuantity) {
        throw new Error('Estoque insuficiente para este pedido.');
      }

      const createdAt = nowIso();
      const orderRef = doc(collection(db, 'orders'));

      transaction.update(productRef, {
        stock: product.stock - normalizedQuantity,
        updatedAt: createdAt,
      });

      transaction.set(orderRef, {
        userId: currentUser.id,
        customerName: currentUser.name,
        customerEmail: currentUser.email,
        totalCents: product.priceCents * normalizedQuantity,
        status: 'novo',
        createdAt,
        items: [
          {
            productId: String(productId),
            productName: product.name,
            quantity: normalizedQuantity,
            unitPriceCents: product.priceCents,
          },
        ],
      });
    });

    pushNotice('success', 'Pedido realizado com sucesso.');
  };

  const saveProduct = async (payload, productId = null) => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Acesso restrito ao administrador.');
    }

    const priceCents = parsePriceToCents(payload.price);
    const stock = Number(payload.stock);

    if (!payload.name || priceCents === null || !Number.isInteger(stock) || stock < 0) {
      throw new Error('Dados invalidos para salvar o produto.');
    }

    const timestamp = nowIso();
    const data = {
      name: payload.name.trim(),
      nome: payload.name.trim(),
      description: payload.description.trim(),
      descricao: payload.description.trim(),
      priceCents,
      preco: priceCents / 100,
      stock,
      estoque: stock,
      imageUrl: payload.imageUrl.trim(),
      imagemUrl: payload.imageUrl.trim(),
      active: payload.active,
      ativo: payload.active,
      updatedAt: timestamp,
    };

    if (productId) {
      await setDoc(doc(db, 'products', String(productId)), data, { merge: true });
      pushNotice('success', 'Produto atualizado com sucesso.');
      return;
    }

    const newRef = doc(collection(db, 'products'));
    await setDoc(newRef, {
      ...data,
      createdAt: timestamp,
    });
    pushNotice('success', 'Produto criado com sucesso.');
  };

  const importProductsBatch = async (items) => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Acesso restrito ao administrador.');
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Nenhum produto informado para importacao.');
    }

    const batch = writeBatch(db);
    const timestamp = nowIso();

    for (const item of items) {
      const newRef = doc(collection(db, 'products'));
      batch.set(newRef, {
        name: item.name,
        description: item.description || '',
        priceCents: item.priceCents,
        stock: item.stock,
        imageUrl: item.imageUrl,
        active: item.active,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }

    await batch.commit();
    pushNotice('success', `${items.length} produto(s) importado(s) com sucesso.`);
  };

  const syncCloudinaryProducts = async () => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Acesso restrito ao administrador.');
    }

    if (!auth.currentUser) {
      throw new Error('Sessao expirada. Faca login novamente.');
    }

    const idToken = await auth.currentUser.getIdToken();
    const response = await fetch('/api/admin/sync-cloudinary', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || 'Falha ao sincronizar imagens do Cloudinary.');
    }

    pushNotice(
      'success',
      `Sincronizacao concluida: ${payload.created} criado(s), ${payload.skipped} ja existente(s), ${payload.errors} erro(s).`
    );

    return payload;
  };

  const deleteProduct = async (productId) => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Acesso restrito ao administrador.');
    }

    await deleteDoc(doc(db, 'products', String(productId)));
    pushNotice('success', 'Produto removido com sucesso.');
  };

  const updateOrderStatus = async (orderId, nextStatus) => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Acesso restrito ao administrador.');
    }

    const allowedStatuses = new Set(['novo', 'pago', 'enviado', 'cancelado']);
    if (!allowedStatuses.has(nextStatus)) {
      throw new Error('Status invalido.');
    }

    await runTransaction(db, async (transaction) => {
      const orderRef = doc(db, 'orders', String(orderId));
      const orderSnapshot = await transaction.get(orderRef);

      if (!orderSnapshot.exists()) {
        throw new Error('Pedido nao encontrado.');
      }

      const order = orderSnapshot.data();
      if (order.status === 'cancelado' && nextStatus !== 'cancelado') {
        throw new Error('Pedido cancelado nao pode ser reativado.');
      }

      transaction.update(orderRef, { status: nextStatus });

      if (order.status !== 'cancelado' && nextStatus === 'cancelado') {
        for (const item of order.items || []) {
          const productRef = doc(db, 'products', String(item.productId));
          const productSnapshot = await transaction.get(productRef);

          if (!productSnapshot.exists()) continue;

          const product = productSnapshot.data();
          transaction.update(productRef, {
            stock: product.stock + item.quantity,
            updatedAt: nowIso(),
          });
        }
      }
    });

    pushNotice('success', 'Status do pedido atualizado.');
  };

  const value = {
    notice,
    currentUser,
    products,
    activeProducts,
    customerOrders,
    adminOrders,
    adminStats,
    isBootstrapping,
    login,
    loginWithGoogle,
    register,
    logout,
    createOrder,
    saveProduct,
    importProductsBatch,
    syncCloudinaryProducts,
    deleteProduct,
    updateOrderStatus,
    clearNotice,
    pushNotice,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore deve ser usado dentro de StoreProvider.');
  }
  return context;
}
