import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { initialStore } from '../data/initialStore';
import { parsePriceToCents } from '../utils/formatters';

const STORE_KEY = 'bj-vite-store';
const SESSION_KEY = 'bj-vite-session';
const StoreContext = createContext(null);

function readStorage(key, fallbackValue) {
  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallbackValue;
  } catch (_error) {
    return fallbackValue;
  }
}

function nowIso() {
  return new Date().toISOString();
}

export function StoreProvider({ children }) {
  const [store, setStore] = useState(() => readStorage(STORE_KEY, initialStore));
  const [sessionUserId, setSessionUserId] = useState(() => readStorage(SESSION_KEY, null));
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
  }, [store]);

  useEffect(() => {
    if (sessionUserId === null) {
      window.localStorage.removeItem(SESSION_KEY);
      return;
    }

    window.localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUserId));
  }, [sessionUserId]);

  const currentUser = useMemo(
    () => store.users.find((user) => user.id === sessionUserId) || null,
    [store.users, sessionUserId]
  );

  const activeProducts = useMemo(
    () => store.products.filter((product) => product.active).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [store.products]
  );

  const customerOrders = useMemo(() => {
    if (!currentUser) return [];

    return store.orders
      .filter((order) => order.userId === currentUser.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [currentUser, store.orders]);

  const adminOrders = useMemo(
    () => [...store.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [store.orders]
  );

  const adminStats = useMemo(() => {
    const revenueCents = store.orders
      .filter((order) => order.status !== 'cancelado')
      .reduce((total, order) => total + order.totalCents, 0);

    return {
      products: store.products.length,
      customers: store.users.filter((user) => user.role === 'customer').length,
      orders: store.orders.length,
      revenueCents,
    };
  }, [store.orders, store.products.length, store.users]);

  const clearNotice = () => setNotice(null);

  const pushNotice = (type, text) => {
    setNotice({ type, text });
  };

  const login = ({ email, password }) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const user = store.users.find((candidate) => candidate.email === normalizedEmail);

    if (!user || user.password !== password) {
      throw new Error('Credenciais invalidas.');
    }

    setSessionUserId(user.id);
    pushNotice('success', `Bem-vindo, ${user.name}.`);
    return user;
  };

  const register = ({ name, email, password }) => {
    if (!name || !email || !password || password.length < 6) {
      throw new Error('Preencha os dados corretamente (senha com 6+ caracteres).');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailExists = store.users.some((user) => user.email === normalizedEmail);

    if (emailExists) {
      throw new Error('Este e-mail ja esta cadastrado.');
    }

    const newUser = {
      id: store.nextIds.user,
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'customer',
    };

    setStore((currentStore) => ({
      ...currentStore,
      users: [...currentStore.users, newUser],
      nextIds: {
        ...currentStore.nextIds,
        user: currentStore.nextIds.user + 1,
      },
    }));
    setSessionUserId(newUser.id);
    pushNotice('success', 'Cadastro realizado com sucesso.');
    return newUser;
  };

  const logout = () => {
    setSessionUserId(null);
    pushNotice('success', 'Sessao encerrada com sucesso.');
  };

  const createOrder = (productId, quantity) => {
    if (!currentUser || currentUser.role !== 'customer') {
      throw new Error('Faca login como cliente para concluir a compra.');
    }

    const product = store.products.find((item) => item.id === productId && item.active);
    const normalizedQuantity = Number(quantity);

    if (!product) {
      throw new Error('Produto nao encontrado.');
    }

    if (!Number.isInteger(normalizedQuantity) || normalizedQuantity <= 0) {
      throw new Error('Quantidade invalida.');
    }

    if (product.stock < normalizedQuantity) {
      throw new Error('Estoque insuficiente para este pedido.');
    }

    const createdAt = nowIso();
    const totalCents = product.priceCents * normalizedQuantity;
    const nextOrderId = store.nextIds.order;

    const nextOrder = {
      id: nextOrderId,
      userId: currentUser.id,
      customerName: currentUser.name,
      customerEmail: currentUser.email,
      totalCents,
      status: 'novo',
      createdAt,
      items: [
        {
          productId: product.id,
          productName: product.name,
          quantity: normalizedQuantity,
          unitPriceCents: product.priceCents,
        },
      ],
    };

    setStore((currentStore) => ({
      ...currentStore,
      products: currentStore.products.map((item) =>
        item.id === productId
          ? {
              ...item,
              stock: item.stock - normalizedQuantity,
              updatedAt: createdAt,
            }
          : item
      ),
      orders: [...currentStore.orders, nextOrder],
      nextIds: {
        ...currentStore.nextIds,
        order: currentStore.nextIds.order + 1,
      },
    }));

    pushNotice('success', 'Pedido realizado com sucesso.');
    return nextOrder;
  };

  const saveProduct = (payload, productId = null) => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Acesso restrito ao administrador.');
    }

    const priceCents = parsePriceToCents(payload.price);
    const stock = Number(payload.stock);

    if (!payload.name || priceCents === null || !Number.isInteger(stock) || stock < 0) {
      throw new Error('Dados invalidos para salvar o produto.');
    }

    const timestamp = nowIso();

    if (productId) {
      let found = false;

      setStore((currentStore) => ({
        ...currentStore,
        products: currentStore.products.map((product) => {
          if (product.id !== productId) return product;
          found = true;
          return {
            ...product,
            name: payload.name.trim(),
            description: payload.description.trim(),
            priceCents,
            stock,
            imageUrl: payload.imageUrl.trim(),
            active: payload.active,
            updatedAt: timestamp,
          };
        }),
      }));

      if (!found) {
        throw new Error('Produto nao encontrado.');
      }

      pushNotice('success', 'Produto atualizado com sucesso.');
      return;
    }

    const newProduct = {
      id: store.nextIds.product,
      name: payload.name.trim(),
      description: payload.description.trim(),
      priceCents,
      stock,
      imageUrl: payload.imageUrl.trim(),
      active: payload.active,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    setStore((currentStore) => ({
      ...currentStore,
      products: [newProduct, ...currentStore.products],
      nextIds: {
        ...currentStore.nextIds,
        product: currentStore.nextIds.product + 1,
      },
    }));

    pushNotice('success', 'Produto criado com sucesso.');
  };

  const deleteProduct = (productId) => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Acesso restrito ao administrador.');
    }

    setStore((currentStore) => ({
      ...currentStore,
      products: currentStore.products.filter((product) => product.id !== productId),
    }));

    pushNotice('success', 'Produto removido com sucesso.');
  };

  const updateOrderStatus = (orderId, nextStatus) => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Acesso restrito ao administrador.');
    }

    const allowedStatuses = new Set(['novo', 'pago', 'enviado', 'cancelado']);
    if (!allowedStatuses.has(nextStatus)) {
      throw new Error('Status invalido.');
    }

    const order = store.orders.find((item) => item.id === orderId);
    if (!order) {
      throw new Error('Pedido nao encontrado.');
    }

    if (order.status === 'cancelado' && nextStatus !== 'cancelado') {
      throw new Error('Pedido cancelado nao pode ser reativado.');
    }

    const timestamp = nowIso();

    setStore((currentStore) => {
      const shouldRestoreStock = order.status !== 'cancelado' && nextStatus === 'cancelado';

      return {
        ...currentStore,
        orders: currentStore.orders.map((item) =>
          item.id === orderId
            ? {
                ...item,
                status: nextStatus,
              }
            : item
        ),
        products: shouldRestoreStock
          ? currentStore.products.map((product) => {
              const orderItem = order.items.find((item) => item.productId === product.id);
              if (!orderItem) return product;

              return {
                ...product,
                stock: product.stock + orderItem.quantity,
                updatedAt: timestamp,
              };
            })
          : currentStore.products,
      };
    });

    pushNotice('success', 'Status do pedido atualizado.');
  };

  const value = {
    currentUser,
    notice,
    activeProducts,
    products: store.products,
    customerOrders,
    adminOrders,
    adminStats,
    login,
    register,
    logout,
    createOrder,
    saveProduct,
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
