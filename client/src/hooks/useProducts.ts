/**
 * Custom hooks for product-related operations
 */

import { useEffect, useState } from "react";
import { Product, scrapeProducts, compareProducts, getTrendingProducts, getProductsByCategory, getProductsByIds } from "@/lib/mockApi";
import { ComparisonResult } from "@/lib/mockApi";

export function useTrendingProducts(limit: number = 4) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true);
        const data = await getTrendingProducts(limit);
        setProducts(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch products");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, [limit]);

  return { products, loading, error };
}

export function useProductsByCategory(category: string | null, limit: number = 4) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!category) {
      setProducts([]);
      return;
    }

    const fetchByCategory = async () => {
      try {
        setLoading(true);
        const data = await getProductsByCategory(category, limit);
        setProducts(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch products");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchByCategory();
  }, [category, limit]);

  return { products, loading, error };
}

export function useSearchProducts(query: string, category?: string, limit: number = 4) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query && !category) {
      setProducts([]);
      return;
    }

    const searchProducts = async () => {
      try {
        setLoading(true);
        const data = await scrapeProducts(query, category, limit);
        setProducts(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to search products");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, category, limit]);

  return { products, loading, error };
}

export function useCompareProducts(productIds: string[]) {
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productIds.length === 0) {
      setResult(null);
      return;
    }

    const compare = async () => {
      try {
        setLoading(true);
        const data = await compareProducts(productIds);
        setResult(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to compare products");
        setResult(null);
      } finally {
        setLoading(false);
      }
    };

    compare();
  }, [productIds]);

  return { result, loading, error };
}

export function useProductsByIds(productIds: string[]) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productIds.length === 0) {
      setProducts([]);
      return;
    }

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getProductsByIds(productIds);
        setProducts(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load products");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [productIds]);

  return { products, loading, error };
}
