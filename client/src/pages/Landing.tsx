/**
 * Landing Page
 * Clean entry point with trending products grid
 * DESIGN: No hero section, just product grid with navigation
 */

import { useAppStore } from "@/lib/store";
import { useTrendingProducts } from "@/hooks/useProducts";
import AppLayout from "@/components/AppLayout";
import ProductGrid from "@/components/ProductGrid";

interface LandingProps {
  onNavigate?: (page: string) => void;
  onComparisonReady?: () => void;
}

export default function Landing({ onNavigate, onComparisonReady }: LandingProps) {
  const { products, loading } = useTrendingProducts(8);
  const { setCurrentPage } = useAppStore();

  return (
    <AppLayout onNavigate={onNavigate}>
      {/* Trending Products */}
      <ProductGrid
        products={products}
        loading={loading}
        title="Trending Products"
        onNavigateToComparison={() => {
          setCurrentPage("comparison");
          if (onNavigate) {
            onNavigate("comparison");
          }
        }}
      />
    </AppLayout>
  );
}
