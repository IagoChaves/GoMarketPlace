import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const response = await AsyncStorage.getItem('@GoMarketPlace:Products');

      if (response) {
        setProducts([...products, JSON.parse(response)]);
      }
    }

    loadProducts();
  }, [products]);

  const increment = useCallback(
    async id => {
      const filterProducts = products.filter(product => product.id !== id);

      const newProduct = products.find(product => product.id === id);

      if (newProduct) {
        newProduct.quantity += 1;

        setProducts([...filterProducts, newProduct]);
      }

      await AsyncStorage.setItem(
        '@GoMarketPlace:Products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const filterProducts = products.filter(product => product.id !== id);
      const removedProduct = products.find(product => product.id === id);

      if (removedProduct) {
        if (removedProduct.quantity > 1) {
          removedProduct.quantity -= 1;

          setProducts([...filterProducts, removedProduct]);
        } else {
          setProducts([...filterProducts]);
        }
      }
      await AsyncStorage.setItem(
        '@GoMarketPlace:Products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productIndex = products.findIndex(p => p.id === product.id);

      if (productIndex < 0) {
        setProducts(oldState => [...oldState, { ...product, quantity: 1 }]);
        await AsyncStorage.setItem(
          '@GoMarketPlace:Products',
          JSON.stringify([...products, { ...product, quantity: 1 }]),
        );
      } else {
        increment(product.id);
      }
    },
    [increment, products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
