/**
 * Wishlist Page
 * Grid view of saved products with heart button
 * DESIGN: Clean grid, remove button, never blank
 */

import { useAppStore } from "@/lib/store";
import { useProductsByIds } from "@/hooks/useProducts";
import AppLayout from "@/components/AppLayout";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";

interface WishlistPageProps {
  onNavigate?: (page: string) => void;
}

export default function WishlistPage({ onNavigate }: WishlistPageProps) {
  const { wishlist, setCurrentPage } = useAppStore();
  const { products: wishlistProducts } = useProductsByIds(wishlist);

  return (
    <AppLayout onNavigate={onNavigate}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2 text-foreground">Wishlist</h1>
          <p className="text-lg text-muted-foreground">
            {wishlistProducts.length} item{wishlistProducts.length !== 1 ? "s" : ""} saved
          </p>
        </div>

        {/* Wishlist Grid */}
        {wishlistProducts.length === 0 ? (
          <div className="flex items-center justify-center py-24 bg-secondary rounded-lg">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Your wishlist is empty
              </h2>
              <p className="text-muted-foreground mb-6">
                Add products by clicking the heart icon on any product card
              </p>
              <Button
                variant="default"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => {
                  setCurrentPage("home");
                  onNavigate?.("home");
                }}
              >
                Browse Products
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {wishlistProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onNavigateToComparison={() => {
                  const { setCurrentPage } = useAppStore.getState();
                  setCurrentPage("comparison");
                  if (onNavigate) {
                    onNavigate("comparison");
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
