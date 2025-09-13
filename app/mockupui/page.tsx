"use client";

import { useEffect } from "react";
import "./page.css";
import Image from "next/image";
import mri from "./mri.jpg";
import dixon from "./dixon.jpg";

export default function MockupUi() {
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

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="dashboard-container">
        <div className="main-content">
            <div className="header">
                <h1>DMD Monitor</h1>
                <div className="subtitle">AI-Powered MRI Analysis for Duchenne Muscular Dystrophy</div>
            
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
            
            <div className="tab-navigation" style={{ marginBottom: "25px" }}>
                <button className="tab-btn active" data-tab="leg-analysis">Lower Leg Analysis</button>
                <button className="tab-btn" data-tab="dixon-imaging">Dixon Imaging Study</button>
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
            
            <div className="tab-content">
                <div className="tab-panel active" id="leg-analysis">
                    <div className="mri-viewer">
                        <div className="mri-header">
                            <div className="mri-title">Lower Leg MRI Analysis</div>
                            <div className="scan-info">Screened by MyoMetrics • 07:12 pm, 05/02/22</div>
                        </div>
                        
                        <div className="mri-display">
                            <div className="mri-image-container">
                                <Image
                                    src={mri}
                                    alt="MRI Scan Comparison"
                                    width={800}   
                                    height={600} 
                                    style={{
                                        width: "100%",
                                        height: "auto",
                                        borderRadius: "8px",
                                        border: "1px solid #3a3f52",
                                    }}
                                    />
                            </div>
                            
                            <div className="comparison-data">
                                <div style={{ background: "#1a1d29", border: "1px solid #3a3f52", borderRadius: "6px", padding: "12px", marginBottom: "15px" }}>
                                    <h4 style={{ color: "#e8eaed", fontSize: "13px", fontWeight: 600, marginBottom: "10px", paddingBottom: "6px", borderBottom: "1px solid #3a3f52" }}>Muscle Abbreviations</h4>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "11px" }}>
                                        <div style={{ color: "#9aa0a6" }}>TA = Tibialis Anterior</div>
                                        <div style={{ color: "#9aa0a6" }}>TP = Tibialis Posterior</div>
                                        <div style={{ color: "#9aa0a6" }}>Fib = Fibularis</div>
                                        <div style={{ color: "#9aa0a6" }}>Sol = Soleus</div>
                                        <div style={{ color: "#9aa0a6" }}>MG = Medial Gastrocnemius</div>
                                        <div style={{ color: "#9aa0a6" }}>LG = Lateral Gastrocnemius</div>
                                    </div>
                                </div>
                                
                                <div className="comparison-section">
                                    <h4>Healthy Control</h4>
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
                                
                                <div className="comparison-section">
                                    <h4>DMD Patient</h4>
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
                            </div>
                        </div>
                    </div>
                </div>
                <div className="tab-panel" id="dixon-imaging">
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
                                    <Image
                                        src={dixon}
                                        alt="DIXON Scan Comparison"
                                        width={800} 
                                        height={600}
                                        style={{
                                            width: "100%",
                                            height: "auto",
                                            borderRadius: "8px",
                                            border: "1px solid #3a3f52",
                                        }}
                                        />
                                </div>
                            </div>
                            
                            <div className="dixon-data-panel">
                                <div className="dixon-info-section">
                                    <h4>Technical Specifications</h4>
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
                                </div>
                                
                                <div className="dixon-info-section">
                                    <h4>Functional Correlation Thresholds</h4>
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
                                </div>
                                
                                <div className="dixon-info-section">
                                    <h4>Age-Related Progression</h4>
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
                                </div>
                                
                                <div className="dixon-info-section">
                                    <h4>Muscle Involvement Patterns</h4>
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
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="timeline-section">
                <h3 style={{ color: "#0b0c0eff", fontSize: 16, fontWeight: 600, marginBottom: 15 }}>Disease Progression Timeline</h3>
                <div className="timeline">
                    <div className="timeline-point">
                        <span className="timeline-label">Baseline</span>
                    </div>
                    <div className="timeline-point">
                        <span className="timeline-label">6 months</span>
                    </div>
                    <div className="timeline-point">
                        <span className="timeline-label">12 months</span>
                    </div>
                    <div className="timeline-point active">
                        <span className="timeline-label">18 months</span>
                    </div>
                    <div className="timeline-point">
                        <span className="timeline-label">24 months</span>
                    </div>
                </div>
                <div className="progression-data">
                    <div className="progression-point">
                        <div className="progression-value value-normal">15%</div>
                        <div className="progression-label">Fat Fraction</div>
                    </div>
                    <div className="progression-point">
                        <div className="progression-value value-mild">22%</div>
                        <div className="progression-label">Fat Fraction</div>
                    </div>
                    <div className="progression-point">
                        <div className="progression-value value-moderate">31%</div>
                        <div className="progression-label">Fat Fraction</div>
                    </div>
                    <div className="progression-point">
                        <div className="progression-value value-severe">42%</div>
                        <div className="progression-label">Current</div>
                    </div>
                    <div className="progression-point">
                        <div className="progression-value value-severe">55%</div>
                        <div className="progression-label">Predicted</div>
                    </div>
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
        </div>
        
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
                <div style={{ background: "#1a1d29", border: "1px solid #3a3f52", borderRadius: "6px", padding: "10px" }}>
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
  );
}
