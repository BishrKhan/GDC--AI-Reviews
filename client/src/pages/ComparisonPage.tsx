/**
 * Comparison Page (Versus.com Style)
 * Side-by-side product comparison with breadcrumb, score circles, winner badge, and radar chart
 * DESIGN: Breadcrumb navigation, centered score circles, winner highlight, detailed specs
 */

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { useCompareProducts } from "@/hooks/useProducts";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { ChevronRight, Share2, Heart, ExternalLink, X } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

interface ComparisonPageProps {
  onNavigate?: (page: string) => void;
}

export default function ComparisonPage({ onNavigate }: ComparisonPageProps) {
  const { selectedProducts, clearSelection, isInWishlist, addToWishlist, setCurrentPage } = useAppStore();
  const { result, loading } = useCompareProducts(selectedProducts);

  if (!result || result.products.length === 0) {
    return (
      <AppLayout onNavigate={onNavigate}>
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              No Comparison Selected
            </h2>
            <p className="text-muted-foreground mb-6">
              Select 2-4 products from the grid to compare
            </p>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                setCurrentPage("home");
                if (onNavigate) onNavigate("home");
              }}
            >
              Browse Products
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Prepare radar chart data
  const radarData = result.products.map((product) => {
    const specs = product.specs as Record<string, number>;
    return {
      name: product.name,
      price: Math.min(100, (1000 - product.price) / 10), // Invert price (lower is better)
      rating: product.rating * 20, // Scale to 0-100
      performance: specs["performance"] || 70,
      design: specs["design"] || 75,
      battery: specs["battery"] || 80,
    };
  });

  return (
    <AppLayout onNavigate={onNavigate}>
      <div className="space-y-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button
            onClick={() => {
              setCurrentPage("home");
              if (onNavigate) onNavigate("home");
            }}
            className="hover:text-foreground transition-colors"
          >
            Home
          </button>
          <ChevronRight size={16} />
          <span className="text-foreground font-medium">
            {result.products[0]?.category || "Product"} Comparison
          </span>
          <ChevronRight size={16} />
          <span className="text-foreground font-medium truncate">
            {result.products.map((p) => p.name).join(" vs ")}
          </span>
        </div>

        {/* Comparison Title */}
        <div>
          <h1 className="text-4xl font-bold mb-2 text-foreground">
            {result.products.map((p) => p.name).join(" vs ")}
          </h1>
          <p className="text-lg text-muted-foreground">
            {result.facts} facts analyzed
          </p>
        </div>

        {/* Side-by-Side Product Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {result.products.map((product, index) => {
            const score = result.scores[product.id] || 0;
            const isWinner = product.id === result.winner;
            const inWishlist = isInWishlist(product.id);

            return (
              <div key={product.id} className="flex flex-col">
                {/* Score Circle & Product Image */}
                <div className="relative mb-6">
                  {/* Score Circle */}
                  <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white z-10 shadow-lg">
                    <div className="text-center">
                      <div className="text-3xl font-bold">{score}</div>
                      <div className="text-xs">Score</div>
                    </div>
                  </div>

                  {/* Winner Badge */}
                  {isWinner && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold z-10">
                      COMPARISON WINNER
                    </div>
                  )}

                  {/* Product Image */}
                  <div className="w-full aspect-square bg-secondary rounded-lg overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Product Info */}
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {product.name}
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  {product.brand}
                </p>

                {/* Price with Amazon Link */}
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 border-2 border-primary rounded-lg">
                    <span className="text-2xl font-bold text-foreground">
                      ${product.price}
                    </span>
                    <a
                      href={product.amazonLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 font-semibold text-sm"
                    >
                      amazon
                    </a>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-6">
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
                  <span className="text-sm text-muted-foreground">
                    ({product.reviewCount ?? 0} reviews)
                  </span>
                </div>

                {product.description && (
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                    {product.description}
                  </p>
                )}

                {/* Specs Preview */}
                <div className="space-y-3 mb-6 pb-6 border-b border-border">
                  {Object.entries(product.specs)
                    .slice(0, 4)
                    .map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-muted-foreground capitalize">
                          {key.replace("-", " ")}:
                        </span>
                        <span className="font-semibold text-foreground">
                          {String(value)}
                        </span>
                      </div>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-10"
                    asChild
                  >
                    <a
                      href={product.amazonLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    >
                      <ExternalLink size={16} />
                      View on Site
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-10"
                    onClick={() => addToWishlist(product.id)}
                  >
                    <Heart
                      size={16}
                      className={inWishlist ? "fill-red-500 text-red-500" : ""}
                    />
                    {inWishlist ? "Saved" : "Save"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* VS Divider */}
        {result.products.length === 2 && (
          <div className="flex items-center justify-center py-8">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
              vs
            </div>
          </div>
        )}

        {/* Comparison Title */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground">
            {result.products.length === 2
              ? `${result.products[0].name} vs ${result.products[1].name}`
              : "Product Comparison"}
          </h2>
        </div>

        {/* Radar Chart */}
        {result.products.length <= 3 && (
          <div className="bg-card border border-border rounded-lg p-8">
            <h3 className="text-xl font-bold text-foreground mb-6">
              Specifications Comparison
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis
                  dataKey="name"
                  tick={{ fill: "#666", fontSize: 12 }}
                />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                {result.products.map((product, index) => (
                  <Radar
                    key={product.id}
                    name={product.name}
                    dataKey={["price", "rating", "performance", "design", "battery"][index % 5]}
                    stroke={index === 0 ? "#2cdb04" : "#3b82f6"}
                    fill={index === 0 ? "#2cdb04" : "#3b82f6"}
                    fillOpacity={0.25}
                  />
                ))}
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Insights */}
        {result.insights.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-xl font-bold text-foreground mb-4">
              Why is {result.products[result.products.findIndex((p) => p.id === result.winner)]?.name} better?
            </h3>
            <ul className="space-y-3">
              {result.insights.map((insight, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-primary font-bold text-lg">✓</span>
                  <span className="text-foreground">{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 pt-8 border-t border-border">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
            }}
          >
            <Share2 size={18} />
            Share Comparison
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => {
              clearSelection();
              setCurrentPage("home");
              if (onNavigate) onNavigate("home");
            }}
          >
            <X size={18} />
            Clear & Compare Again
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
