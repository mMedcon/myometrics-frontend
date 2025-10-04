"use client";

import { useEffect, useState, useRef } from "react";
import "./page.css";
import Image from "next/image";
import { microserviceAPI } from "@/lib/api/microservice";
import { useParams } from "next/navigation";
import { ReactSketchCanvas, ReactSketchCanvasRef } from "react-sketch-canvas";

export default function UploadDetailsPage() {
  const [isAnalysisVisible, setIsAnalysisVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"leg-analysis" | "dixon-imaging">("leg-analysis");
  const [isMuscleAbbrVisible, setIsMuscleAbbrVisible] = useState(false);
  const [isHealthyControlVisible, setIsHealthyControlVisible] = useState(false);
  const [isDmdPatientVisible, setIsDmdPatientVisible] = useState(false);
  const [isFatFractionVisible, setIsFatFractionVisible] = useState(false);

  const [isTechSpecVisible, setIsTechSpecVisible] = useState(false);
  const [isFuncThresholdsVisible, setIsFuncThresholdsVisible] = useState(false);
  const [isAgeProgressionVisible, setIsAgeProgressionVisible] = useState(false);
  const [isMusclePatternVisible, setIsMusclePatternVisible] = useState(false);
  

  const [mriImageUrl, setMriImageUrl] = useState<string | null>(null);
  const [dixonImageUrl, setDixonImageUrl] = useState<string | null>(null);

  const params = useParams();
  const uploadId = params.id as string;

  const mriUploadId = "50e3aad3-8142-4205-bb1f-18450c76e463";
  const dixonUploadId = "50e3aad3-8142-4205-bb1f-18450c76e463";

  // useEffect for fetching images
  useEffect(() => {
    if (mriUploadId) {
      setMriImageUrl(`${process.env.NEXT_PUBLIC_MICROSERVICE_URL}/upload/${uploadId}/preview`);
    }
    if (dixonUploadId) {
      setDixonImageUrl(`${process.env.NEXT_PUBLIC_MICROSERVICE_URL}/upload/${uploadId}/preview`);
    }
  }, []);

  // useEffect for interactive features
  useEffect(() => {
    // === Tabs ===
    document.querySelectorAll<HTMLButtonElement>(".tab-btn").forEach(button => {
      button.addEventListener("click", function () {
        const targetTab = this.getAttribute("data-tab");
        document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
        document.querySelectorAll(".tab-panel").forEach(panel => panel.classList.remove("active"));
        this.classList.add("active");
        if (targetTab) document.getElementById(targetTab)?.classList.add("active");
      });
    });

    // === Hover muscle items ===
    document.querySelectorAll<HTMLElement>(".muscle-data-item").forEach(item => {
      item.addEventListener("mouseenter", function () {
        this.style.background = "rgba(0, 150, 255, 0.1)";
        this.style.borderColor = "#0096ff";
        this.style.transform = "translateX(3px)";
      });
      item.addEventListener("mouseleave", function () {
        this.style.background = "";
        this.style.borderColor = "#2d3142";
        this.style.transform = "";
      });
    });

    // === Timeline ===
    document.querySelectorAll<HTMLElement>(".timeline-point").forEach((point, index) => {
      point.addEventListener("click", function () {
        document.querySelectorAll(".timeline-point").forEach(p => p.classList.remove("active"));
        this.classList.add("active");
        document.querySelectorAll<HTMLElement>(".progression-point").forEach((prog, i) => {
          if (i === index) {
            prog.style.background = "rgba(0, 150, 255, 0.1)";
            prog.style.borderColor = "#0096ff";
          } else {
            prog.style.background = "#1a1d29";
            prog.style.borderColor = "#3a3f52";
          }
        });
      });
    });

    // === Hover biomarkers ===
    document.querySelectorAll<HTMLElement>(".biomarker-card").forEach(card => {
      card.addEventListener("mouseenter", function () {
        const label = this.querySelector(".biomarker-label")?.textContent?.toLowerCase() || "";
        document.querySelectorAll<HTMLElement>(".findings-list li").forEach(finding => {
          const findingText = finding.textContent?.toLowerCase() || "";
          if ((label.includes("fat") && findingText.includes("rml")) ||
              (label.includes("t₂") && findingText.includes("rul"))) {
            finding.style.background = "rgba(0, 150, 255, 0.1)";
            finding.style.borderColor = "#0096ff";
          }
        });
      });
      card.addEventListener("mouseleave", function () {
        document.querySelectorAll<HTMLElement>(".findings-list li").forEach(finding => {
          finding.style.background = "#1a1d29";
          finding.style.borderColor = "#3a3f52";
        });
      });
    });

    // === Add Finding ===
    const addBtn = document.querySelector<HTMLButtonElement>(".add-nodule-btn");
    addBtn?.addEventListener("click", function () {
      const findingsList = document.querySelector(".findings-list");
      if (!findingsList) return;
      const newFinding = document.createElement("li");
      const nextId = findingsList.children.length + 1;
      newFinding.innerHTML = `
        <span><span className="finding-id">#NEW ${nextId}</span></span>
        <span className="brock-score">Brock score: 1.8</span>
      `;
      findingsList.appendChild(newFinding);
      const findingsCount = document.querySelector(".result-row .result-value");
      if (findingsCount && findingsCount.textContent !== "Positive") {
        findingsCount.textContent = String(parseInt(findingsCount.textContent || "0") + 1);
      }
    });

    // === Timestamp update ===
    function updateTimestamp() {
      const now = new Date();
      const timeString = now.toLocaleTimeString("en-US", { hour12: true, hour: "2-digit", minute: "2-digit" });
      const dateString = now.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" });
      const scanInfo = document.querySelector(".scan-info");
      if (scanInfo) scanInfo.textContent = `Screened by MyoMetrics • ${timeString}, ${dateString}`;
    }
    updateTimestamp();
    const timer = setInterval(updateTimestamp, 60000);

    // === Shortcuts ===
    document.addEventListener("keydown", function (e) {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "n") {
          e.preventDefault();
          addBtn?.click();
        } else if (e.key === "r") {
          e.preventDefault();
          location.reload();
        }
      }
    });

    // === Mobile sidebar toggle ===
    function createMobileToggle() {
      if (window.innerWidth <= 1200 && !document.getElementById("sidebar-toggle")) {
        const toggleBtn = document.createElement("button");
        toggleBtn.id = "sidebar-toggle";
        toggleBtn.innerHTML = "📊";
        toggleBtn.style.cssText = `
          position: fixed; top: 20px; right: 20px;
          background: #232633; border: 1px solid #3a3f52;
          color: #e8eaed; padding: 10px; border-radius: 6px;
          cursor: pointer; z-index: 1000; font-size: 16px;
        `;
        const sidebar = document.querySelector<HTMLElement>(".sidebar");
        let visible = true;
        toggleBtn.addEventListener("click", () => {
          visible = !visible;
          if (sidebar) sidebar.style.display = visible ? "block" : "none";
          toggleBtn.innerHTML = visible ? "📊" : "📈";
        });
        document.body.appendChild(toggleBtn);
      }
    }
    createMobileToggle();
    window.addEventListener("resize", createMobileToggle);

    return () => {
      // clearing the timers
    };
  }, []);

  // Сsections styles
  const sectionCardStyle = {
    background: "#1a1d29",
    border: "1px solid #3a3f52",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "16px",
  };

  const sectionHeaderStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    marginBottom: "10px",
  };

  const [activeTimelineIndex, setActiveTimelineIndex] = useState(3);

  const progressionData = [
    { value: "15%", label: "Fat Fraction", severity: "normal" },
    { value: "22%", label: "Fat Fraction", severity: "mild" },
    { value: "31%", label: "Fat Fraction", severity: "moderate" },
    { value: "42%", label: "Current", severity: "severe" },
    { value: "55%", label: "Predicted", severity: "severe" },
  ];

  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const [showCanvas, setShowCanvas] = useState(false);
  const [imgDims, setImgDims] = useState<{ width: number; height: number } | null>(null);

  return (
    <div className="dashboard-container">
      <div className="main-content">
        <div className="header">
          <h1>DMD Monitor</h1>
          <div className="subtitle">AI-Powered MRI Analysis for Duchenne Muscular Dystrophy</div>

          {/* unhide buutton */}
          <button
            onClick={() => setIsAnalysisVisible(v => !v)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 18,
              margin: "18px 0 10px 0",
              display: "flex",
              alignItems: "center",
              color: "var(--primary)",
              fontWeight: 600
            }}
            aria-label={isAnalysisVisible ? "Hide Analyses" : "Show Analyses"}
          >
            <span style={{
              display: "inline-block",
              transition: "transform 0.2s",
              transform: isAnalysisVisible ? "rotate(90deg)" : "rotate(0deg)"
            }}>▶</span>
            <span style={{ marginLeft: 8 }}>
              {isAnalysisVisible ? "Hide Analyses" : "Show Analyses"}
            </span>
          </button>
          {isAnalysisVisible && (
            <>
              <div className="patient-info-grid">
                <div className="patient-info-card">
                  <div className="label">Patient ID</div>
                  <div className="value">DMD-2024-0847</div>
                </div>
                <div className="patient-info-card">
                  <div className="label">Age / Sex</div>
                  <div className="value">12Y / M</div>
                </div>
                <div className="patient-info-card">
                  <div className="label">Ambulatory Status</div>
                  <div className="value">Late Ambulatory</div>
                </div>
                <div className="patient-info-card">
                  <div className="label">Steroid Treatment</div>
                  <div className="value">Deflazacort</div>
                </div>
                <div className="patient-info-card">
                  <div className="label">Last Scan</div>
                  <div className="value">2024-05-15</div>
                </div>
                <div className="patient-info-card">
                  <div className="label">NSAA Score</div>
                  <div className="value">18/34</div>
                </div>
              </div>

              <div className="biomarkers-grid">
                <div className="biomarker-card">
                  <div className="biomarker-value value-moderate">42%</div>
                  <div className="biomarker-label">Fat Fraction</div>
                  <div className="biomarker-status status-moderate">Moderate</div>
                </div>
                <div className="biomarker-card">
                  <div className="biomarker-value value-severe">58ms</div>
                  <div className="biomarker-label">T₂ Relaxation</div>
                  <div className="biomarker-status status-severe">Elevated</div>
                </div>
                <div className="biomarker-card">
                  <div className="biomarker-value value-mild">347cm²</div>
                  <div className="biomarker-label">Muscle Volume</div>
                  <div className="biomarker-status status-mild">Reduced</div>
                </div>
                <div className="biomarker-card">
                  <div className="biomarker-value value-mild">3.2</div>
                  <div className="biomarker-label">Edema Score</div>
                  <div className="biomarker-status status-mild">Mild</div>
                </div>
                <div className="biomarker-card">
                  <div className="biomarker-value value-normal">8%</div>
                  <div className="biomarker-label">Asymmetry Index</div>
                  <div className="biomarker-status status-normal">Normal</div>
                </div>
              </div>

              <div className="tab-navigation" style={{ marginBottom: "25px" }}>
                <button
                  className={`tab-btn${activeTab === "leg-analysis" ? " active" : ""}`}
                  onClick={() => setActiveTab("leg-analysis")}
                  data-tab="leg-analysis"
                >
                  Lower Leg Analysis
                </button>
                <button
                  className={`tab-btn${activeTab === "dixon-imaging" ? " active" : ""}`}
                  onClick={() => setActiveTab("dixon-imaging")}
                  data-tab="dixon-imaging"
                >
                  Dixon Imaging Study
                </button>
              </div>

              <div className="tab-content">
                {activeTab === "leg-analysis" && (
                  <div className="tab-panel active" id="leg-analysis">
                    <div className="mri-viewer">
                      <div className="mri-header">
                        <div className="mri-title">Lower Leg MRI Analysis</div>
                        <div className="scan-info">Screened by MyoMetrics • 07:12 pm, 05/02/22</div>
                      </div>
                      <div className="mri-display">
                        <div className="mri-image-container" style={{ position: "relative" }}>
                          {mriImageUrl && (
                            <>
                              <img
                                src={mriImageUrl}
                                alt="MRI Scan"
                                style={{
                                  width: "100%",
                                  height: "auto",
                                  borderRadius: "8px",
                                  border: "1px solid #3a3f52",
                                  display: showCanvas ? "none" : "block"
                                }}
                                onLoad={e => {
                                  const img = e.currentTarget;
                                  setImgDims({ width: img.naturalWidth, height: img.naturalHeight });
                                }}
                              />
                              {showCanvas && imgDims && (
                                <ReactSketchCanvas
                                  ref={canvasRef}
                                  width={imgDims.width.toString()}
                                  height={imgDims.height.toString()}
                                  backgroundImage={mriImageUrl}
                                  style={{
                                    width: "100%",
                                    height: "auto",
                                    borderRadius: "8px",
                                    border: "1px solid #3a3f52",
                                    zIndex: 2,
                                    position: "relative"
                                  }}
                                  strokeWidth={4}
                                  strokeColor="#ff9800"
                                />
                              )}
                              <div style={{ marginTop: 8 }}>
                                <button onClick={() => setShowCanvas(v => !v)}>
                                  {showCanvas ? "Hide the drawing" : "Draw on this image"}
                                </button>
                                {showCanvas && (
                                  <>
                                    <button
                                      onClick={async () => {
                                        if (canvasRef.current) {
                                          const data = await canvasRef.current.exportImage("png");
                                          if (data) {
                                            const a = document.createElement("a");
                                            a.href = data;
                                            a.download = "annotated.png";
                                            a.click();
                                          }
                                        }
                                      }}
                                      style={{ marginLeft: 8 }}
                                    >
                                      Save the drawing
                                    </button>
                                    <button
                                      onClick={() => canvasRef.current?.clearCanvas()}
                                      style={{ marginLeft: 8 }}
                                    >
                                      Clear
                                    </button>
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                        <div className="comparison-data">
                          {/* Muscle Abbreviations */}
                          <div style={sectionCardStyle}>
                            <div
                              style={sectionHeaderStyle}
                              onClick={() => setIsMuscleAbbrVisible(v => !v)}
                              aria-label={isMuscleAbbrVisible ? "Hide" : "Show"}
                            >
                              <span style={{ fontWeight: 600, fontSize: 14 }}>Muscle Abbreviations</span>
                              <span style={{
                                fontSize: 18,
                                color: "#9aa0a6",
                                transition: "transform 0.2s",
                                display: "inline-block",
                                transform: isMuscleAbbrVisible ? "rotate(90deg)" : "rotate(0deg)"
                              }}>▶</span>
                            </div>
                            {isMuscleAbbrVisible && (
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "11px" }}>
                                <div style={{ color: "#9aa0a6" }}>TA = Tibialis Anterior</div>
                                <div style={{ color: "#9aa0a6" }}>TP = Tibialis Posterior</div>
                                <div style={{ color: "#9aa0a6" }}>Fib = Fibularis</div>
                                <div style={{ color: "#9aa0a6" }}>Sol = Soleus</div>
                                <div style={{ color: "#9aa0a6" }}>MG = Medial Gastrocnemius</div>
                                <div style={{ color: "#9aa0a6" }}>LG = Lateral Gastrocnemius</div>
                              </div>
                            )}
                          </div>

                          {/* Healthy Control */}
                          <div style={sectionCardStyle}>
                            <div
                              style={sectionHeaderStyle}
                              onClick={() => setIsHealthyControlVisible(v => !v)}
                              aria-label={isHealthyControlVisible ? "Hide" : "Show"}
                            >
                              <span style={{ fontWeight: 600, fontSize: 14 }}>Healthy Control</span>
                              <span style={{
                                fontSize: 18,
                                color: "#9aa0a6",
                                transition: "transform 0.2s",
                                display: "inline-block",
                                transform: isHealthyControlVisible ? "rotate(90deg)" : "rotate(0deg)"
                              }}>▶</span>
                            </div>
                            {isHealthyControlVisible && (
                              <div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 60px", gap: "8px", padding: "6px 0", borderBottom: "1px solid #3a3f52", fontSize: "10px", color: "#9aa0a6", fontWeight: 600 }}>
                                  <div>Muscle</div>
                                  <div style={{ textAlign: "center" }}>Fat %</div>
                                  <div style={{ textAlign: "center" }}>T₂ Time</div>
                                </div>
                                <div className="muscle-data-item">
                                  <div className="muscle-name">Tibialis Anterior</div>
                                  <div className="metric-value value-normal">12%</div>
                                  <div className="metric-value value-normal">30ms</div>
                                </div>
                                <div className="muscle-data-item">
                                  <div className="muscle-name">Tibialis Posterior</div>
                                  <div className="metric-value value-normal">15%</div>
                                  <div className="metric-value value-normal">32ms</div>
                                </div>
                                <div className="muscle-data-item">
                                  <div className="muscle-name">Fibularis</div>
                                  <div className="metric-value value-normal">10%</div>
                                  <div className="metric-value value-normal">29ms</div>
                                </div>
                                <div className="muscle-data-item">
                                  <div className="muscle-name">Soleus</div>
                                  <div className="metric-value value-normal">18%</div>
                                  <div className="metric-value value-normal">33ms</div>
                                </div>
                                <div className="muscle-data-item">
                                  <div className="muscle-name">Gastrocnemius</div>
                                  <div className="metric-value value-normal">17%</div>
                                  <div className="metric-value value-normal">34ms</div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* DMD Patient */}
                          <div style={sectionCardStyle}>
                            <div
                              style={sectionHeaderStyle}
                              onClick={() => setIsDmdPatientVisible(v => !v)}
                              aria-label={isDmdPatientVisible ? "Скрыть" : "Показать"}
                            >
                              <span style={{ fontWeight: 600, fontSize: 14 }}>DMD Patient</span>
                              <span style={{
                                fontSize: 18,
                                color: "#9aa0a6",
                                transition: "transform 0.2s",
                                display: "inline-block",
                                transform: isDmdPatientVisible ? "rotate(90deg)" : "rotate(0deg)"
                              }}>▶</span>
                            </div>
                            {isDmdPatientVisible && (
                              <div>
                                <div style={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr 60px 60px",
                                  gap: "8px",
                                  padding: "6px 0",
                                  borderBottom: "1px solid #3a3f52",
                                  fontSize: "10px",
                                  color: "#9aa0a6",
                                  fontWeight: 600
                                }}>
                                  <div>Muscle</div>
                                  <div style={{ textAlign: "center" }}>Fat %</div>
                                  <div style={{ textAlign: "center" }}>T₂ Time</div>
                                </div>
                                <div className="muscle-data-item">
                                  <div className="muscle-name">Tibialis Anterior</div>
                                  <div className="metric-value value-moderate">45%</div>
                                  <div className="metric-value value-severe">58ms</div>
                                </div>
                                <div className="muscle-data-item">
                                  <div className="muscle-name">Tibialis Posterior</div>
                                  <div className="metric-value value-mild">32%</div>
                                  <div className="metric-value value-moderate">48ms</div>
                                </div>
                                <div className="muscle-data-item">
                                  <div className="muscle-name">Fibularis</div>
                                  <div className="metric-value value-severe">68%</div>
                                  <div className="metric-value value-severe">72ms</div>
                                </div>
                                <div className="muscle-data-item">
                                  <div className="muscle-name">Soleus</div>
                                  <div className="metric-value value-moderate">55%</div>
                                  <div className="metric-value value-severe">65ms</div>
                                </div>
                                <div className="muscle-data-item">
                                  <div className="muscle-name">Gastrocnemius</div>
                                  <div className="metric-value value-severe">71%</div>
                                  <div className="metric-value value-severe">77ms</div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === "dixon-imaging" && (
                  <div className="tab-panel active" id="dixon-imaging">
                    <div className="mri-viewer">
                      <div className="mri-header">
                        <div className="mri-title">Dixon Imaging Study - Thigh Cross-Section</div>
                        <div className="scan-info">Comparative Analysis • MyoMetrics</div>
                      </div>
                      <div className="dixon-study-container">
                        <div className="dixon-figure-container">
                          <div className="figure-header">
                            <h4>Figure 2: Dixon MRI Imaging Comparison</h4>
                            <div className="figure-caption">Control (9y) vs DMD (10y) - Thigh Cross-Sectional Analysis</div>
                          </div>
                          <div className="figure-image-wrapper">
                            {dixonImageUrl ? (
                              <img
                                src={dixonImageUrl}
                                alt="Dixon Scan"
                                style={{
                                  width: "100%",
                                  height: "auto",
                                  borderRadius: "8px",
                                  border: "1px solid #3a3f52",
                                }}
                              />
                            ) : (
                              <div style={{ color: "#9aa0a6", fontSize: 14 }}>Dixon image not available</div>
                            )}
                          </div>
                        </div>
                        <div className="dixon-data-panel">
                          {/* Technical Specifications */}
                          <div style={sectionCardStyle}>
                            <div
                              style={sectionHeaderStyle}
                              onClick={() => setIsTechSpecVisible(v => !v)}
                            >
                              <span style={{ fontWeight: 600, fontSize: 14 }}>Technical Specifications</span>
                              <span style={{
                                fontSize: 18,
                                color: "#9aa0a6",
                                transition: "transform 0.2s",
                                display: "inline-block",
                                transform: isTechSpecVisible ? "rotate(90deg)" : "rotate(0deg)"
                              }}>▶</span>
                            </div>
                            {isTechSpecVisible && (
                              <div className="info-grid">
                                <div className="info-item">
                                  <div className="info-label">Dixon Imaging</div>
                                  <div className="info-value">Chemical shift-encoded MRI separating water/fat signals</div>
                                </div>
                                <div className="info-item">
                                  <div className="info-label">Fat Fraction</div>
                                  <div className="info-value">Quantitative % intramuscular fat</div>
                                </div>
                                <div className="info-item">
                                  <div className="info-label">T₂ Values</div>
                                  <div className="info-value">Normal: 30-35ms | Affected: 35-80ms</div>
                                </div>
                              </div>
                            )}
                          </div>
                          {/* Functional Correlation Thresholds */}
                          <div style={sectionCardStyle}>
                            <div
                              style={sectionHeaderStyle}
                              onClick={() => setIsFuncThresholdsVisible(v => !v)}
                            >
                              <span style={{ fontWeight: 600, fontSize: 14 }}>Functional Correlation Thresholds</span>
                              <span style={{
                                fontSize: 18,
                                color: "#9aa0a6",
                                transition: "transform 0.2s",
                                display: "inline-block",
                                transform: isFuncThresholdsVisible ? "rotate(90deg)" : "rotate(0deg)"
                              }}>▶</span>
                            </div>
                            {isFuncThresholdsVisible && (
                              <div className="threshold-grid">
                                <div className="threshold-item">
                                  <div className="threshold-value value-normal">~10%</div>
                                  <div className="threshold-label">Running with flight phase (VL fat)</div>
                                </div>
                                <div className="threshold-item">
                                  <div className="threshold-value value-mild">~20%</div>
                                  <div className="threshold-label">Running without flight phase (VL fat)</div>
                                </div>
                                <div className="threshold-item">
                                  <div className="threshold-value value-moderate">~40%</div>
                                  <div className="threshold-label">Loss of ambulation begins (quadriceps)</div>
                                </div>
                                <div className="threshold-item">
                                  <div className="threshold-value value-severe">~70%</div>
                                  <div className="threshold-label">Walking with compensation (quadriceps)</div>
                                </div>
                                <div className="threshold-item">
                                  <div className="threshold-value value-severe">{'>'}75%</div>
                                  <div className="threshold-label">Loss of floor rise (gluteus maximus)</div>
                                </div>
                              </div>
                            )}
                          </div>
                          {/* Age-Related Progression */}
                          <div style={sectionCardStyle}>
                            <div
                              style={sectionHeaderStyle}
                              onClick={() => setIsAgeProgressionVisible(v => !v)}
                            >
                              <span style={{ fontWeight: 600, fontSize: 14 }}>Age-Related Progression</span>
                              <span style={{
                                fontSize: 18,
                                color: "#9aa0a6",
                                transition: "transform 0.2s",
                                display: "inline-block",
                                transform: isAgeProgressionVisible ? "rotate(90deg)" : "rotate(0deg)"
                              }}>▶</span>
                            </div>
                            {isAgeProgressionVisible && (
                              <div className="progression-timeline">
                                <div className="progression-item">
                                  <div className="age-marker">1-2y</div>
                                  <div className="progression-desc">13/14 children show gluteus maximus infiltration</div>
                                </div>
                                <div className="progression-item">
                                  <div className="age-marker">3-4y</div>
                                  <div className="progression-desc">Biceps femoris fat infiltration onset</div>
                                </div>
                                <div className="progression-item">
                                  <div className="age-marker">5-6y</div>
                                  <div className="progression-desc">Vastus lateralis involvement in most boys</div>
                                </div>
                                <div className="progression-item">
                                  <div className="age-marker">9-10y</div>
                                  <div className="progression-desc">{'>90% have >60% gluteus maximus replacement'}</div>
                                </div>
                              </div>
                            )}
                          </div>
                          {/* Muscle Involvement Patterns */}
                          <div style={sectionCardStyle}>
                            <div
                              style={sectionHeaderStyle}
                              onClick={() => setIsMusclePatternVisible(v => !v)}
                            >
                              <span style={{ fontWeight: 600, fontSize: 14 }}>Muscle Involvement Patterns</span>
                              <span style={{
                                fontSize: 18,
                                color: "#9aa0a6",
                                transition: "transform 0.2s",
                                display: "inline-block",
                                transform: isMusclePatternVisible ? "rotate(90deg)" : "rotate(0deg)"
                              }}>▶</span>
                            </div>
                            {isMusclePatternVisible && (
                              <div className="muscle-pattern-grid">
                                <div className="pattern-category">
                                  <div className="pattern-header" style={{ color: "#f44336" }}>Most Affected</div>
                                  <div className="pattern-muscles">Rectus femoris, Vastus muscles, Biceps femoris</div>
                                </div>
                                <div className="pattern-category">
                                  <div className="pattern-header" style={{ color: "#ff9800" }}>Moderately Affected</div>
                                  <div className="pattern-muscles">Adductor group, Semimembranosus</div>
                                </div>
                                <div className="pattern-category">
                                  <div className="pattern-header" style={{ color: "#4caf50" }}>Relatively Spared</div>
                                  <div className="pattern-muscles">Sartorius, Gracilis, Semitendinosus</div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="timeline-section">
                <h3 style={{ color: "#0b0c0eff", fontSize: 16, fontWeight: 600, marginBottom: 15 }}>Disease Progression Timeline</h3>
                <div className="timeline">
                  {["Baseline", "6 months", "12 months", "18 months", "24 months"].map((label, idx) => (
                    <div
                      key={label}
                      className={`timeline-point${activeTimelineIndex === idx ? " active" : ""}`}
                      onClick={() => setActiveTimelineIndex(idx)}
                    >
                      <span className="timeline-label">{label}</span>
                    </div>
                  ))}
                </div>
                <div className="progression-data">
                  {progressionData.map((item, idx) => (
                    <div
                      key={idx}
                      className="progression-point"
                      style={{
                        background: activeTimelineIndex === idx ? "rgba(0, 150, 255, 0.1)" : "#1a1d29",
                        borderColor: activeTimelineIndex === idx ? "#0096ff" : "#3a3f52"
                      }}
                    >
                      <div className={`progression-value value-${item.severity}`}>{item.value}</div>
                      <div className="progression-label">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ai-insights">
                <h3>🤖 AI Clinical Insights</h3>
                <div className="insight-item">
                  <div className="insight-header">Critical Finding</div>
                  <div className="insight-text">Gastrocnemius muscles show severe fatty infiltration ({'>'}65%) with high T2 values indicating ongoing inflammation. Immediate therapeutic intervention recommended.</div>
                </div>
                <div className="insight-item">
                  <div className="insight-header">Pattern Analysis</div>
                  <div className="insight-text">Distal-to-proximal progression pattern observed. Tibialis posterior showing relative preservation - potential compensatory mechanism detected.</div>
                </div>
                <div className="insight-item">
                  <div className="insight-header">Comparative Analysis</div>
                  <div className="insight-text">Patient's progression rate is 1.5x faster than cohort average. Consider escalating treatment protocol or clinical trial enrollment.</div>
                </div>
                <div className="insight-item">
                  <div className="insight-header">Therapeutic Target</div>
                  <div className="insight-text">Fibularis and soleus muscles in critical transition phase. Targeted physiotherapy and emerging therapies may preserve function.</div>
                </div>
              </div>
            </>
          )}

          {/* if its hidden show the original */}
          {!isAnalysisVisible && (
            <div style={{
              background: "#232633",
              border: "1px solid #3f3f52",
              borderRadius: "8px",
              padding: "24px",
              color: "#9aa0a6",
              textAlign: "center",
              marginBottom: "20px"
            }}>
              Tap "Show Analyses" to view patient biomarkers and clinical data.
            </div>
          )}

          <div className="sidebar">
            <div className="sidebar-section">
              <div className="sidebar-header">
                <span className="sidebar-title">Patient</span>
                <span style={{ color: "#9aa0a6", fontSize: "11px" }}>Age: 12Y</span>
              </div>
              <div style={{ color: "#9aa0a6", fontSize: "11px", marginBottom: "15px" }}>
                Duchenne Muscular Dystrophy • Late Ambulatory
              </div>
            </div>

            <div className="study-result">
              <div className="result-row">
                <span className="result-label">Study result</span>
                <span className="result-value result-positive">Positive</span>
              </div>
              <div className="result-row">
                <span className="result-label">Findings</span>
                <span className="result-value">4</span>
              </div>
            </div>

            <button className="add-nodule-btn">+ Add Finding</button>

            <div className="guideline-section">
              <div style={{ color: "#9aa0a6", fontSize: "11px", marginBottom: "8px" }}>Fleischner Society guideline recommendation</div>
              <div className="guideline-text">
                MRI at 6-12 months to confirm persistence, then every 2 yrs until 5 yrs.
              </div>
            </div>

            <div className="sidebar-section">
              <div className="sidebar-title" style={{ marginBottom: "10px" }}>Muscle Analysis</div>
              <ul className="findings-list">
                <li>
                  <span><span className="finding-id">#RML 1</span></span>
                  <span className="brock-score">Brock score: 4.1</span>
                </li>
                <li>
                  <span><span className="finding-id">#RUL 2</span></span>
                  <span className="brock-score">Brock score: 4.0</span>
                </li>
                <li>
                  <span><span className="finding-id">#RUL 3</span></span>
                  <span className="brock-score">Brock score: 2.3</span>
                </li>
                <li>
                  <span><span className="finding-id">#RML 4</span></span>
                  <span className="brock-score">Brock score: 2.3</span>
                </li>
              </ul>
            </div>

            <div className="sidebar-section">
              <div className="sidebar-title" style={{ marginBottom: "10px" }}>AI Predictions</div>
              <div className="study-result">
                <div className="result-row">
                  <span className="result-label">Ambulation Loss</span>
                  <span className="result-value" style={{ color: "#ff9800" }}>18 months</span>
                </div>
                <div className="result-row">
                  <span className="result-label">Model Confidence</span>
                  <span className="result-value">85%</span>
                </div>
                <div className="result-row">
                  <span className="result-label">6MO Fat Increase</span>
                  <span className="result-value" style={{ color: "#ff9800" }}>+15%</span>
                </div>
              </div>
            </div>

            <div className="sidebar-section">
              <div className="sidebar-title" style={{ marginBottom: "10px" }}>Other Findings</div>
              <div style={{ color: "#9aa0a6", fontSize: "11px", lineHeight: 1.4 }}>
                Bilateral symmetric muscle involvement with distal-to-proximal progression pattern. Preserved diaphragmatic function noted.
              </div>
            </div>

            <div className="sidebar-section">
              <div className="sidebar-title" style={{ marginBottom: "10px" }}>Recommendations</div>
              <div style={{ background: "#1a1d29", border: "1px solid #3f3f52", borderRadius: "6px", padding: "10px" }}>
                <div style={{ color: "#ff9800", fontSize: "11px", fontWeight: 600, marginBottom: "6px" }}>Priority Actions</div>
                <div style={{ color: "#e8eaed", fontSize: "11px", lineHeight: 1.4, marginBottom: "8px" }}>
                  • Increase monitoring frequency to 3 months<br />
                  • Consider therapeutic intervention for VL/RF<br />
                  • Evaluate for clinical trial eligibility
                </div>
                <div style={{ color: "#9aa0a6", fontSize: "10px" }}>
                  Next scan recommended: 08/15/2024
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
