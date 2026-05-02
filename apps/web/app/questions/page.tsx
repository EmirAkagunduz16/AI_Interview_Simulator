"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Mic,
  LogOut,
  Sparkles,
  MessageSquare,
  Flame,
  Users,
  ChevronUp,
  Send,
  Building2,
  Filter,
  X,
  TrendingUp,
  Search,
  Tag,
  BookOpen,
  Plus,
  ArrowRight,
  Zap,
  Award,
  Hash,
  Cpu,
} from "lucide-react";
import { AuthGuard } from "@/features/auth/components";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { FIELD_LABELS } from "@/features/dashboard/data/fieldLabels";
import { TECH_OPTIONS } from "@/features/interview/data/interviewConfig";
import api from "@/lib/axios";
import "./questions.scss";

interface QuestionItem {
  id: string;
  title?: string;
  content: string;
  type: string;
  difficulty: string;
  category: string;
  tags: string[];
  usageCount: number;
  companyTag: string;
  upvoteCount: number;
  createdBy: string;
  submitterName: string;
  createdAt: string;
}

type TabKey = "popular" | "community";

const COMPANY_OPTIONS = [
  "Google",
  "Meta",
  "Amazon",
  "Apple",
  "Microsoft",
  "Netflix",
  "Uber",
  "Spotify",
  "Twitter",
  "LinkedIn",
  "Stripe",
  "Airbnb",
  "Tesla",
  "ByteDance",
  "Trendyol",
  "Getir",
  "Hepsiburada",
];

const CATEGORY_OPTIONS = [
  { id: "backend", label: "Backend" },
  { id: "frontend", label: "Frontend" },
  { id: "fullstack", label: "Fullstack" },
  { id: "mobile", label: "Mobile" },
  { id: "devops", label: "DevOps" },
  { id: "data_science", label: "Data Science" },
];

const DIFFICULTY_OPTIONS = [
  { id: "junior", label: "Junior" },
  { id: "intermediate", label: "Mid-Level" },
  { id: "senior", label: "Senior" },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "#4ade80",
  junior: "#4ade80",
  medium: "#facc15",
  intermediate: "#facc15",
  hard: "#f87171",
  senior: "#f87171",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Kolay",
  medium: "Orta",
  hard: "Zor",
  junior: "Junior",
  intermediate: "Mid-Level",
  senior: "Senior",
};

function QuestionsContent() {
  const { logout } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabKey>("popular");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionItem | null>(null);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [communitySortBy, setCommunitySortBy] = useState("newest");
  const [communityPage, setCommunityPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // Submit form state — title and difficulty are no longer collected
  // from the user; the title is derived from content and difficulty is
  // classified by Gemini server-side.
  const [formContent, setFormContent] = useState("");
  const [formCategory, setFormCategory] = useState("backend");
  const [formCompany, setFormCompany] = useState("");
  const [formTags, setFormTags] = useState("");

  // Popular questions (FAQ)
  const { data: popularData, isLoading: popularLoading } = useQuery<{
    questions: QuestionItem[];
  }>({
    queryKey: ["questions", "popular", filterCategory, filterDifficulty],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("limit", "30");
      if (filterCategory) params.set("category", filterCategory);
      if (filterDifficulty) params.set("difficulty", filterDifficulty);
      const res = await api.get(`/questions/popular?${params}`);
      return res.data;
    },
  });

  // Community questions
  const { data: communityData, isLoading: communityLoading } = useQuery<{
    questions: QuestionItem[];
    total: number;
    page: number;
    totalPages: number;
  }>({
    queryKey: [
      "questions",
      "community",
      communityPage,
      filterCategory,
      filterDifficulty,
      filterCompany,
      filterTag,
      communitySortBy,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(communityPage));
      params.set("limit", "12");
      params.set("sortBy", communitySortBy);
      if (filterCategory) params.set("category", filterCategory);
      if (filterDifficulty) params.set("difficulty", filterDifficulty);
      if (filterCompany) params.set("companyTag", filterCompany);
      if (filterTag) params.set("tag", filterTag);
      const res = await api.get(`/questions/community?${params}`);
      return res.data;
    },
  });

  // Available technology tags from community submissions
  const { data: communityTagsData } = useQuery<{ items: string[] }>({
    queryKey: ["questions", "community-tags"],
    queryFn: async () => {
      const res = await api.get("/questions/community/tags");
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Build the technology dropdown options. We merge the technology pool from
  // the interview config (so the user always sees a complete tech list per
  // category) with the dynamic tags coming back from server.
  const techDropdownOptions = useMemo(() => {
    const fromConfig = filterCategory
      ? TECH_OPTIONS[filterCategory] || []
      : Object.values(TECH_OPTIONS).flat();
    const fromServer = communityTagsData?.items || [];
    const set = new Map<string, string>();
    [...fromConfig, ...fromServer].forEach((t) => {
      const trimmed = (t || "").trim();
      if (!trimmed) return;
      const key = trimmed.toLowerCase();
      if (!set.has(key)) set.set(key, trimmed);
    });
    return Array.from(set.values()).sort((a, b) => a.localeCompare(b));
  }, [filterCategory, communityTagsData]);

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (data: {
      content: string;
      category: string;
      companyTag: string;
      tags: string[];
    }) => {
      const res = await api.post("/questions/community", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions", "community"] });
      queryClient.invalidateQueries({ queryKey: ["questions", "community-tags"] });
      setShowSubmitModal(false);
      resetForm();
    },
  });

  // Upvote mutation
  const upvoteMutation = useMutation({
    mutationFn: async (questionId: string) => {
      const res = await api.post(`/questions/${questionId}/upvote`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });

  function resetForm() {
    setFormContent("");
    setFormCategory("backend");
    setFormCompany("");
    setFormTags("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formContent.trim()) return;
    submitMutation.mutate({
      content: formContent.trim(),
      category: formCategory,
      companyTag: formCompany,
      tags: formTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
  }

  function clearFilters() {
    setFilterCategory("");
    setFilterDifficulty("");
    setFilterCompany("");
    setFilterTag("");
    setSearchQuery("");
  }

  const hasFilters =
    filterCategory || filterDifficulty || filterCompany || filterTag;

  const popularQuestions = popularData?.questions || [];
  const communityQuestions = communityData?.questions || [];

  // Client-side search filter
  const filteredPopular = searchQuery
    ? popularQuestions.filter(
        (q) =>
          (q.content || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.tags.some((t) =>
            t.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
      )
    : popularQuestions;

  const filteredCommunity = searchQuery
    ? communityQuestions.filter(
        (q) =>
          (q.content || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.tags.some((t) =>
            t.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
      )
    : communityQuestions;

  const isLoading = activeTab === "popular" ? popularLoading : communityLoading;

  return (
    <div className="questions-page">
      {/* Top Nav - Same as Dashboard */}
      <header className="dashboard-topnav">
        <Link href="/" className="topnav-logo">
          <div className="logo-icon">
            <Sparkles size={18} />
          </div>
          <span className="logo-text">AI Coach</span>
        </Link>

        <nav className="topnav-nav">
          <Link href="/dashboard" className="nav-link">
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </Link>
          <Link href="/interview" className="nav-link">
            <Mic size={16} />
            <span>Yeni Mülakat</span>
          </Link>
          <Link href="/questions" className="nav-link active">
            <MessageSquare size={16} />
            <span>Sorular</span>
          </Link>
        </nav>

        <div className="topnav-actions">
          <button className="logout-btn" onClick={() => logout()}>
            <LogOut size={16} />
            <span>Çıkış</span>
          </button>
        </div>
      </header>

      <div className="questions-container">
        {/* Page Header */}
        <div className="questions-hero">
          <div className="hero-content">
            <h1>
              <BookOpen size={28} className="hero-icon" />
              Soru Bankası
            </h1>
            <p>
              Sıkça sorulan mülakat sorularını keşfedin ve topluluğun paylaştığı
              FAANG & büyük şirket sorularını inceleyin.
            </p>
          </div>
          <button
            className="submit-question-btn"
            onClick={() => setShowSubmitModal(true)}
          >
            <Plus size={18} />
            <span>Soru Paylaş</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Sorularda ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery("")}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="tabs-row">
          <div className="tabs-group">
            <button
              className={`tab-btn ${activeTab === "popular" ? "active" : ""}`}
              onClick={() => setActiveTab("popular")}
            >
              <Flame size={16} />
              <span>Sık Sorulan</span>
              {popularQuestions.length > 0 && (
                <span className="tab-count">{popularQuestions.length}</span>
              )}
            </button>
            <button
              className={`tab-btn ${activeTab === "community" ? "active" : ""}`}
              onClick={() => setActiveTab("community")}
            >
              <Users size={16} />
              <span>Topluluk</span>
              {communityData?.total ? (
                <span className="tab-count">{communityData.total}</span>
              ) : null}
            </button>
          </div>

          {activeTab === "community" && (
            <div className="sort-group">
              <select
                value={communitySortBy}
                onChange={(e) => {
                  setCommunitySortBy(e.target.value);
                  setCommunityPage(1);
                }}
                className="sort-select"
              >
                <option value="newest">En Yeni</option>
                <option value="popular">En Beğenilen</option>
                <option value="oldest">En Eski</option>
              </select>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="filters-row">
          <Filter size={15} className="filter-icon" />
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setCommunityPage(1);
            }}
            className="filter-select"
          >
            <option value="">Tüm Alanlar</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            value={filterDifficulty}
            onChange={(e) => {
              setFilterDifficulty(e.target.value);
              setCommunityPage(1);
            }}
            className="filter-select"
          >
            <option value="">Tüm Seviyeler</option>
            {DIFFICULTY_OPTIONS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
          {activeTab === "community" && (
            <>
              <select
                value={filterTag}
                onChange={(e) => {
                  setFilterTag(e.target.value);
                  setCommunityPage(1);
                }}
                className="filter-select"
              >
                <option value="">Tüm Teknolojiler</option>
                {techDropdownOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <select
                value={filterCompany}
                onChange={(e) => {
                  setFilterCompany(e.target.value);
                  setCommunityPage(1);
                }}
                className="filter-select"
              >
                <option value="">Tüm Şirketler</option>
                {COMPANY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </>
          )}
          {hasFilters && (
            <button className="clear-filters-btn" onClick={clearFilters}>
              <X size={13} />
              <span>Temizle</span>
            </button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="loading-state">
            <div className="loader" />
            <p>Yükleniyor...</p>
          </div>
        ) : activeTab === "popular" ? (
          /* ── Popular / FAQ Questions ── */
          <div className="questions-grid">
            {filteredPopular.length === 0 ? (
              <div className="empty-state">
                <Flame size={40} strokeWidth={1.5} />
                <p>Henüz sık sorulan soru bulunamadı</p>
              </div>
            ) : (
              filteredPopular.map((q) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  variant="popular"
                  onUpvote={() => upvoteMutation.mutate(q.id)}
                  onClick={() => setSelectedQuestion(q)}
                />
              ))
            )}
          </div>
        ) : (
          /* ── Community Questions ── */
          <>
            <div className="questions-grid">
              {filteredCommunity.length === 0 ? (
                <div className="empty-state">
                  <Users size={40} strokeWidth={1.5} />
                  <p>Henüz topluluk sorusu yok</p>
                  <button
                    className="empty-cta"
                    onClick={() => setShowSubmitModal(true)}
                  >
                    İlk soruyu paylaşın
                    <ArrowRight size={14} />
                  </button>
                </div>
              ) : (
                filteredCommunity.map((q) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    variant="community"
                    onUpvote={() => upvoteMutation.mutate(q.id)}
                    onClick={() => setSelectedQuestion(q)}
                  />
                ))
              )}
            </div>

            {/* Pagination */}
            {communityData && communityData.totalPages > 1 && (
              <div className="pagination">
                {Array.from({ length: communityData.totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    className={`page-btn ${communityPage === i + 1 ? "active" : ""}`}
                    onClick={() => setCommunityPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Question Detail Modal */}
      {selectedQuestion && (
        <QuestionDetailModal
          question={selectedQuestion}
          onClose={() => setSelectedQuestion(null)}
          onUpvote={() => {
            upvoteMutation.mutate(selectedQuestion.id);
          }}
        />
      )}

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="modal-overlay" onClick={() => setShowSubmitModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <Send size={20} />
                Yeni Soru Paylaş
              </h2>
              <button
                className="modal-close"
                onClick={() => setShowSubmitModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="submit-form">
              <div className="form-group">
                <label>Soru</label>
                <textarea
                  placeholder="Mülakatta sorulan soruyu olabildiğince net ve eksiksiz yazın..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  rows={5}
                  required
                />
              </div>
              <div className="form-group">
                <label>Alan</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>
                  <Building2 size={14} />
                  Şirket (Opsiyonel)
                </label>
                <select
                  value={formCompany}
                  onChange={(e) => setFormCompany(e.target.value)}
                >
                  <option value="">Şirket seçin</option>
                  {COMPANY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>
                  <Tag size={14} />
                  Teknoloji Etiketleri (virgülle ayırın)
                </label>
                <input
                  type="text"
                  placeholder="React, Node.js, System Design"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                />
              </div>
              <div className="ai-notice">
                <Cpu size={14} />
                <span>
                  Sorunun zorluk seviyesi (Junior / Mid / Senior) otomatik
                  olarak yapay zeka tarafından belirlenip etiketlenecek.
                </span>
              </div>
              <button
                type="submit"
                className="form-submit-btn"
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  "Gönderiliyor..."
                ) : (
                  <>
                    <Send size={16} />
                    Soruyu Paylaş
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Question Card Component ─── */
function QuestionCard({
  question,
  variant,
  onUpvote,
  onClick,
}: {
  question: QuestionItem;
  variant: "popular" | "community";
  onUpvote: () => void;
  onClick: () => void;
}) {
  const fieldInfo = FIELD_LABELS[question.category] || {
    label: question.category,
    icon: "📋",
  };
  const diffColor = DIFFICULTY_COLORS[question.difficulty] || "#94a3b8";
  const diffLabel = DIFFICULTY_LABELS[question.difficulty] || question.difficulty;

  return (
    <div className={`question-card ${variant}`} onClick={onClick} role="button" tabIndex={0}>
      {/* Card top accent line */}
      <div className="card-accent" />

      {/* Header row */}
      <div className="card-header">
        <div className="card-badges">
          <span className="badge-field">
            <span className="badge-emoji">{fieldInfo.icon}</span>
            {fieldInfo.label}
          </span>
          <span
            className="badge-difficulty"
            style={{ color: diffColor, borderColor: `${diffColor}40` }}
          >
            {diffLabel}
          </span>
          {question.companyTag && (
            <span className="badge-company">
              <Building2 size={12} />
              {question.companyTag}
            </span>
          )}
        </div>

        {variant === "popular" && question.usageCount > 0 && (
          <div className="usage-indicator">
            <TrendingUp size={13} />
            <span>{question.usageCount}x soruldu</span>
          </div>
        )}
      </div>

      {/* Question content */}
      <p className="card-question">{question.content}</p>

      {/* Tags */}
      {question.tags && question.tags.length > 0 && (
        <div className="card-tags">
          {question.tags.slice(0, 5).map((tag) => (
            <span key={tag} className="tag">
              <Hash size={10} />
              {tag}
            </span>
          ))}
          {question.tags.length > 5 && (
            <span className="tag tag-more">+{question.tags.length - 5}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="card-footer">
        {variant === "community" && question.submitterName && (
          <span className="submitter">
            <Award size={13} />
            {question.submitterName}
          </span>
        )}
        {variant === "popular" && (
          <span className="popular-badge">
            <Zap size={13} />
            Sık Sorulan
          </span>
        )}

        <button
          className="upvote-btn"
          onClick={(e) => {
            e.stopPropagation();
            onUpvote();
          }}
        >
          <ChevronUp size={16} />
          <span>{question.upvoteCount || 0}</span>
        </button>
      </div>
    </div>
  );
}

/* ─── Question Detail Modal ─── */
function QuestionDetailModal({
  question,
  onClose,
  onUpvote,
}: {
  question: QuestionItem;
  onClose: () => void;
  onUpvote: () => void;
}) {
  const fieldInfo = FIELD_LABELS[question.category] || {
    label: question.category,
    icon: "📋",
  };
  const diffColor = DIFFICULTY_COLORS[question.difficulty] || "#94a3b8";
  const diffLabel = DIFFICULTY_LABELS[question.difficulty] || question.difficulty;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content question-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="detail-badges">
            <span className="badge-field">
              <span className="badge-emoji">{fieldInfo.icon}</span>
              {fieldInfo.label}
            </span>
            <span
              className="badge-difficulty"
              style={{ color: diffColor, borderColor: `${diffColor}40` }}
            >
              {diffLabel}
            </span>
            {question.companyTag && (
              <span className="badge-company">
                <Building2 size={12} />
                {question.companyTag}
              </span>
            )}
            {question.usageCount > 0 && (
              <span className="detail-usage">
                <TrendingUp size={13} />
                {question.usageCount}x soruldu
              </span>
            )}
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="detail-body">
          <p className="detail-question-text">{question.content}</p>

          {question.tags && question.tags.length > 0 && (
            <div className="detail-tags">
              {question.tags.map((tag) => (
                <span key={tag} className="tag">
                  <Hash size={11} />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="detail-footer">
          <div className="detail-meta">
            {question.submitterName && (
              <span className="submitter">
                <Award size={13} />
                {question.submitterName}
              </span>
            )}
            {question.createdAt && (
              <span className="detail-date">
                {new Date(question.createdAt).toLocaleDateString("tr-TR")}
              </span>
            )}
          </div>
          <button
            className="upvote-btn"
            onClick={onUpvote}
          >
            <ChevronUp size={16} />
            <span>{question.upvoteCount || 0}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QuestionsPage() {
  return (
    <AuthGuard>
      <QuestionsContent />
    </AuthGuard>
  );
}
