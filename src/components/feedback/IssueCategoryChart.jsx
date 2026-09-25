import React from "react";
import { Layers, ChevronRight } from "lucide-react";

const CATEGORY_COLORS = {
  incorrect_information: "#dc2626", // Red
  did_not_answer_question: "#ea580c", // Dark Orange
  irrelevant_answer: "#f97316", // Orange
  incomplete_answer: "#0284c7", // Sky Blue
  does_not_match_procedure: "#9333ea", // Purple
  other: "#6b7280", // Grey
};

const IssueCategoryChart = ({
  categories = [],
  loading = false,
  onCategoryClick,
}) => {
  const totalNegativeCount = categories.reduce((sum, c) => sum + (c.count || 0), 0);
  const maxCount = categories.length > 0 ? Math.max(...categories.map((c) => c.count || 0), 1) : 1;

  return (
    <div
      className="fb-card"
      style={{
        padding: 20,
        borderRadius: 16,
        backgroundColor: "#ffffff",
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
      }}
    >
      {/* Title */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              backgroundColor: "rgba(16, 107, 163, 0.1)",
              color: "#106BA3",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Layers style={{ width: 18, height: 18 }} />
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f1c2e", margin: 0 }}>
            Issue Category Breakdown
          </h3>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#5c7080" }}>
          {totalNegativeCount} total issues
        </span>
      </div>

      {/* Categories Bar List */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          flex: 1,
          justifyContent: "center",
        }}
      >
        {loading ? (
          Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} style={{ width: "100%", marginBottom: 8 }}>
              <div
                style={{
                  height: 14,
                  width: "35%",
                  backgroundColor: "#e2e8f0",
                  borderRadius: 6,
                  marginBottom: 6,
                }}
              />
              <div
                style={{
                  height: 8,
                  width: "100%",
                  backgroundColor: "#f1f5f9",
                  borderRadius: 9999,
                }}
              />
            </div>
          ))
        ) : categories.length === 0 || totalNegativeCount === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "#5c7080", fontSize: 12 }}>
            No issue category data available.
          </div>
        ) : (
          categories.map((cat) => {
            const barPct = ((cat.count || 0) / maxCount) * 100;
            const barColor = CATEGORY_COLORS[cat.id] || "#106BA3";

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onCategoryClick && onCategoryClick(cat.id)}
                title={`Click to view pending "${cat.label}" issues`}
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #f1f5f9",
                  backgroundColor: "#fcfcfd",
                  cursor: "pointer",
                  boxSizing: "border-box",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(16, 107, 163, 0.04)";
                  e.currentTarget.style.borderColor = "#cbd5e1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#fcfcfd";
                  e.currentTarget.style.borderColor = "#f1f5f9";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: barColor,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#0f1c2e" }}>
                      {cat.label}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                    <span style={{ fontWeight: 700, color: "#0f1c2e" }}>{cat.count}</span>
                    <span style={{ color: "#5c7080" }}>({cat.percentage}%)</span>
                    <ChevronRight style={{ width: 14, height: 14, color: "#5c7080" }} />
                  </div>
                </div>

                {/* Progress track */}
                <div
                  style={{
                    width: "100%",
                    height: 6,
                    borderRadius: 9999,
                    backgroundColor: "#e2e8f0",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      borderRadius: 9999,
                      transition: "width 0.5s ease",
                      width: `${barPct}%`,
                      backgroundColor: barColor,
                    }}
                  />
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default React.memo(IssueCategoryChart);
