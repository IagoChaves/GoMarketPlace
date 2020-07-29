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
  addToCart(product: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const previousProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (previousProducts) {
        setProducts(JSON.parse(previousProducts));
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    }

    loadProducts();
  }, [products]);

  const addToCart = useCallback(
    async product => {
      const productIndex = products.findIndex(item => item.id === product.id);

      if (productIndex === -1) {
        const newProduct = { ...product, quantity: 1 };

        setProducts(previousProducts => [...previousProducts, newProduct]);
      } else {
        const modifiedProduct: Product[] = products;
        modifiedProduct[productIndex].quantity += 1;
        setProducts([...modifiedProduct]);
      }
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const productIndex = products.findIndex(item => item.id === id);

      const newProducts: Product[] = products;

      newProducts[productIndex].quantity += 1;

      setProducts([...newProducts]);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productIndex = products.findIndex(item => item.id === id);

      const newProducts: Product[] = products;

      newProducts[productIndex].quantity -= 1;

      if (newProducts[productIndex].quantity < 1) {
        newProducts.splice(productIndex, 1);
      }

      setProducts([...newProducts]);
    },
    [products],
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
