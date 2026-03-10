/**
 * ProductCard Component
 * Displays product with image, name, price, rating, and mini VS button
 * DESIGN: Green accent (#2cdb04), rounded 16px, subtle shadow, 48px+ touch targets
 */

import { Heart, Zap } from "lucide-react";
import { Product } from "@/lib/mockApi";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  product: Product;
  onCompare?: (productId: string) => void;
  onNavigateToComparison?: () => void;
}

export default function ProductCard({
  product,
  onCompare,
  onNavigateToComparison,
}: ProductCardProps) {
  const { isInWishlist, addToWishlist, removeFromWishlist, isProductSelected, toggleProductSelection, selectedProducts } = useAppStore();

  const inWishlist = isInWishlist(product.id);
  const selected = isProductSelected(product.id);

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product.id);
    }
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCompare) {
      onCompare(product.id);
    } else {
      // Calculate what the new selection will be BEFORE toggling
      const isCurrentlySelected = selectedProducts.includes(product.id);
      let updatedSelected: string[];
      
      if (isCurrentlySelected) {
        // Remove from selection
        updatedSelected = selectedProducts.filter((id) => id !== product.id);
      } else {
        // Add to selection (max 4 products)
        if (selectedProducts.length < 4) {
          updatedSelected = [...selectedProducts, product.id];
        } else {
          updatedSelected = selectedProducts;
        }
      }
      
      // Toggle the selection in store
      toggleProductSelection(product.id);
      
      // Navigate if 2+ products are now selected
      if (updatedSelected.length >= 2 && onNavigateToComparison) {
        setTimeout(onNavigateToComparison, 50);
      }
    }
  };

  return (
    <div
      className={`
        relative flex flex-col rounded-2xl overflow-hidden shadow-sm
        transition-all duration-300 hover:shadow-md
        ${selected ? "ring-2 ring-primary" : ""}
        bg-card text-card-foreground
      `}
    >
      {/* Image Container */}
      <div className="relative w-full aspect-square bg-secondary overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white transition-colors duration-200 shadow-sm"
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            size={20}
            className={`transition-colors duration-200 ${
              inWishlist ? "fill-red-500 text-red-500" : "text-gray-600"
            }`}
          />
        </button>

        {/* Mini VS Button (Green Circle) */}
        <button
          onClick={handleCompare}
          className={`
            absolute bottom-3 right-3 w-12 h-12 rounded-full
            flex items-center justify-center font-bold text-sm
            transition-all duration-200 shadow-sm
            ${
              selected
                ? "bg-primary text-white"
                : "bg-white/90 text-primary hover:bg-white"
            }
          `}
          aria-label="Add to comparison"
          title={selected ? "Remove from comparison" : "Add to comparison"}
        >
          VS
        </button>


      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col">
        {/* Brand & Category */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {product.brand}
          </span>
          <span className="text-xs text-muted-foreground">{product.category}</span>
        </div>

        {/* Product Name */}
        <h3 className="text-base font-semibold line-clamp-2 mb-3 text-foreground">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <span key={i}>
                {i < Math.floor(product.rating) ? "★" : "☆"}
              </span>
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            {product.rating.toFixed(1)}
          </span>
        </div>

        {/* Price */}
        <div className="mb-4">
          <span className="text-2xl font-bold text-foreground">
            ${product.price}
          </span>
        </div>

        {/* View on Site Button */}
        <Button
          variant="default"
          size="sm"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          asChild
        >
          <a
            href={product.amazonLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2"
          >
            <Zap size={16} />
            View on Site
          </a>
        </Button>
      </div>
    </div>
  );
}
