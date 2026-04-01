import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useActor } from "@/hooks/useActor";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart2,
  BookOpen,
  ChevronRight,
  Headphones,
  Loader2,
  Lock,
  Mail,
  Menu,
  Newspaper,
  Phone,
  Plus,
  Search,
  Target,
  Trash2,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { SplashScreen } from "./SplashScreen";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Article {
  id: bigint;
  title: string;
  content: string;
  publishDate: bigint;
}

type Category = "Marketing" | "Sales" | "Service";
type PageState =
  | { type: "home" }
  | { type: "category"; name: Category }
  | { type: "article"; id: string }
  | { type: "admin" };

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = ["Marketing", "Sales", "Service"];

const CATEGORY_META: Record<
  Category,
  {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    color: string;
    desc: string;
  }
> = {
  Marketing: {
    icon: Target,
    color: "#F06A3A",
    desc: "Strategies to grow your brand and reach",
  },
  Sales: {
    icon: TrendingUp,
    color: "#2563EB",
    desc: "Tips and tactics to close more deals",
  },
  Service: {
    icon: Headphones,
    color: "#059669",
    desc: "Deliver exceptional customer experiences",
  },
};

const SAMPLE_ARTICLES: (Omit<Article, "id"> & { id: bigint; _sample: true })[] =
  [
    {
      id: -1n,
      title: "10 Marketing Strategies That Actually Work in 2026",
      content:
        "[CATEGORY:Marketing]\nDiscover the proven marketing tactics that top brands use to drive growth, from content marketing to social media automation and beyond.",
      publishDate: BigInt(Date.now() - 2 * 24 * 60 * 60 * 1000) * 1_000_000n,
      _sample: true,
    },
    {
      id: -2n,
      title: "How to Build a High-Performing Sales Pipeline",
      content:
        "[CATEGORY:Sales]\nLearn how to structure your sales funnel, qualify leads effectively, and convert prospects into loyal customers with these expert techniques.",
      publishDate: BigInt(Date.now() - 4 * 24 * 60 * 60 * 1000) * 1_000_000n,
      _sample: true,
    },
    {
      id: -3n,
      title: "Customer Service Excellence: The Ultimate Guide",
      content:
        "[CATEGORY:Service]\nExplore best practices for delivering world-class customer service, from omnichannel support to proactive communication strategies.",
      publishDate: BigInt(Date.now() - 6 * 24 * 60 * 60 * 1000) * 1_000_000n,
      _sample: true,
    },
    {
      id: -4n,
      title: "Email Marketing ROI: Maximizing Your Campaigns",
      content:
        "[CATEGORY:Marketing]\nEmail marketing remains one of the highest ROI channels. Here's how to craft campaigns that resonate and convert.",
      publishDate: BigInt(Date.now() - 7 * 24 * 60 * 60 * 1000) * 1_000_000n,
      _sample: true,
    },
    {
      id: -5n,
      title: "Closing Techniques That Never Feel Pushy",
      content:
        "[CATEGORY:Sales]\nModern buyers hate aggressive closing tactics. Learn consultative selling methods that build trust and naturally lead to a yes.",
      publishDate: BigInt(Date.now() - 9 * 24 * 60 * 60 * 1000) * 1_000_000n,
      _sample: true,
    },
    {
      id: -6n,
      title: "Scaling Customer Support Without Losing Quality",
      content:
        "[CATEGORY:Service]\nAs your business grows, maintaining support quality becomes challenging. Discover systems and tools that scale with your team.",
      publishDate: BigInt(Date.now() - 11 * 24 * 60 * 60 * 1000) * 1_000_000n,
      _sample: true,
    },
  ];

function parseArticle(article: Article): {
  category: Category;
  title: string;
  excerpt: string;
  fullContent: string;
} {
  const lines = article.content.split("\n");
  let category: Category = "Marketing";
  let contentStart = 0;
  if (lines[0]?.match(/^\[CATEGORY:(Marketing|Sales|Service)\]$/)) {
    category = lines[0].replace("[CATEGORY:", "").replace("]", "") as Category;
    contentStart = 1;
  }
  const bodyLines = lines.slice(contentStart).join("\n").trim();
  const excerpt = bodyLines.replace(/<[^>]*>/g, "").slice(0, 160);
  return {
    category,
    title: article.title,
    excerpt: excerpt + (excerpt.length >= 160 ? "…" : ""),
    fullContent: bodyLines,
  };
}

function formatDate(ns: bigint): string {
  const ms = Number(ns) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── Components ───────────────────────────────────────────────────────────────

function CategoryChip({ category }: { category: Category }) {
  const colors: Record<Category, string> = {
    Marketing: "bg-[#F06A3A] text-white",
    Sales: "bg-blue-600 text-white",
    Service: "bg-emerald-600 text-white",
  };
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded text-[0.65rem] font-bold tracking-widest uppercase ${colors[category]}`}
    >
      {category}
    </span>
  );
}

function ArticleCard({
  article,
  index,
  onClick,
}: {
  article: Article;
  index: number;
  onClick: () => void;
}) {
  const parsed = parseArticle(article);
  return (
    <div
      className="card-hover bg-white rounded-xl overflow-hidden border border-[#E6E6E6] flex flex-col cursor-pointer"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      data-ocid={`articles.item.${index + 1}`}
    >
      <div
        className="h-40 bg-[#F3F6F9] flex items-center justify-center"
        style={{
          background:
            parsed.category === "Marketing"
              ? "linear-gradient(135deg,#FFF3EE,#FFE0D3)"
              : parsed.category === "Sales"
                ? "linear-gradient(135deg,#EEF4FF,#DBEAFE)"
                : "linear-gradient(135deg,#ECFDF5,#D1FAE5)",
        }}
      >
        {parsed.category === "Marketing" ? (
          <Target size={36} className="text-[#F06A3A] opacity-60" />
        ) : parsed.category === "Sales" ? (
          <BarChart2 size={36} className="text-blue-500 opacity-60" />
        ) : (
          <Headphones size={36} className="text-emerald-500 opacity-60" />
        )}
      </div>
      <div className="p-5 flex flex-col gap-3 flex-1">
        <CategoryChip category={parsed.category} />
        <h3 className="font-bold text-[#111111] text-base leading-snug line-clamp-2">
          {parsed.title}
        </h3>
        <p className="text-[#4A4A4A] text-sm leading-relaxed line-clamp-3 flex-1">
          {parsed.excerpt}
        </p>
        <div className="flex items-center justify-between pt-2 border-t border-[#E6E6E6]">
          <span className="text-xs text-[#4A4A4A]">
            {formatDate(article.publishDate)}
          </span>
          <span className="text-xs font-semibold text-[#F06A3A] flex items-center gap-1">
            Read more <ChevronRight size={12} />
          </span>
        </div>
      </div>
    </div>
  );
}

function ArticleCardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-[#E6E6E6] flex flex-col">
      <Skeleton className="h-40 w-full" />
      <div className="p-5 flex flex-col gap-3">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({
  page,
  setPage,
  onPublishClick,
}: {
  page: PageState;
  setPage: (p: PageState) => void;
  onPublishClick: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 bg-white border-b border-[#E6E6E6]"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
    >
      {/* Top bar */}
      <div className="bg-[#111111] text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span className="opacity-70">Welcome to TechNova Insights</span>
          <div className="flex gap-4 items-center">
            <a
              href="tel:+923075723318"
              className="flex items-center gap-1 hover:text-[#F06A3A] transition-colors"
              data-ocid="header.link"
            >
              <Phone size={10} /> 03075723318
            </a>
            <a
              href="mailto:engrhussnainali@gmail.com"
              className="flex items-center gap-1 hover:text-[#F06A3A] transition-colors"
              data-ocid="header.link"
            >
              <Mail size={10} /> engrhussnainali@gmail.com
            </a>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <button
          type="button"
          className="flex items-center gap-2 group"
          onClick={() => setPage({ type: "home" })}
          data-ocid="nav.link"
        >
          <div className="w-8 h-8 bg-[#F06A3A] rounded-lg flex items-center justify-center">
            <Newspaper size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-xl text-[#111111] tracking-tight">
            TechNova <span className="text-[#F06A3A]">Insights</span>
          </span>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {CATEGORIES.map((cat) => (
            <button
              type="button"
              key={cat}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                page.type === "category" && page.name === cat
                  ? "bg-[#F06A3A] text-white"
                  : "text-[#4A4A4A] hover:text-[#111111] hover:bg-[#F3F6F9]"
              }`}
              onClick={() => setPage({ type: "category", name: cat })}
              data-ocid="nav.link"
            >
              {cat}
            </button>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {searchOpen ? (
            <div className="flex items-center gap-2">
              <Input
                className="w-48 h-8 text-sm"
                placeholder="Search articles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                data-ocid="search.input"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-[#4A4A4A] hover:text-[#111111]"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-lg text-[#4A4A4A] hover:bg-[#F3F6F9] transition-colors"
              data-ocid="nav.link"
            >
              <Search size={18} />
            </button>
          )}
          <Button
            size="sm"
            className="hidden md:flex items-center gap-1 bg-[#111111] hover:bg-[#333333] text-white font-bold text-xs px-4"
            onClick={onPublishClick}
            data-ocid="publish.open_modal_button"
          >
            <Plus size={12} /> Publish
          </Button>
          <Button
            size="sm"
            className="hidden md:flex bg-[#F06A3A] hover:bg-[#D4541E] text-white font-bold text-xs px-4"
            onClick={() => setPage({ type: "admin" })}
            data-ocid="admin.link"
          >
            <User size={12} className="mr-1" /> LOGIN
          </Button>
          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-[#4A4A4A] hover:bg-[#F3F6F9]"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#E6E6E6] bg-white px-4 py-3 flex flex-col gap-2">
          {CATEGORIES.map((cat) => (
            <button
              type="button"
              key={cat}
              className="text-left px-3 py-2 rounded-lg text-sm font-semibold text-[#4A4A4A] hover:bg-[#F3F6F9]"
              onClick={() => {
                setPage({ type: "category", name: cat });
                setMobileOpen(false);
              }}
              data-ocid="nav.link"
            >
              {cat}
            </button>
          ))}
          <button
            type="button"
            className="text-left px-3 py-2 rounded-lg text-sm font-bold text-[#111111] bg-[#F3F6F9] flex items-center gap-2"
            onClick={() => {
              onPublishClick();
              setMobileOpen(false);
            }}
            data-ocid="publish.open_modal_button"
          >
            <Plus size={14} /> Publish Article
          </button>
          <button
            type="button"
            className="text-left px-3 py-2 rounded-lg text-sm font-bold text-[#F06A3A]"
            onClick={() => {
              setPage({ type: "admin" });
              setMobileOpen(false);
            }}
            data-ocid="admin.link"
          >
            Admin Panel
          </button>
        </div>
      )}
    </header>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────

function HomePage({
  articles,
  isLoading,
  setPage,
}: {
  articles: Article[];
  isLoading: boolean;
  setPage: (p: PageState) => void;
}) {
  const displayArticles =
    articles.length > 0 ? articles : (SAMPLE_ARTICLES as unknown as Article[]);
  const featured = displayArticles.slice(0, 3);
  const latest = displayArticles.slice(3);

  return (
    <main>
      {/* Hero Section */}
      <section
        className="bg-[#F3F6F9] border-b border-[#E6E6E6]"
        data-ocid="hero.section"
      >
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div className="order-2 md:order-1">
            <div className="inline-flex items-center gap-2 bg-[#FFF3EE] border border-[#F06A3A]/20 rounded-full px-4 py-1.5 mb-6">
              <div className="w-2 h-2 rounded-full bg-[#F06A3A] animate-pulse" />
              <span className="text-[#F06A3A] text-xs font-bold tracking-widest uppercase">
                Founder
              </span>
            </div>
            <h1 className="font-display font-bold text-4xl md:text-5xl text-[#111111] leading-tight mb-4">
              Hussnain Ali's
              <br />
              <span className="text-[#F06A3A]">TechNova</span> Insights
            </h1>
            <p className="text-[#4A4A4A] text-lg leading-relaxed mb-8 max-w-lg">
              Your go-to source for Marketing, Sales, and Service expertise.
              Actionable insights to grow your business in the digital era.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                className="bg-[#F06A3A] hover:bg-[#D4541E] text-white font-bold px-8 py-3 text-sm"
                onClick={() => setPage({ type: "category", name: "Marketing" })}
                data-ocid="hero.primary_button"
              >
                SUBSCRIBE FREE
              </Button>
              <Button
                variant="outline"
                className="border-[#E6E6E6] text-[#111111] font-semibold px-8 py-3 text-sm hover:bg-[#F3F6F9]"
                onClick={() => setPage({ type: "category", name: "Marketing" })}
                data-ocid="hero.secondary_button"
              >
                Explore Articles
              </Button>
            </div>
            <div className="flex items-center gap-6 mt-8 pt-6 border-t border-[#E6E6E6]">
              <div className="text-center">
                <div className="text-2xl font-display font-bold text-[#111111]">
                  500+
                </div>
                <div className="text-xs text-[#4A4A4A] uppercase tracking-wide">
                  Articles
                </div>
              </div>
              <Separator orientation="vertical" className="h-10" />
              <div className="text-center">
                <div className="text-2xl font-display font-bold text-[#111111]">
                  3
                </div>
                <div className="text-xs text-[#4A4A4A] uppercase tracking-wide">
                  Categories
                </div>
              </div>
              <Separator orientation="vertical" className="h-10" />
              <div className="text-center">
                <div className="text-2xl font-display font-bold text-[#111111]">
                  10K+
                </div>
                <div className="text-xs text-[#4A4A4A] uppercase tracking-wide">
                  Readers
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="relative">
              <img
                src="/assets/generated/hero-technova.dim_800x600.jpg"
                alt="TechNova Insights"
                className="rounded-2xl w-full object-cover shadow-xl"
                style={{ maxHeight: 420 }}
              />
              <div className="absolute -bottom-5 -left-5 bg-white rounded-xl p-5 shadow-xl border border-[#E6E6E6]">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#F06A3A] to-[#FFB347] flex items-center justify-center ring-4 ring-[#F06A3A] shadow-lg flex-shrink-0">
                    <span className="text-white font-bold text-xl tracking-wide">
                      HA
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-base text-[#111111]">
                      Hussnain Ali
                    </div>
                    <div className="text-xs text-[#4A4A4A]">
                      Founder & Editor
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      <section className="py-14 px-4" data-ocid="featured.section">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="section-label mb-1">Hand-picked</p>
              <h2 className="font-display font-bold text-2xl text-[#111111]">
                FEATURED ARTICLES
              </h2>
            </div>
            <button
              type="button"
              className="text-sm font-semibold text-[#F06A3A] flex items-center gap-1 hover:underline"
              onClick={() => setPage({ type: "category", name: "Marketing" })}
            >
              View all <ChevronRight size={14} />
            </button>
          </div>
          {isLoading ? (
            <div
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              data-ocid="featured.loading_state"
            >
              {[1, 2, 3].map((i) => (
                <ArticleCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featured.map((a, i) => (
                <ArticleCard
                  key={a.id.toString()}
                  article={a}
                  index={i}
                  onClick={() =>
                    setPage({ type: "article", id: a.id.toString() })
                  }
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Popular Categories */}
      <section
        className="bg-[#F3F6F9] py-14 px-4 border-y border-[#E6E6E6]"
        data-ocid="categories.section"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <p className="section-label mb-1">Explore by topic</p>
            <h2 className="font-display font-bold text-2xl text-[#111111]">
              POPULAR CATEGORIES
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CATEGORIES.map((cat) => {
              const meta = CATEGORY_META[cat];
              const Icon = meta.icon;
              const catArticles = displayArticles.filter(
                (a) => parseArticle(a).category === cat,
              );
              return (
                <button
                  type="button"
                  key={cat}
                  className="card-hover bg-white rounded-xl p-8 text-left border border-[#E6E6E6] group"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
                  onClick={() => setPage({ type: "category", name: cat })}
                  data-ocid={`categories.item.${CATEGORIES.indexOf(cat) + 1}`}
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                    style={{ backgroundColor: `${meta.color}18` }}
                  >
                    <span style={{ color: meta.color }}>
                      <Icon size={26} />
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-xl text-[#111111] mb-2 group-hover:text-[#F06A3A] transition-colors">
                    {cat}
                  </h3>
                  <p className="text-[#4A4A4A] text-sm mb-4">{meta.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#4A4A4A]">
                      {catArticles.length} articles
                    </span>
                    <ChevronRight size={16} className="text-[#F06A3A]" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Latest Articles + Sidebar */}
      {latest.length > 0 && (
        <section className="py-14 px-4" data-ocid="latest.section">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Main */}
            <div className="lg:col-span-2">
              <div className="mb-8">
                <p className="section-label mb-1">Stay current</p>
                <h2 className="font-display font-bold text-2xl text-[#111111]">
                  LATEST ARTICLES
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {latest.map((a, i) => (
                  <ArticleCard
                    key={a.id.toString()}
                    article={a}
                    index={i + 3}
                    onClick={() =>
                      setPage({ type: "article", id: a.id.toString() })
                    }
                  />
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-8">
              {/* Trending */}
              <div
                className="bg-white rounded-xl border border-[#E6E6E6] p-6"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
              >
                <h3 className="font-display font-bold text-base text-[#111111] mb-4 flex items-center gap-2">
                  <TrendingUp size={16} className="text-[#F06A3A]" /> Trending
                  Posts
                </h3>
                <div className="space-y-4">
                  {displayArticles.slice(0, 4).map((a, i) => {
                    const parsed = parseArticle(a);
                    return (
                      <button
                        type="button"
                        key={a.id.toString()}
                        className="flex gap-3 text-left group w-full"
                        onClick={() =>
                          setPage({ type: "article", id: a.id.toString() })
                        }
                        data-ocid={`trending.item.${i + 1}`}
                      >
                        <span className="text-2xl font-display font-bold text-[#E6E6E6] leading-none mt-0.5">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <div className="text-xs mb-1">
                            <CategoryChip category={parsed.category} />
                          </div>
                          <p className="text-sm font-semibold text-[#111111] group-hover:text-[#F06A3A] transition-colors line-clamp-2">
                            {parsed.title}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Topics */}
              <div
                className="bg-white rounded-xl border border-[#E6E6E6] p-6"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
              >
                <h3 className="font-display font-bold text-base text-[#111111] mb-4 flex items-center gap-2">
                  <BookOpen size={16} className="text-[#F06A3A]" /> Topics
                </h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Marketing",
                    "Sales",
                    "Service",
                    "Growth",
                    "Strategy",
                    "Digital",
                    "CRM",
                    "SEO",
                  ].map((t) => (
                    <Badge
                      key={t}
                      variant="secondary"
                      className="cursor-pointer hover:bg-[#F06A3A] hover:text-white transition-colors text-xs"
                      onClick={() => {
                        const cat = CATEGORIES.find((c) => c === t);
                        if (cat) setPage({ type: "category", name: cat });
                      }}
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Newsletter CTA */}
              <div
                className="rounded-xl p-6 text-white"
                style={{
                  background: "linear-gradient(135deg,#F06A3A,#D4541E)",
                }}
              >
                <h3 className="font-display font-bold text-lg mb-2">
                  Get Weekly Insights
                </h3>
                <p className="text-white/80 text-sm mb-4">
                  Join 10,000+ readers. No spam, ever.
                </p>
                <Input
                  placeholder="Your email address"
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/60 mb-3"
                  data-ocid="newsletter.input"
                />
                <Button
                  className="w-full bg-white text-[#F06A3A] font-bold hover:bg-white/90"
                  data-ocid="newsletter.submit_button"
                >
                  SUBSCRIBE
                </Button>
              </div>
            </aside>
          </div>
        </section>
      )}
    </main>
  );
}

// ─── Category Page ────────────────────────────────────────────────────────────

function CategoryPage({
  category,
  articles,
  isLoading,
  setPage,
}: {
  category: Category;
  articles: Article[];
  isLoading: boolean;
  setPage: (p: PageState) => void;
}) {
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;
  const displayArticles =
    articles.length > 0 ? articles : (SAMPLE_ARTICLES as unknown as Article[]);
  const filtered = displayArticles.filter(
    (a) => parseArticle(a).category === category,
  );

  return (
    <main data-ocid="category.page">
      {/* Category Hero */}
      <section
        className="py-14 px-4 border-b border-[#E6E6E6]"
        style={{
          background:
            category === "Marketing"
              ? "linear-gradient(135deg,#FFF3EE,#FFE0D3)"
              : category === "Sales"
                ? "linear-gradient(135deg,#EEF4FF,#DBEAFE)"
                : "linear-gradient(135deg,#ECFDF5,#D1FAE5)",
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center gap-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: `${meta.color}22` }}
          >
            <span style={{ color: meta.color }}>
              <Icon size={30} />
            </span>
          </div>
          <div>
            <p className="section-label mb-1">{filtered.length} articles</p>
            <h1 className="font-display font-bold text-3xl text-[#111111]">
              {category}
            </h1>
            <p className="text-[#4A4A4A] text-sm mt-1">{meta.desc}</p>
          </div>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              data-ocid="category.loading_state"
            >
              {[1, 2, 3].map((i) => (
                <ArticleCardSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20" data-ocid="category.empty_state">
              <span
                style={{ color: meta.color }}
                className="block mx-auto mb-4 opacity-40 w-fit"
              >
                <Icon size={48} className="mx-auto" />
              </span>
              <h2 className="font-display font-bold text-xl text-[#111111] mb-2">
                No articles yet
              </h2>
              <p className="text-[#4A4A4A] text-sm">
                Be the first to publish in {category}.
              </p>
              <Button
                className="mt-6 bg-[#F06A3A] hover:bg-[#D4541E] text-white"
                onClick={() => setPage({ type: "admin" })}
                data-ocid="category.primary_button"
              >
                Publish Article
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((a, i) => (
                <ArticleCard
                  key={a.id.toString()}
                  article={a}
                  index={i}
                  onClick={() =>
                    setPage({ type: "article", id: a.id.toString() })
                  }
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

// ─── Article Detail Page ──────────────────────────────────────────────────────

function ArticleDetailPage({
  articleId,
  articles,
  setPage,
}: {
  articleId: string;
  articles: Article[];
  setPage: (p: PageState) => void;
}) {
  const displayArticles =
    articles.length > 0 ? articles : (SAMPLE_ARTICLES as unknown as Article[]);
  const article = displayArticles.find((a) => a.id.toString() === articleId);

  if (!article) {
    return (
      <main className="py-20 text-center" data-ocid="article.error_state">
        <h2 className="font-display font-bold text-2xl text-[#111111] mb-4">
          Article not found
        </h2>
        <Button
          onClick={() => setPage({ type: "home" })}
          className="bg-[#F06A3A] hover:bg-[#D4541E] text-white"
          data-ocid="article.primary_button"
        >
          Back to Home
        </Button>
      </main>
    );
  }

  const parsed = parseArticle(article);
  const related = displayArticles
    .filter(
      (a) =>
        a.id !== article.id && parseArticle(a).category === parsed.category,
    )
    .slice(0, 3);

  return (
    <main data-ocid="article.page">
      {/* Breadcrumb */}
      <div className="bg-[#F3F6F9] border-b border-[#E6E6E6] py-3 px-4">
        <div className="max-w-4xl mx-auto flex items-center gap-2 text-sm text-[#4A4A4A]">
          <button
            type="button"
            onClick={() => setPage({ type: "home" })}
            className="hover:text-[#F06A3A] transition-colors"
            data-ocid="article.link"
          >
            Home
          </button>
          <ChevronRight size={12} />
          <button
            type="button"
            onClick={() => setPage({ type: "category", name: parsed.category })}
            className="hover:text-[#F06A3A] transition-colors"
            data-ocid="article.link"
          >
            {parsed.category}
          </button>
          <ChevronRight size={12} />
          <span className="text-[#111111] font-medium line-clamp-1">
            {parsed.title}
          </span>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-4">
          <CategoryChip category={parsed.category} />
        </div>
        <h1 className="font-display font-bold text-3xl md:text-4xl text-[#111111] leading-tight mb-6">
          {parsed.title}
        </h1>
        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-[#E6E6E6]">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F06A3A] to-[#FFB347] flex items-center justify-center ring-2 ring-[#F06A3A] flex-shrink-0">
              <span className="text-white font-bold text-base tracking-wide">
                HA
              </span>
            </div>
            <div>
              <div className="text-sm font-semibold text-[#111111]">
                Hussnain Ali
              </div>
              <div className="text-xs text-[#4A4A4A]">Founder & Editor</div>
            </div>
          </div>
          <Separator orientation="vertical" className="h-8" />
          <span className="text-sm text-[#4A4A4A]">
            {formatDate(article.publishDate)}
          </span>
        </div>

        <div
          className="h-64 md:h-80 rounded-2xl mb-8 flex items-center justify-center"
          style={{
            background:
              parsed.category === "Marketing"
                ? "linear-gradient(135deg,#FFF3EE,#FFE0D3)"
                : parsed.category === "Sales"
                  ? "linear-gradient(135deg,#EEF4FF,#DBEAFE)"
                  : "linear-gradient(135deg,#ECFDF5,#D1FAE5)",
          }}
        >
          {parsed.category === "Marketing" ? (
            <Target size={64} className="text-[#F06A3A] opacity-40" />
          ) : parsed.category === "Sales" ? (
            <BarChart2 size={64} className="text-blue-500 opacity-40" />
          ) : (
            <Headphones size={64} className="text-emerald-500 opacity-40" />
          )}
        </div>

        <div className="prose prose-lg max-w-none text-[#4A4A4A] leading-relaxed whitespace-pre-line">
          {parsed.fullContent}
        </div>
      </article>

      {/* Related */}
      {related.length > 0 && (
        <section className="bg-[#F3F6F9] border-t border-[#E6E6E6] py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-display font-bold text-xl text-[#111111] mb-6">
              Related Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((a, i) => (
                <ArticleCard
                  key={a.id.toString()}
                  article={a}
                  index={i}
                  onClick={() =>
                    setPage({ type: "article", id: a.id.toString() })
                  }
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

// ─── Admin Page ───────────────────────────────────────────────────────────────

function AdminPage({
  articles,
  isLoading,
  onRefresh,
  setPage,
}: {
  articles: Article[];
  isLoading: boolean;
  onRefresh: () => void;
  setPage: (p: PageState) => void;
}) {
  const { actor } = useActor();
  const [authenticated, setAuthenticated] = useState(false);
  const [loginPw, setLoginPw] = useState("");
  const [loginError, setLoginError] = useState("");

  // Publish form
  const [pubTitle, setPubTitle] = useState("");
  const [pubCategory, setPubCategory] = useState<Category>("Marketing");
  const [pubContent, setPubContent] = useState("");
  const [pubStatus, setPubStatus] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [pubLoading, setPubLoading] = useState(false);

  // Change password
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwStatus, setPwStatus] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  // Delete
  const [deletingId, setDeletingId] = useState<bigint | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [deletePassword, setDeletePassword] = useState("");

  const [activeTab, setActiveTab] = useState<"publish" | "manage" | "password">(
    "publish",
  );

  const ADMIN_PASSWORD = "Hanan741";

  const handleLogin = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (loginPw === ADMIN_PASSWORD) {
        setAuthenticated(true);
        setLoginError("");
      } else {
        setLoginError("Incorrect password. Please try again.");
      }
    },
    [loginPw],
  );

  const handlePublish = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!actor) return;
      setPubLoading(true);
      setPubStatus(null);
      try {
        const contentWithCategory = `[CATEGORY:${pubCategory}]\n${pubContent}`;
        const result = await (actor as any).publishArticle(
          loginPw,
          pubTitle,
          contentWithCategory,
        );
        if (
          result === "ok" ||
          result.startsWith("Article published") ||
          !result.toLowerCase().includes("error")
        ) {
          setPubStatus({
            type: "success",
            msg: "Article published successfully!",
          });
          setPubTitle("");
          setPubContent("");
          onRefresh();
        } else {
          setPubStatus({ type: "error", msg: result });
        }
      } catch (_err) {
        setPubStatus({ type: "error", msg: "Failed to connect to backend." });
      } finally {
        setPubLoading(false);
      }
    },
    [actor, loginPw, pubTitle, pubCategory, pubContent, onRefresh],
  );

  const handleDelete = useCallback(
    async (id: bigint) => {
      if (!actor || !deletePassword) {
        setDeleteStatus({ type: "error", msg: "Enter admin password first." });
        return;
      }
      setDeletingId(id);
      setDeleteStatus(null);
      try {
        const result = await (actor as any).deleteArticle(id, deletePassword);
        if (result === "ok" || !result.toLowerCase().includes("error")) {
          setDeleteStatus({ type: "success", msg: "Article deleted." });
          onRefresh();
        } else {
          setDeleteStatus({ type: "error", msg: result });
        }
      } catch (_err) {
        setDeleteStatus({ type: "error", msg: "Failed to delete article." });
      } finally {
        setDeletingId(null);
      }
    },
    [actor, deletePassword, onRefresh],
  );

  const handleChangePassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!actor) return;
      if (newPw !== confirmPw) {
        setPwStatus({ type: "error", msg: "New passwords do not match." });
        return;
      }
      setPwLoading(true);
      setPwStatus(null);
      try {
        const result = await (actor as any).changePassword(oldPw, newPw);
        if (result === "ok" || !result.toLowerCase().includes("error")) {
          setPwStatus({
            type: "success",
            msg: "Password changed successfully!",
          });
          setOldPw("");
          setNewPw("");
          setConfirmPw("");
        } else {
          setPwStatus({ type: "error", msg: result });
        }
      } catch (_err) {
        setPwStatus({ type: "error", msg: "Failed to change password." });
      } finally {
        setPwLoading(false);
      }
    },
    [actor, oldPw, newPw, confirmPw],
  );

  if (!authenticated) {
    return (
      <main
        className="min-h-screen bg-[#F3F6F9] flex items-center justify-center px-4 py-20"
        data-ocid="admin.page"
      >
        <div
          className="bg-white rounded-2xl border border-[#E6E6E6] p-10 w-full max-w-md"
          style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.08)" }}
        >
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-[#F06A3A] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <User size={24} className="text-white" />
            </div>
            <h1 className="font-display font-bold text-2xl text-[#111111]">
              Admin Login
            </h1>
            <p className="text-[#4A4A4A] text-sm mt-2">
              TechNova Insights Administration
            </p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label
                htmlFor="admin-pw"
                className="text-[#111111] font-semibold text-sm"
              >
                Password
              </Label>
              <Input
                id="admin-pw"
                type="password"
                placeholder="Enter admin password"
                value={loginPw}
                onChange={(e) => setLoginPw(e.target.value)}
                className="mt-1.5 border-[#E6E6E6] focus:border-[#F06A3A]"
                required
                data-ocid="admin.input"
              />
            </div>
            {loginError && (
              <div
                className="bg-red-50 text-red-600 border border-red-200 rounded-lg px-4 py-3 text-sm"
                data-ocid="admin.error_state"
              >
                {loginError}
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-[#F06A3A] hover:bg-[#D4541E] text-white font-bold"
              data-ocid="admin.submit_button"
            >
              LOGIN TO ADMIN PANEL
            </Button>
          </form>
          <button
            type="button"
            className="mt-6 text-sm text-[#4A4A4A] hover:text-[#F06A3A] w-full text-center"
            onClick={() => setPage({ type: "home" })}
            data-ocid="admin.link"
          >
            ← Back to website
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen bg-[#F3F6F9] px-4 py-10"
      data-ocid="admin.panel"
    >
      <div className="max-w-4xl mx-auto">
        {/* Admin Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F06A3A] rounded-xl flex items-center justify-center">
              <User size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-[#111111]">
                Admin Panel
              </h1>
              <p className="text-xs text-[#4A4A4A]">TechNova Insights</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-[#E6E6E6] text-[#4A4A4A] text-xs"
              onClick={() => setPage({ type: "home" })}
              data-ocid="admin.link"
            >
              View Site
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-[#E6E6E6] text-[#F06A3A] text-xs"
              onClick={() => setAuthenticated(false)}
              data-ocid="admin.secondary_button"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-[#E6E6E6] rounded-xl p-1 mb-6">
          {(["publish", "manage", "password"] as const).map((tab) => (
            <button
              type="button"
              key={tab}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === tab
                  ? "bg-[#F06A3A] text-white"
                  : "text-[#4A4A4A] hover:bg-[#F3F6F9]"
              }`}
              onClick={() => setActiveTab(tab)}
              data-ocid="admin.tab"
            >
              {tab === "publish"
                ? "Publish Article"
                : tab === "manage"
                  ? "Manage Articles"
                  : "Change Password"}
            </button>
          ))}
        </div>

        {/* Publish Tab */}
        {activeTab === "publish" && (
          <div
            className="bg-white rounded-2xl border border-[#E6E6E6] p-8"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
          >
            <h2 className="font-display font-bold text-lg text-[#111111] mb-6">
              Publish New Article
            </h2>
            <form onSubmit={handlePublish} className="space-y-5">
              <div>
                <Label
                  htmlFor="pub-title"
                  className="text-[#111111] font-semibold text-sm"
                >
                  Article Title
                </Label>
                <Input
                  id="pub-title"
                  placeholder="Enter a compelling article title..."
                  value={pubTitle}
                  onChange={(e) => setPubTitle(e.target.value)}
                  className="mt-1.5 border-[#E6E6E6] focus:border-[#F06A3A]"
                  required
                  data-ocid="publish.input"
                />
              </div>
              <div>
                <Label className="text-[#111111] font-semibold text-sm">
                  Category
                </Label>
                <div className="flex gap-2 mt-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold border transition-colors ${
                        pubCategory === cat
                          ? "bg-[#F06A3A] text-white border-[#F06A3A]"
                          : "bg-white text-[#4A4A4A] border-[#E6E6E6] hover:border-[#F06A3A]"
                      }`}
                      onClick={() => setPubCategory(cat)}
                      data-ocid="publish.toggle"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label
                  htmlFor="pub-content"
                  className="text-[#111111] font-semibold text-sm"
                >
                  Article Content
                </Label>
                <Textarea
                  id="pub-content"
                  placeholder="Write your full article content here..."
                  value={pubContent}
                  onChange={(e) => setPubContent(e.target.value)}
                  rows={10}
                  className="mt-1.5 border-[#E6E6E6] focus:border-[#F06A3A] resize-none"
                  required
                  data-ocid="publish.textarea"
                />
              </div>
              {pubStatus && (
                <div
                  className={`rounded-lg px-4 py-3 text-sm font-medium ${
                    pubStatus.type === "success"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                  data-ocid={
                    pubStatus.type === "success"
                      ? "publish.success_state"
                      : "publish.error_state"
                  }
                >
                  {pubStatus.msg}
                </div>
              )}
              <Button
                type="submit"
                disabled={pubLoading || !actor}
                className="bg-[#F06A3A] hover:bg-[#D4541E] text-white font-bold w-full"
                data-ocid="publish.submit_button"
              >
                {pubLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {pubLoading ? "Publishing..." : "PUBLISH ARTICLE"}
              </Button>
            </form>
          </div>
        )}

        {/* Manage Tab */}
        {activeTab === "manage" && (
          <div
            className="bg-white rounded-2xl border border-[#E6E6E6] p-8"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
          >
            <h2 className="font-display font-bold text-lg text-[#111111] mb-4">
              Manage Articles
            </h2>

            <div className="mb-5">
              <Label
                htmlFor="del-pw"
                className="text-[#111111] font-semibold text-sm"
              >
                Admin Password (required to delete)
              </Label>
              <Input
                id="del-pw"
                type="password"
                placeholder="Enter admin password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="mt-1.5 max-w-xs border-[#E6E6E6] focus:border-[#F06A3A]"
                data-ocid="manage.input"
              />
            </div>

            {deleteStatus && (
              <div
                className={`rounded-lg px-4 py-3 text-sm font-medium mb-4 ${
                  deleteStatus.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
                data-ocid={
                  deleteStatus.type === "success"
                    ? "manage.success_state"
                    : "manage.error_state"
                }
              >
                {deleteStatus.msg}
              </div>
            )}

            {isLoading ? (
              <div className="space-y-3" data-ocid="manage.loading_state">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-12" data-ocid="manage.empty_state">
                <Newspaper size={40} className="text-[#E6E6E6] mx-auto mb-3" />
                <p className="text-[#4A4A4A] text-sm">
                  No articles published yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {articles.map((a, i) => {
                  const parsed = parseArticle(a);
                  return (
                    <div
                      key={a.id.toString()}
                      className="flex items-center justify-between p-4 rounded-xl border border-[#E6E6E6] hover:border-[#F06A3A]/30 transition-colors"
                      data-ocid={`manage.item.${i + 1}`}
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <CategoryChip category={parsed.category} />
                          <span className="text-xs text-[#4A4A4A]">
                            {formatDate(a.publishDate)}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-[#111111] truncate">
                          {parsed.title}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400 shrink-0"
                        disabled={deletingId === a.id}
                        onClick={() => handleDelete(a.id)}
                        data-ocid={`manage.delete_button.${i + 1}`}
                      >
                        {deletingId === a.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Change Password Tab */}
        {activeTab === "password" && (
          <div
            className="bg-white rounded-2xl border border-[#E6E6E6] p-8"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
          >
            <h2 className="font-display font-bold text-lg text-[#111111] mb-6">
              Change Password
            </h2>
            <form
              onSubmit={handleChangePassword}
              className="space-y-4 max-w-sm"
            >
              <div>
                <Label
                  htmlFor="old-pw"
                  className="text-[#111111] font-semibold text-sm"
                >
                  Current Password
                </Label>
                <Input
                  id="old-pw"
                  type="password"
                  placeholder="Current password"
                  value={oldPw}
                  onChange={(e) => setOldPw(e.target.value)}
                  required
                  className="mt-1.5 border-[#E6E6E6] focus:border-[#F06A3A]"
                  data-ocid="changepass.input"
                />
              </div>
              <div>
                <Label
                  htmlFor="new-pw"
                  className="text-[#111111] font-semibold text-sm"
                >
                  New Password
                </Label>
                <Input
                  id="new-pw"
                  type="password"
                  placeholder="New password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  required
                  className="mt-1.5 border-[#E6E6E6] focus:border-[#F06A3A]"
                  data-ocid="changepass.input"
                />
              </div>
              <div>
                <Label
                  htmlFor="confirm-pw"
                  className="text-[#111111] font-semibold text-sm"
                >
                  Confirm New Password
                </Label>
                <Input
                  id="confirm-pw"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  required
                  className="mt-1.5 border-[#E6E6E6] focus:border-[#F06A3A]"
                  data-ocid="changepass.input"
                />
              </div>
              {pwStatus && (
                <div
                  className={`rounded-lg px-4 py-3 text-sm font-medium ${
                    pwStatus.type === "success"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                  data-ocid={
                    pwStatus.type === "success"
                      ? "changepass.success_state"
                      : "changepass.error_state"
                  }
                >
                  {pwStatus.msg}
                </div>
              )}
              <Button
                type="submit"
                disabled={pwLoading || !actor}
                className="bg-[#F06A3A] hover:bg-[#D4541E] text-white font-bold w-full"
                data-ocid="changepass.submit_button"
              >
                {pwLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {pwLoading ? "Updating..." : "CHANGE PASSWORD"}
              </Button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}

// ─── Publish Modal ────────────────────────────────────────────────────────────

function PublishModal({
  open,
  onClose,
  onRefresh,
  onPublishSuccess,
  setGreetingFromPublish,
}: {
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onPublishSuccess: () => void;
  setGreetingFromPublish: (msg: string) => void;
}) {
  const { actor } = useActor();
  const [step, setStep] = useState<"password" | "form">("password");
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState("");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("Marketing");
  const [bodyContent, setBodyContent] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const ADMIN_PASSWORD = "Hanan741";

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setPwError("");
      setGreetingFromPublish("Hussnain kaya hal hi");
      setStep("form");
    } else {
      setPwError("Incorrect password. Please try again.");
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) return;
    setIsPublishing(true);
    setStatus(null);
    try {
      const contentWithCategory = `[CATEGORY:${category}]\n${bodyContent}`;
      const result = await (actor as any).publishArticle(
        password,
        title,
        contentWithCategory,
      );
      if (
        result === "ok" ||
        result.startsWith("Article published") ||
        !result.toLowerCase().includes("error")
      ) {
        setStatus({
          type: "success",
          msg: "Hussnain artical publish ho gaya! ✅",
        });
        onPublishSuccess();
        onRefresh();
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        setStatus({ type: "error", msg: result });
      }
    } catch (_err) {
      setStatus({ type: "error", msg: "Failed to connect to backend." });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleClose = () => {
    setStep("password");
    setPassword("");
    setPwError("");
    setTitle("");
    setCategory("Marketing");
    setBodyContent("");
    setStatus(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className="sm:max-w-lg border-[#E6E6E6]"
        style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.12)" }}
        data-ocid="publish.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display font-bold text-xl text-[#111111] flex items-center gap-2">
            {step === "password" ? (
              <>
                <Lock size={18} className="text-[#F06A3A]" /> Publish Article
              </>
            ) : (
              <>
                <Plus size={18} className="text-[#F06A3A]" /> New Article
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {step === "password" ? (
          <form onSubmit={handleUnlock} className="space-y-4 pt-2">
            <p className="text-sm text-[#4A4A4A]">
              Enter admin password to continue.
            </p>
            <div>
              <Label
                htmlFor="modal-pw"
                className="text-[#111111] font-semibold text-sm"
              >
                Password
              </Label>
              <Input
                id="modal-pw"
                type="password"
                placeholder="Enter admin password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 border-[#E6E6E6] focus:border-[#F06A3A]"
                autoFocus
                required
                data-ocid="publish.input"
              />
            </div>
            {pwError && (
              <div
                className="bg-red-50 text-red-600 border border-red-200 rounded-lg px-4 py-3 text-sm"
                data-ocid="publish.error_state"
              >
                {pwError}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Button
                type="submit"
                className="flex-1 bg-[#F06A3A] hover:bg-[#D4541E] text-white font-bold"
                data-ocid="publish.submit_button"
              >
                <Lock size={14} className="mr-2" /> Unlock
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-[#E6E6E6]"
                onClick={handleClose}
                data-ocid="publish.cancel_button"
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handlePublish} className="space-y-4 pt-2">
            <div>
              <Label
                htmlFor="modal-title"
                className="text-[#111111] font-semibold text-sm"
              >
                Article Title
              </Label>
              <Input
                id="modal-title"
                placeholder="Article title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5 border-[#E6E6E6] focus:border-[#F06A3A]"
                required
                data-ocid="publish.input"
              />
            </div>
            <div>
              <Label className="text-[#111111] font-semibold text-sm">
                Category
              </Label>
              <div className="flex gap-2 mt-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    type="button"
                    key={cat}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold border transition-colors ${
                      category === cat
                        ? "bg-[#F06A3A] text-white border-[#F06A3A]"
                        : "bg-white text-[#4A4A4A] border-[#E6E6E6] hover:border-[#F06A3A]"
                    }`}
                    onClick={() => setCategory(cat)}
                    data-ocid="publish.toggle"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label
                htmlFor="modal-content"
                className="text-[#111111] font-semibold text-sm"
              >
                Article Content
              </Label>
              <Textarea
                id="modal-content"
                placeholder="Write or paste your article content here..."
                value={bodyContent}
                onChange={(e) => setBodyContent(e.target.value)}
                rows={12}
                className="mt-1.5 border-[#E6E6E6] focus:border-[#F06A3A] resize-none"
                required
                data-ocid="publish.textarea"
              />
            </div>
            {status && (
              <div
                className={`rounded-lg px-4 py-3 text-sm font-medium ${
                  status.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
                data-ocid={
                  status.type === "success"
                    ? "publish.success_state"
                    : "publish.error_state"
                }
              >
                {status.msg}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Button
                type="submit"
                disabled={isPublishing || !actor}
                className="flex-1 bg-[#F06A3A] hover:bg-[#D4541E] text-white font-bold"
                data-ocid="publish.primary_button"
              >
                {isPublishing && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isPublishing ? "Publishing..." : "Publish Article"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-[#E6E6E6]"
                onClick={handleClose}
                disabled={isPublishing}
                data-ocid="publish.cancel_button"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer({ setPage }: { setPage: (p: PageState) => void }) {
  return (
    <footer className="bg-[#F3F6F9] border-t border-[#E6E6E6] pt-14 pb-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#F06A3A] rounded-lg flex items-center justify-center">
                <Newspaper size={16} className="text-white" />
              </div>
              <span className="font-display font-bold text-lg text-[#111111]">
                TechNova
              </span>
            </div>
            <p className="text-[#4A4A4A] text-sm leading-relaxed mb-4">
              Expert insights in Marketing, Sales, and Service to grow your
              business.
            </p>
            <div className="space-y-2 text-sm text-[#4A4A4A]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F06A3A] to-[#FFB347] flex items-center justify-center ring-2 ring-[#F06A3A] flex-shrink-0">
                  <span className="text-white font-bold text-sm tracking-wide">
                    HA
                  </span>
                </div>
                <span>Hussnain Ali — Founder</span>
              </div>
              <a
                href="tel:+923075723318"
                className="flex items-center gap-2 hover:text-[#F06A3A] transition-colors"
              >
                <Phone size={13} className="text-[#F06A3A]" /> 03075723318
              </a>
              <a
                href="mailto:engrhussnainali@gmail.com"
                className="flex items-center gap-2 hover:text-[#F06A3A] transition-colors break-all"
              >
                <Mail size={13} className="text-[#F06A3A]" />{" "}
                engrhussnainali@gmail.com
              </a>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-bold text-[#111111] text-sm uppercase tracking-widest mb-4">
              Categories
            </h4>
            <ul className="space-y-2">
              {CATEGORIES.map((cat) => (
                <li key={cat}>
                  <button
                    type="button"
                    className="text-[#4A4A4A] text-sm hover:text-[#F06A3A] transition-colors"
                    onClick={() => setPage({ type: "category", name: cat })}
                    data-ocid="footer.link"
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-[#111111] text-sm uppercase tracking-widest mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  className="text-[#4A4A4A] text-sm hover:text-[#F06A3A] transition-colors"
                  onClick={() => setPage({ type: "home" })}
                  data-ocid="footer.link"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="text-[#4A4A4A] text-sm hover:text-[#F06A3A] transition-colors"
                  onClick={() => setPage({ type: "admin" })}
                  data-ocid="footer.link"
                >
                  Admin Panel
                </button>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-bold text-[#111111] text-sm uppercase tracking-widest mb-4">
              Newsletter
            </h4>
            <p className="text-[#4A4A4A] text-sm mb-3">
              Get the latest articles delivered to your inbox.
            </p>
            <Input
              placeholder="Your email"
              className="border-[#E6E6E6] text-sm mb-2"
              data-ocid="footer.input"
            />
            <Button
              className="w-full bg-[#F06A3A] hover:bg-[#D4541E] text-white text-xs font-bold"
              data-ocid="footer.submit_button"
            >
              SUBSCRIBE
            </Button>
          </div>
        </div>

        <Separator className="mb-6" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#4A4A4A]">
          <span>
            &copy; {new Date().getFullYear()} TechNova Insights. All rights
            reserved.
          </span>
          <span>
            Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#F06A3A] hover:underline font-semibold"
            >
              caffeine.ai
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}

// ─── Text-to-Speech Helper ────────────────────────────────────────────────────
function speakText(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "ur-PK";
  utter.rate = 0.9;
  utter.pitch = 1.1;
  window.speechSynthesis.speak(utter);
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const queryClient = useQueryClient();
  const { actor, isFetching } = useActor();
  const [page, setPage] = useState<PageState>({ type: "home" });
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  const [greetingMsg, setGreetingMsg] = useState("");
  const [showGreeting, setShowGreeting] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setSplashFading(true), 2200);
    const hideTimer = setTimeout(() => {
      setShowSplash(false);
      setGreetingMsg("Dear kasy hoo");
      setShowGreeting(true);
      speakText("Hi dear, kasy hoo");
      setTimeout(() => setShowGreeting(false), 3000);
    }, 2700);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  const { data: articles = [], isLoading } = useQuery<Article[]>({
    queryKey: ["articles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getArticles();
    },
    enabled: !!actor && !isFetching,
  });

  const refreshArticles = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["articles"] });
  }, [queryClient]);

  return (
    <>
      {showSplash && (
        <div
          style={{
            opacity: splashFading ? 0 : 1,
            transition: "opacity 0.5s ease",
          }}
        >
          <SplashScreen />
        </div>
      )}
      {showGreeting && (
        <div
          style={{
            position: "fixed",
            bottom: "32px",
            right: "32px",
            zIndex: 9999,
            background: "linear-gradient(135deg, #F06A3A, #e85d04)",
            color: "#fff",
            padding: "16px 28px",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(240,106,58,0.35)",
            fontSize: "18px",
            fontWeight: "700",
            animation: "fadeInUp 0.4s ease",
            fontFamily: "inherit",
          }}
        >
          {greetingMsg}
        </div>
      )}
      <div
        style={{ opacity: showSplash ? 0 : 1, transition: "opacity 0.6s ease" }}
      >
        <div className="min-h-screen bg-white flex flex-col">
          <Header
            page={page}
            setPage={setPage}
            onPublishClick={() => setPublishModalOpen(true)}
          />
          <div className="flex-1">
            {page.type === "home" && (
              <HomePage
                articles={articles}
                isLoading={isLoading}
                setPage={setPage}
              />
            )}
            {page.type === "category" && (
              <CategoryPage
                category={page.name}
                articles={articles}
                isLoading={isLoading}
                setPage={setPage}
              />
            )}
            {page.type === "article" && (
              <ArticleDetailPage
                articleId={page.id}
                articles={articles}
                setPage={setPage}
              />
            )}
            {page.type === "admin" && (
              <AdminPage
                articles={articles}
                isLoading={isLoading}
                onRefresh={refreshArticles}
                setPage={setPage}
              />
            )}
          </div>
          <Footer setPage={setPage} />
          <PublishModal
            open={publishModalOpen}
            onClose={() => setPublishModalOpen(false)}
            onRefresh={refreshArticles}
            onPublishSuccess={() => {
              setGreetingMsg("Hussnain artical publish");
              setShowGreeting(true);
              speakText("Hussnain artical publish");
              setTimeout(() => setShowGreeting(false), 3000);
            }}
            setGreetingFromPublish={(msg) => {
              setGreetingMsg(msg);
              setShowGreeting(true);
              speakText(msg);
              setTimeout(() => setShowGreeting(false), 3000);
            }}
          />
        </div>
      </div>
    </>
  );
}
