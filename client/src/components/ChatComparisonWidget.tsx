import { ExternalLink } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ComparisonResult, Product } from "@/lib/mockApi";

interface ChatComparisonWidgetProps {
  comparison: ComparisonResult;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatSpecLabel(specKey: string) {
  return specKey
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function getSpecKeys(products: Product[]) {
  return Array.from(new Set(products.flatMap((product) => Object.keys(product.specs || {})))).slice(0, 6);
}

function getStandoutPoints(comparison: ComparisonResult, product: Product) {
  const highlights = comparison.productHighlights?.[product.id]?.filter(Boolean) || [];
  if (highlights.length > 0) {
    return highlights.slice(0, 3);
  }

  return [
    `Rating signal: ${product.rating.toFixed(1)}/5 from ${product.reviewCount ?? 0} reviews.`,
    `Price point: ${formatCurrency(product.price)}.`,
  ];
}

export default function ChatComparisonWidget({ comparison }: ChatComparisonWidgetProps) {
  const products = comparison.products.slice(0, 2);
  const specKeys = getSpecKeys(products);

  const rows = [
    {
      label: "Price",
      render: (product: Product) => formatCurrency(product.price),
    },
    {
      label: "Rating",
      render: (product: Product) => `${product.rating.toFixed(1)}/5`,
    },
    {
      label: "Reviews",
      render: (product: Product) => `${product.reviewCount ?? 0}`,
    },
    {
      label: "Brand",
      render: (product: Product) => product.brand || "Unknown",
    },
    {
      label: "Why it stands out",
      render: (product: Product) => (
        <div className="space-y-2">
          {getStandoutPoints(comparison, product).map((point) => (
            <p key={`${product.id}-${point}`} className="text-sm leading-6 text-slate-700">
              {point}
            </p>
          ))}
        </div>
      ),
      className: "min-w-[220px] whitespace-normal text-sm leading-6",
    },
    ...specKeys.map((specKey) => ({
      label: formatSpecLabel(specKey),
      render: (product: Product) => String(product.specs?.[specKey] ?? "—"),
      className: "whitespace-normal",
    })),
    {
      label: "Link",
      render: (product: Product) => (
        <a
          href={product.amazonLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#1f7e05] hover:text-[#165a03]"
        >
          Open product
          <ExternalLink className="h-4 w-4" />
        </a>
      ),
    },
  ];

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
      <Table className="table-fixed w-full">
          <TableHeader className="bg-slate-50/90">
            <TableRow>
              <TableHead className="w-[24%] px-4 py-3 whitespace-normal break-words align-top text-slate-500">Attribute</TableHead>
              {products.map((product) => (
                <TableHead key={product.id} className="w-[38%] px-4 py-3 whitespace-normal break-words align-top text-slate-900">
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-14 w-14 shrink-0 rounded-2xl object-cover"
                      loading="lazy"
                    />
                    <div className="min-w-0">
                      <span className="block whitespace-normal break-words font-semibold leading-5">{product.name}</span>
                      <span className="block whitespace-normal break-words text-xs font-normal text-slate-500">{product.brand}</span>
                    </div>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.label}>
                <TableCell className="px-4 py-3 whitespace-normal break-words align-top font-medium text-slate-700">{row.label}</TableCell>
                {products.map((product) => (
                  <TableCell
                    key={`${row.label}-${product.id}`}
                    className={`px-4 py-3 whitespace-normal break-words align-top text-slate-700 ${row.className || ""}`}
                  >
                    {row.render(product)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
      </Table>
    </div>
  );
}
