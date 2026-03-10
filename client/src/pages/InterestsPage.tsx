/**
 * Interests Page
 * Select interests from masonry grid of categories
 * DESIGN: Icon-only boxes, green selected state, min 3 selections
 */

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { useProductsByCategory } from "@/hooks/useProducts";
import { mockCategories } from "@/lib/mockApi";
import AppLayout from "@/components/AppLayout";
import ProductGrid from "@/components/ProductGrid";
import { Button } from "@/components/ui/button";
import { Zap, Smartphone, Sparkles, Wind, Sofa, BookOpen, Hotel, Shirt, Droplet, Home, Dumbbell, Plane } from "lucide-react";

interface InterestsPageProps {
  onNavigate?: (page: string) => void;
}

export default function InterestsPage({ onNavigate }: InterestsPageProps) {
  const { user, updateInterests, setCurrentPage } = useAppStore();
  const [selected, setSelected] = useState<string[]>(user.interests || []);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    selected[0] || null
  );

  const { products, loading } = useProductsByCategory(selectedCategory, 8);

  // Update products when selection changes
  useEffect(() => {
    if (selected.length > 0) {
      setSelectedCategory(selected[0]);
    }
  }, [selected]);

  const handleToggleInterest = (categoryId: string) => {
    setSelected((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleContinue = () => {
    if (selected.length >= 3) {
      updateInterests(selected);
      setCurrentPage("home");
      if (onNavigate) {
        onNavigate("home");
      }
    }
  };

  const canContinue = selected.length >= 3;

  return (
    <AppLayout onNavigate={onNavigate}>
      <div className="space-y-12">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2 text-foreground">
            What interests you?
          </h1>
          <p className="text-lg text-muted-foreground">
            Select at least 3 categories to get personalized recommendations
          </p>
        </div>

        {/* Interest Grid */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {mockCategories.map((category) => {
              const iconMap: Record<string, React.ReactNode> = {
                Smartphone: <Smartphone size={32} />,
                Sparkles: <Sparkles size={32} />,
                Wind: <Wind size={32} />,
                Sofa: <Sofa size={32} />,
                BookOpen: <BookOpen size={32} />,
                Hotel: <Hotel size={32} />,
                Shirt: <Shirt size={32} />,
                Droplet: <Droplet size={32} />,
                Home: <Home size={32} />,
                Dumbbell: <Dumbbell size={32} />,
                Plane: <Plane size={32} />,
                Zap: <Zap size={32} />,
              };
              const isSelected = selected.includes(category.id);

              return (
                <button
                  key={category.id}
                  onClick={() => handleToggleInterest(category.id)}
                  className={`
                    flex flex-col items-center justify-center p-6 rounded-2xl
                    transition-all duration-200 border-2
                    ${
                      isSelected
                        ? "bg-primary/10 border-primary shadow-md"
                        : "bg-card border-border hover:border-primary/50"
                    }
                  `}
                >
                  <div
                    className={`mb-3 transition-colors duration-200 ${
                      isSelected ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {iconMap[category.icon] || <Zap size={32} />}
                  </div>
                  <span
                    className={`text-sm font-semibold text-center ${
                      isSelected ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {category.name}
                  </span>
                  {isSelected && (
                    <span className="text-primary mt-2 text-lg">✓</span>
                  )}
                </button>
              );
            })}
          </div>

          <p className="text-sm text-muted-foreground">
            Selected: {selected.length} / {mockCategories.length}
          </p>
        </div>

        {/* Products Preview */}
        {selectedCategory && (
          <div className="pt-8 border-t border-border">
            <ProductGrid
              products={products}
              loading={loading}
              title={`Products in ${mockCategories.find((c) => c.id === selectedCategory)?.name}`}
              onNavigateToComparison={() => {
                setCurrentPage("comparison");
                if (onNavigate) {
                  onNavigate("comparison");
                }
              }}
            />
          </div>
        )}

        {/* Continue Button */}
        <div className="flex gap-4 pt-8">
          <Button
            onClick={handleContinue}
            disabled={!canContinue}
            className={`flex-1 h-12 font-semibold text-base ${
              canContinue
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            Continue ({selected.length}/3 required)
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setCurrentPage("home");
              if (onNavigate) {
                onNavigate("home");
              }
            }}
            className="flex-1 h-12 font-semibold text-base"
          >
            Skip
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
