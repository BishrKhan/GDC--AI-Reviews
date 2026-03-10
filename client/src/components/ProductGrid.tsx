/**
 * ProductGrid Component
 * Displays products in a responsive grid/carousel
 * DESIGN: Never blank, scrollable horizontally on small screens
 */

import { Product } from "@/lib/mockApi";
import ProductCard from "./ProductCard";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  onCompare?: (productId: string) => void;
  onNavigateToComparison?: () => void;
  title?: string;
}

export default function ProductGrid({
  products,
  loading = false,
  onCompare,
  onNavigateToComparison,
  title,
}: ProductGridProps) {
  return (
    <div className="w-full">
      {title && (
        <h2 className="text-2xl font-bold mb-6 text-foreground">{title}</h2>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="w-full aspect-square rounded-2xl" />
              <Skeleton className="w-3/4 h-4" />
              <Skeleton className="w-1/2 h-4" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex items-center justify-center py-12 bg-secondary rounded-lg">
          <p className="text-muted-foreground text-center">
            No products found. Try a different search or category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onCompare={onCompare}
              onNavigateToComparison={onNavigateToComparison}
            />
          ))}
        </div>
      )}
    </div>
  );
}
