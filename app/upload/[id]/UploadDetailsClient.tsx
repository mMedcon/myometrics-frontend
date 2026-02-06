"use client";

import { useEffect, useState, useRef } from "react";
import "./page.css";
import Image from "next/image";
import { microserviceAPI } from "@/lib/api/microservice";
import { ReactSketchCanvas, ReactSketchCanvasRef } from "react-sketch-canvas";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navigation from "@/components/Navigation";
import { imageCache } from "@/lib/cache/imageCache";

interface UploadDetailsClientProps {
  uploadId: string;
}

export default function UploadDetailsClient({ uploadId }: UploadDetailsClientProps) {
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
  const [uploadInfo, setUploadInfo] = useState<{ image_type?: string } | null>(null);
  const [expandedLesion, setExpandedLesion] = useState<string | null>(null);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [dixonImageUrl, setDixonImageUrl] = useState<string | null>(null);

  useEffect(() => {
  if (uploadId) {
    console.log('🔍 Loading upload details for:', uploadId);
    
    // First try to get cached image
    const cachedImageUrl = imageCache.getCachedImage(uploadId);
    
    if (cachedImageUrl) {
      // Use cached image
      setMriImageUrl(cachedImageUrl);
      setDixonImageUrl(cachedImageUrl);
      console.log('📄 Using cached image for upload:', uploadId);
    } else {
      // Fallback to server URL
      const baseUrl = process.env.NEXT_PUBLIC_MICROSERVICE_URL;
      setMriImageUrl(`${baseUrl}/upload/${uploadId}/preview`);
      setDixonImageUrl(`${baseUrl}/upload/${uploadId}/preview`);
      console.log('🌐 Using server image for upload:', uploadId);
    }

    // Always fetch upload info from server (metadata stored in DB)
    (async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_MICROSERVICE_URL;
        const infoUrl = `${baseUrl}/upload/${uploadId}/info`;
        console.log('📊 Fetching upload info from:', infoUrl);
        
        const res = await fetch(infoUrl);
        console.log('📊 Upload info response status:', res.status);
        
        if (res.ok) {
          const data = await res.json();
          console.log('📊 Upload info data received:', JSON.stringify(data, null, 2));
          console.log('🏷️  Image type from server:', data.image_type);
          setUploadInfo(data);
        } else {
          console.error('❌ Failed to fetch upload info from server, trying localStorage...');
          
          // Fallback to localStorage for development/testing
          const localData = localStorage.getItem(`upload_${uploadId}`);
          if (localData) {
            const parsedData = JSON.parse(localData);
            console.log('💾 Using localStorage data:', parsedData);
            setUploadInfo(parsedData);
          } else {
            console.error('❌ No data found in localStorage either');
            
            // Check if this is a known mock upload and set appropriate image_type
            let mockImageType = 'MS'; // default
            if (uploadId === 'upload_001' || uploadId === 'upload_004') {
              mockImageType = 'MS'; // Brain scans
            } else if (uploadId === 'upload_002' || uploadId === 'upload_006') {
              mockImageType = 'DMD'; // Muscle scans
            } else if (uploadId === 'upload_003' || uploadId === 'upload_005') {
              mockImageType = 'FILLER'; // Filler scans
            }
            
            console.log('🎭 Using mock image type for', uploadId, ':', mockImageType);
            setUploadInfo({ image_type: mockImageType });
          }
        }
      } catch (error) {
        console.error('❌ Network error fetching upload info, trying localStorage...', error);
        
        // Fallback to localStorage for development/testing
        const localData = localStorage.getItem(`upload_${uploadId}`);
        if (localData) {
          const parsedData = JSON.parse(localData);
          console.log('💾 Using localStorage data after network error:', parsedData);
          setUploadInfo(parsedData);
        } else {
          console.error('❌ No fallback data available');
          
          // Check if this is a known mock upload and set appropriate image_type  
          let mockImageType = 'MS'; // default
          if (uploadId === 'upload_001' || uploadId === 'upload_004') {
            mockImageType = 'MS'; // Brain scans
          } else if (uploadId === 'upload_002' || uploadId === 'upload_006') {
            mockImageType = 'DMD'; // Muscle scans
          } else if (uploadId === 'upload_003' || uploadId === 'upload_005') {
            mockImageType = 'FILLER'; // Filler scans
          }
          
          console.log('🎭 Using mock image type for', uploadId, ':', mockImageType);
          setUploadInfo({ image_type: mockImageType });
        }
      }
    })();
  }
}, [uploadId]);

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
    const addBtn = document.querySelector<HTMLButtonElement>("#add-btn");
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

  // Sections styles
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

  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const [showCanvas, setShowCanvas] = useState(false);
  const [imgDims, setImgDims] = useState<{ width: number; height: number } | null>(null);

  const diagnosisType = uploadInfo?.image_type?.toUpperCase();

  const [activeTimelineIndex, setActiveTimelineIndex] = useState(3);

  // Dynamic progression data based on diagnosis type
  const progressionData = diagnosisType === "DMD" 
    ? [
        { value: "15%", label: "Fat Fraction", severity: "normal" },
        { value: "22%", label: "Fat Fraction", severity: "mild" },
        { value: "31%", label: "Fat Fraction", severity: "moderate" },
        { value: "42%", label: "Current", severity: "severe" },
        { value: "55%", label: "Predicted", severity: "severe" },
      ]
    : diagnosisType === "FILLER"
    ? [ // FILLER type - filler distribution
        { value: "5%", label: "Filler Volume", severity: "normal" },
        { value: "12%", label: "Filler Volume", severity: "mild" },
        { value: "20%", label: "Filler Volume", severity: "moderate" },
        { value: "28%", label: "Current", severity: "severe" },
        { value: "35%", label: "Predicted", severity: "severe" },
      ]
    : [ // MS type - lesion percentage
        { value: "8%", label: "Lesion Percentage", severity: "normal" },
        { value: "15%", label: "Lesion Percentage", severity: "mild" },
        { value: "24%", label: "Lesion Percentage", severity: "moderate" },
        { value: "35%", label: "Current", severity: "severe" },
        { value: "42%", label: "Predicted", severity: "severe" },
      ];
  
  // Debug logging for diagnosis type
  useEffect(() => {
    console.log('🏥 Current uploadInfo:', uploadInfo);
    console.log('🏥 uploadInfo?.image_type:', uploadInfo?.image_type);
    console.log('🏥 Diagnosis type (after toUpperCase):', diagnosisType);
    console.log('🏥 Will display:', diagnosisType === "DMD" ? "DMD Monitor" : diagnosisType === "MS" ? "MS Monitor" : diagnosisType === "FILLER" ? "Filler Localisation Monitor" : "MS Monitor (default)");
    console.log('📊 Progression data:', progressionData);
  }, [uploadInfo, diagnosisType, progressionData]);

  return (
    <ProtectedRoute>
    <Navigation>
    <div className="dashboard-container">
      <div className="main-content">
        <div className="header">
          <h1>
            {diagnosisType === "DMD"
              ? "DMD Monitor"
              : diagnosisType === "MS"
                ? "MS Monitor"
                : diagnosisType === "FILLER"
                  ? "Filler Localisation Monitor"
                  : "MS Monitor"}
          </h1>
          <div className="subtitle">
            {diagnosisType === "DMD"
              ? "AI-Powered MRI Analysis for Duchenne Muscular Dystrophy"
              : diagnosisType === "MS"
                ? "AI-Powered MRI Analysis for Brain Tumor Detection"
                : diagnosisType === "FILLER"
                  ? "AI-Powered Imaging Analysis for Dermal Filler Detection"
                  : "AI-Powered MRI Analysis"}
          </div>

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
                  <div className="value">{diagnosisType === "DMD" ? "DMD-2024-0847" : diagnosisType === "MS" ? "MS-2024-0847" : diagnosisType === "FILLER" ? "FL-2024-0847" : "Unknown"}</div>
                </div>
                <div className="patient-info-card">
                  <div className="label">Age / Sex</div>
                  <div className="value">{diagnosisType === "DMD" ? "12Y / M" : diagnosisType === "MS" ? "32Y / F" : diagnosisType === "FILLER" ? "35Y / F" : "Unknown"}</div>
                </div>
                <div className="patient-info-card">
                  <div className="label">Ambulatory Status</div>
                  <div className="value">{diagnosisType === "DMD" ? "Late Ambulatory" : diagnosisType === "MS" ? "Ambulatory" : diagnosisType === "FILLER" ? "Ambulatory" : "Unknown"}</div>
                </div>
                <div className="patient-info-card">
                  <div className="label">Steroid</div>
                  <div className="value">{diagnosisType === "DMD" ? "Deflazacort" : diagnosisType === "MS" ? "None" : diagnosisType === "FILLER" ? "None" : "Unknown"}</div>
                </div>
                <div className="patient-info-card">
                  <div className="label">Last Scan</div>
                  <div className="value">2024-05-15</div>
                </div>
                {diagnosisType === "DMD" && (
                  <div className="patient-info-card">
                    <div className="label">NSAA Score</div>
                    <div className="value">18/34</div>
                  </div>
                )}
                {diagnosisType === "MS" && (
                  <div className="patient-info-card">
                    <div className="label">EDSS Score</div>
                    <div className="value">3.5</div>
                  </div>
                )}
                {diagnosisType === "FILLER" && (
                  <div className="patient-info-card">
                    <div className="label">Aesthetic Rating</div>
                    <div className="value">8.2/10</div>
                  </div>
                )}
              </div>

              <div className="biomarkers-grid">
                {diagnosisType === "DMD" && (
                  <>
                    <div className="biomarker-card">
                      <div className="biomarker-value value-moderate" style={{ color: "#ff9800" }}>42%</div>
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
                    <div className="biomarker-card">
                      <div className="biomarker-value value-moderate">15.2cm³</div>
                      <div className="biomarker-label">Fat Volume</div>
                      <div className="biomarker-status status-moderate">Elevated</div>
                    </div>
                  </>
                )}
                {diagnosisType === "MS" && (
                  <>
                    <div className="biomarker-card">
                      <div className="biomarker-value value-moderate">35%</div>
                      <div className="biomarker-label">Lesion Percentage</div>
                      <div className="biomarker-status status-moderate">Moderate</div>
                    </div>
                    <div className="biomarker-card">
                      <div className="biomarker-value value-severe">45ms</div>
                      <div className="biomarker-label">T₂ Relaxation</div>
                      <div className="biomarker-status status-severe">Elevated</div>
                    </div>
                    <div className="biomarker-card">
                      <div className="biomarker-value value-mild">18.4cm³</div>
                      <div className="biomarker-label">Fat Volume</div>
                      <div className="biomarker-status status-mild">Increased</div>
                    </div>
                    <div className="biomarker-card">
                      <div className="biomarker-value value-mild">2.8</div>
                      <div className="biomarker-label">Contrast Enhancement</div>
                      <div className="biomarker-status status-mild">Mild</div>
                    </div>
                    <div className="biomarker-card">
                      <div className="biomarker-value value-normal">12</div>
                      <div className="biomarker-label">Lesion Count</div>
                      <div className="biomarker-status status-normal">Multiple</div>
                    </div>
                    <div className="biomarker-card">
                      <div className="biomarker-value value-moderate">0.08%</div>
                      <div className="biomarker-label">Brain Atrophy</div>
                      <div className="biomarker-status status-moderate">Mild</div>
                    </div>
                  </>
                )}
                {diagnosisType === "FILLER" && (
                  <>
                    <div className="biomarker-card">
                      <div className="biomarker-value value-moderate">2.4ml</div>
                      <div className="biomarker-label">Filler Volume</div>
                      <div className="biomarker-status status-moderate">Detected</div>
                    </div>
                    <div className="biomarker-card">
                      <div className="biomarker-value value-mild">85%</div>
                      <div className="biomarker-label">Concentration</div>
                      <div className="biomarker-status status-mild">High</div>
                    </div>
                    <div className="biomarker-card">
                      <div className="biomarker-value value-normal">3</div>
                      <div className="biomarker-label">Injection Sites</div>
                      <div className="biomarker-status status-normal">Multiple</div>
                    </div>
                    <div className="biomarker-card">
                      <div className="biomarker-value value-mild">0.8mm</div>
                      <div className="biomarker-label">Migration Distance</div>
                      <div className="biomarker-status status-mild">Minimal</div>
                    </div>
                    <div className="biomarker-card">
                      <div className="biomarker-value value-normal">92%</div>
                      <div className="biomarker-label">Tissue Integration</div>
                      <div className="biomarker-status status-normal">Good</div>
                    </div>
                    <div className="biomarker-card">
                      <div className="biomarker-value value-normal">1.2</div>
                      <div className="biomarker-label">Symmetry Index</div>
                      <div className="biomarker-status status-normal">Balanced</div>
                    </div>
                  </>
                )}
                {!diagnosisType && (
                  <>
                    <div className="biomarker-card">
                      <div className="biomarker-value value-moderate">35%</div>
                      <div className="biomarker-label">Lesion Percentage</div>
                      <div className="biomarker-status status-moderate">Moderate</div>
                    </div>
                    <div className="biomarker-card">
                      <div className="biomarker-value value-severe">45ms</div>
                      <div className="biomarker-label">T₂ Relaxation</div>
                      <div className="biomarker-status status-severe">Elevated</div>
                    </div>
                  </>
                )}
                <div className="biomarker-card">
                  <div className="biomarker-value value-normal">2,834,259</div>
                  <div className="biomarker-label">Total Voxels</div>
                  <div className="biomarker-status status-normal">Segmentation</div>
                </div>
              </div>

              <div className="tab-content">
                {activeTab === "leg-analysis" && (
                  <div className="tab-panel active" id="leg-analysis">
                    <div className="mri-viewer">
                      <div className="mri-header">
                        <div className="mri-title">
                          {diagnosisType === "DMD" ? "Muscle Analysis" : diagnosisType === "FILLER" ? "Filler Distribution Analysis" : "Brain Analysis"}
                        </div>
                        <div className="scan-info">Screened by MyoMetrics • 07:12 pm, 05/02/22</div>
                      </div>
                      <div className="mri-display">
                        <div className="mri-image-container">
                          {mriImageUrl ? (
                            <img
                              src={mriImageUrl}
                              alt="DICOM Scan"
                              style={{
                                width: "100%",
                                height: "auto",
                                borderRadius: "8px",
                                border: "1px solid #3a3f52",
                                display: showCanvas ? "none" : "block",
                                cursor: "zoom-in"
                              }}
                              onClick={() => setIsImageZoomed(true)}
                              onLoad={e => {
                                const img = e.currentTarget;
                                setImgDims({ width: img.naturalWidth, height: img.naturalHeight });
                              }}
                              onError={(e) => {
                                console.error('Failed to load image:', mriImageUrl);
                                // Fallback to placeholder if image fails to load
                                e.currentTarget.src = "/image.png";
                              }}
                            />
                          ) : (
                            <img
                              src="/image.png"
                              alt="MRI Scan Placeholder"
                              style={{
                                width: "100%",
                                height: "auto",
                                borderRadius: "8px",
                                border: "1px solid #3a3f52",
                                display: showCanvas ? "none" : "block",
                                cursor: "zoom-in"
                              }}
                              onClick={() => setIsImageZoomed(true)}
                            />
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
                              <span style={{ fontWeight: 600, fontSize: 14 }}>
                                {diagnosisType === "DMD" ? "Muscle Analysis" : "Brain Lesions"}
                              </span>
                              <span style={{
                                fontSize: 18,
                                color: "#9aa0a6",
                                transition: "transform 0.2s",
                                display: "inline-block",
                                transform: isMuscleAbbrVisible ? "rotate(90deg)" : "rotate(0deg)"
                              }}>▶</span>
                            </div>
                            {isMuscleAbbrVisible && (
                              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {diagnosisType === "DMD" ? (
                                  // Muscle Analysis for DMD
                                  <>
                                    {/* VL - Vastus Lateralis */}
                                    <div style={lesionItemStyle}>
                                      <div 
                                        style={lesionHeaderStyle}
                                        onClick={() => setExpandedLesion(expandedLesion === 'VL' ? null : 'VL')}
                                      >
                                        <span>VL - Vastus Lateralis (65%)</span>
                                        <span style={{
                                          fontSize: 12,
                                          color: "#9aa0a6",
                                          transform: expandedLesion === 'VL' ? "rotate(90deg)" : "rotate(0deg)",
                                          transition: "transform 0.2s"
                                        }}>▶</span>
                                      </div>
                                      {expandedLesion === 'VL' && (
                                        <div style={lesionDescriptionStyle}>
                                          <p><strong>Function:</strong> Knee extension, gait stability</p>
                                          <p><strong>Normal values:</strong> Lesion %: 5-15%, T2: 28-35ms</p>
                                          <p><strong>Current reading:</strong> Lesion % 65%, T2 68ms</p>
                                          <p><strong>Clinical significance:</strong> Severely affected - major impact on walking ability and stair climbing.</p>
                                        </div>
                                      )}
                                    </div>

                                    {/* RF - Rectus Femoris */}
                                    <div style={lesionItemStyle}>
                                      <div 
                                        style={lesionHeaderStyle}
                                        onClick={() => setExpandedLesion(expandedLesion === 'RF' ? null : 'RF')}
                                      >
                                        <span>RF - Rectus Femoris (72%)</span>
                                        <span style={{
                                          fontSize: 12,
                                          color: "#9aa0a6",
                                          transform: expandedLesion === 'RF' ? "rotate(90deg)" : "rotate(0deg)",
                                          transition: "transform 0.2s"
                                        }}>▶</span>
                                      </div>
                                      {expandedLesion === 'RF' && (
                                        <div style={lesionDescriptionStyle}>
                                          <p><strong>Function:</strong> Knee extension, hip flexion</p>
                                          <p><strong>Normal values:</strong> Lesion %: 8-18%, T2: 30-36ms</p>
                                          <p><strong>Current reading:</strong> Lesion % 72%, T2 75ms</p>
                                          <p><strong>Clinical significance:</strong> Critically affected - loss of functional capacity imminent.</p>
                                        </div>
                                      )}
                                    </div>

                                    {/* BF - Biceps Femoris */}
                                    <div style={lesionItemStyle}>
                                      <div 
                                        style={lesionHeaderStyle}
                                        onClick={() => setExpandedLesion(expandedLesion === 'BF' ? null : 'BF')}
                                      >
                                        <span>BF - Biceps Femoris (58%)</span>
                                        <span style={{
                                          fontSize: 12,
                                          color: "#9aa0a6",
                                          transform: expandedLesion === 'BF' ? "rotate(90deg)" : "rotate(0deg)",
                                          transition: "transform 0.2s"
                                        }}>▶</span>
                                      </div>
                                      {expandedLesion === 'BF' && (
                                        <div style={lesionDescriptionStyle}>
                                          <p><strong>Function:</strong> Knee flexion, hip extension</p>
                                          <p><strong>Normal values:</strong> Lesion %: 6-16%, T2: 28-34ms</p>
                                          <p><strong>Current reading:</strong> Lesion % 58%, T2 62ms</p>
                                          <p><strong>Clinical significance:</strong> Moderately to severely affected - compensatory gait patterns developing.</p>
                                        </div>
                                      )}
                                    </div>

                                    {/* ADD - Adductor Group */}
                                    <div style={lesionItemStyle}>
                                      <div 
                                        style={lesionHeaderStyle}
                                        onClick={() => setExpandedLesion(expandedLesion === 'ADD' ? null : 'ADD')}
                                      >
                                        <span>ADD - Adductor Group (45%)</span>
                                        <span style={{
                                          fontSize: 12,
                                          color: "#9aa0a6",
                                          transform: expandedLesion === 'ADD' ? "rotate(90deg)" : "rotate(0deg)",
                                          transition: "transform 0.2s"
                                        }}>▶</span>
                                      </div>
                                      {expandedLesion === 'ADD' && (
                                        <div style={lesionDescriptionStyle}>
                                          <p><strong>Function:</strong> Hip adduction, pelvic stability</p>
                                          <p><strong>Normal values:</strong> Lesion %: 8-18%, T2: 30-37ms</p>
                                          <p><strong>Current reading:</strong> Lesion % 45%, T2 55ms</p>
                                          <p><strong>Clinical significance:</strong> Moderately affected - monitor for progression to critical threshold.</p>
                                        </div>
                                      )}
                                    </div>

                                    {/* SAR - Sartorius */}
                                    <div style={lesionItemStyle}>
                                      <div 
                                        style={lesionHeaderStyle}
                                        onClick={() => setExpandedLesion(expandedLesion === 'SAR' ? null : 'SAR')}
                                      >
                                        <span>SAR - Sartorius (18%)</span>
                                        <span style={{
                                          fontSize: 12,
                                          color: "#9aa0a6",
                                          transform: expandedLesion === 'SAR' ? "rotate(90deg)" : "rotate(0deg)",
                                          transition: "transform 0.2s"
                                        }}>▶</span>
                                      </div>
                                      {expandedLesion === 'SAR' && (
                                        <div style={lesionDescriptionStyle}>
                                          <p><strong>Function:</strong> Hip flexion, knee flexion, hip external rotation</p>
                                          <p><strong>Normal values:</strong> Lesion %: 5-15%, T2: 28-35ms</p>
                                          <p><strong>Current reading:</strong> Lesion % 18%, T2 38ms</p>
                                          <p><strong>Clinical significance:</strong> Relatively spared - good compensatory potential maintained.</p>
                                        </div>
                                      )}
                                    </div>

                                    {/* GRA - Gracilis */}
                                    <div style={lesionItemStyle}>
                                      <div 
                                        style={lesionHeaderStyle}
                                        onClick={() => setExpandedLesion(expandedLesion === 'GRA' ? null : 'GRA')}
                                      >
                                        <span>GRA - Gracilis (22%)</span>
                                        <span style={{
                                          fontSize: 12,
                                          color: "#9aa0a6",
                                          transform: expandedLesion === 'GRA' ? "rotate(90deg)" : "rotate(0deg)",
                                          transition: "transform 0.2s"
                                        }}>▶</span>
                                      </div>
                                      {expandedLesion === 'GRA' && (
                                        <div style={lesionDescriptionStyle}>
                                          <p><strong>Function:</strong> Hip adduction, knee flexion</p>
                                          <p><strong>Normal values:</strong> Lesion %: 6-16%, T2: 28-34ms</p>
                                          <p><strong>Current reading:</strong> Lesion % 22%, T2 42ms</p>
                                          <p><strong>Clinical significance:</strong> Mildly affected - preserve function through targeted therapy.</p>
                                        </div>
                                      )}
                                    </div>
                                  </>
                                ) : diagnosisType === "FILLER" ? (
                                  // Filler Injection Sites for FILLER
                                  <>
                                    {/* NL - Nasolabial Fold */}
                                    <div style={lesionItemStyle}>
                                      <div 
                                        style={lesionHeaderStyle}
                                        onClick={() => setExpandedLesion(expandedLesion === 'NL' ? null : 'NL')}
                                      >
                                        <span>NL - Nasolabial Fold (0.8ml detected)</span>
                                        <span style={{
                                          fontSize: 12,
                                          color: "#9aa0a6",
                                          transform: expandedLesion === 'NL' ? "rotate(90deg)" : "rotate(0deg)",
                                          transition: "transform 0.2s"
                                        }}>▶</span>
                                      </div>
                                      {expandedLesion === 'NL' && (
                                        <div style={lesionDescriptionStyle}>
                                          <p><strong>Filler Type:</strong> Hyaluronic acid (medium cross-linked)</p>
                                          <p><strong>Injection Depth:</strong> Mid-to-deep dermal layer</p>
                                          <p><strong>Volume:</strong> 0.8ml bilateral distribution</p>
                                          <p><strong>Assessment:</strong> Well-integrated, minimal migration, good aesthetic outcome.</p>
                                        </div>
                                      )}
                                    </div>

                                    {/* LC - Lip Contouring */}
                                    <div style={lesionItemStyle}>
                                      <div 
                                        style={lesionHeaderStyle}
                                        onClick={() => setExpandedLesion(expandedLesion === 'LC' ? null : 'LC')}
                                      >
                                        <span>LC - Lip Contouring (0.9ml detected)</span>
                                        <span style={{
                                          fontSize: 12,
                                          color: "#9aa0a6",
                                          transform: expandedLesion === 'LC' ? "rotate(90deg)" : "rotate(0deg)",
                                          transition: "transform 0.2s"
                                        }}>▶</span>
                                      </div>
                                      {expandedLesion === 'LC' && (
                                        <div style={lesionDescriptionStyle}>
                                          <p><strong>Filler Type:</strong> Hyaluronic acid (soft, low cross-linked)</p>
                                          <p><strong>Injection Depth:</strong> Superficial to mid-dermal</p>
                                          <p><strong>Volume:</strong> 0.9ml vermillion border enhancement</p>
                                          <p><strong>Assessment:</strong> Optimal placement, natural appearance maintained.</p>
                                        </div>
                                      )}
                                    </div>

                                    {/* MF - Marionette Fold */}
                                    <div style={lesionItemStyle}>
                                      <div 
                                        style={lesionHeaderStyle}
                                        onClick={() => setExpandedLesion(expandedLesion === 'MF' ? null : 'MF')}
                                      >
                                        <span>MF - Marionette Fold (0.7ml detected)</span>
                                        <span style={{
                                          fontSize: 12,
                                          color: "#9aa0a6",
                                          transform: expandedLesion === 'MF' ? "rotate(90deg)" : "rotate(0deg)",
                                          transition: "transform 0.2s"
                                        }}>▶</span>
                                      </div>
                                      {expandedLesion === 'MF' && (
                                        <div style={lesionDescriptionStyle}>
                                          <p><strong>Filler Type:</strong> Hyaluronic acid (medium viscosity)</p>
                                          <p><strong>Injection Depth:</strong> Deep dermal to subcutaneous</p>
                                          <p><strong>Volume:</strong> 0.7ml bilateral correction</p>
                                          <p><strong>Assessment:</strong> Good volumetric correction, excellent tissue integration.</p>
                                        </div>
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  // Default Brain Lesions for MS or unknown
                                  <>
                                    {/* FL - Frontal Lobe */}
                                    <div style={lesionItemStyle}>
                                      <div 
                                        style={lesionHeaderStyle}
                                        onClick={() => setExpandedLesion(expandedLesion === 'FL' ? null : 'FL')}
                                      >
                                        <span>FL - Frontal Lobe</span>
                                        <span style={{
                                          fontSize: 12,
                                          color: "#9aa0a6",
                                          transform: expandedLesion === 'FL' ? "rotate(90deg)" : "rotate(0deg)",
                                          transition: "transform 0.2s"
                                        }}>▶</span>
                                      </div>
                                      {expandedLesion === 'FL' && (
                                        <div style={lesionDescriptionStyle}>
                                          <p><strong>Function:</strong> Executive functions, personality, motor control</p>
                                          <p><strong>Normal values:</strong> No lesions, uniform signal intensity</p>
                                          <p><strong>Current reading:</strong> 3 hyperintense lesions detected</p>
                                          <p><strong>Clinical significance:</strong> May affect cognitive function and executive abilities.</p>
                                        </div>
                                      )}
                                    </div>

                                    {/* PL - Parietal Lobe */}
                                    <div style={lesionItemStyle}>
                                      <div 
                                        style={lesionHeaderStyle}
                                        onClick={() => setExpandedLesion(expandedLesion === 'PL' ? null : 'PL')}
                                      >
                                        <span>PL - Parietal Lobe</span>
                                        <span style={{
                                          fontSize: 12,
                                          color: "#9aa0a6",
                                          transform: expandedLesion === 'PL' ? "rotate(90deg)" : "rotate(0deg)",
                                          transition: "transform 0.2s"
                                        }}>▶</span>
                                      </div>
                                      {expandedLesion === 'PL' && (
                                        <div style={lesionDescriptionStyle}>
                                          <p><strong>Function:</strong> Sensory processing, spatial awareness, language</p>
                                          <p><strong>Normal values:</strong> Homogeneous appearance, no signal abnormalities</p>
                                          <p><strong>Current reading:</strong> 2 small lesions in white matter</p>
                                          <p><strong>Clinical significance:</strong> Potential impact on sensory integration and spatial processing.</p>
                                        </div>
                                      )}
                                    </div>
                                  </>
                                )}
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
                              <span style={{ fontWeight: 600, fontSize: 14 }}>
                                {diagnosisType === "FILLER" ? "Injection Analysis" : "Lesion %"}
                              </span>
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
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 60px", gap: "8px", padding: "6px 0", borderBottom: "1px solid #3f3f52", fontSize: "10px", color: "#9aa0a6", fontWeight: 600 }}>
                                  <div>Muscle</div>
                                  <div style={{ textAlign: "center" }}>Healthy Control</div>
                                  <div style={{ textAlign: "center" }}>DMD Patient</div>
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
                              aria-label={isDmdPatientVisible ? "Hide" : "Show"}
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
                                  borderBottom: "1px solid #3f3f52",
                                  fontSize: "10px",
                                  color: "#9aa0a6",
                                  fontWeight: 600
                                }}>
                                  <div>Muscle</div>
                                  <div style={{ textAlign: "center" }}>Healthy Control</div>
                                  <div style={{ textAlign: "center" }}>DMD Patient</div>
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
                                alt="Dixon MRI Study"
                                style={{
                                  width: "100%",
                                  height: "auto",
                                  borderRadius: "8px",
                                  border: "1px solid #3a3f52",
                                  display: showCanvas ? "none" : "block",
                                  cursor: "zoom-in"
                                }}
                                onClick={() => setIsImageZoomed(true)}
                                onError={(e) => {
                                  console.error('Failed to load Dixon image:', dixonImageUrl);
                                  // Fallback to placeholder if image fails to load
                                  e.currentTarget.src = "/image.png";
                                }}
                              />
                            ) : (
                              <img
                                src="/image.png"
                                alt="Dixon MRI Placeholder"
                                style={{
                                  width: "100%",
                                  height: "auto",
                                  borderRadius: "8px",
                                  border: "1px solid #3a3f52",
                                  display: showCanvas ? "none" : "block",
                                  cursor: "zoom-in"
                                }}
                                onClick={() => setIsImageZoomed(true)}
                              />
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
                                  <div className="info-label">Lesion %</div>
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
                              <div style={{ color: "#9aa0a6", fontSize: 13, padding: "10px 0" }}>
                                {/* Empty field or placeholder */}
                                No data available yet.
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

                          {/* Disease Rate & Accuracy */}
                          <div style={sectionCardStyle}>
                            <div style={sectionHeaderStyle}>
                              <span style={{ fontWeight: 600, fontSize: 14 }}>Disease Rate & Accuracy</span>
                            </div>
                            <div style={{ color: "#9aa0a6", fontSize: 13, padding: "10px 0" }}>
                              <div>Disease progression rate: 1.5x cohort average</div>
                              <div>Model accuracy: 85%</div>
                            </div>
                          </div>

                          {/* Segmentation Statistics */}
                          <div style={sectionCardStyle}>
                            <div style={sectionHeaderStyle}>
                              <span style={{ fontWeight: 600, fontSize: 14 }}>Segmentation Statistics</span>
                            </div>
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
                {diagnosisType === "DMD" && (
                  <>
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
                  </>
                )}
                {diagnosisType === "MS" && (
                  <>
                    <div className="insight-item">
                      <div className="insight-header">Critical Finding</div>
                      <div className="insight-text">Multiple periventricular lesions detected with active enhancement indicating ongoing inflammatory process. Consider immediate treatment modification.</div>
                    </div>
                    <div className="insight-item">
                      <div className="insight-header">Pattern Analysis</div>
                      <div className="insight-text">Distribution pattern consistent with demyelinating disease. Corpus callosum involvement suggests advanced progression.</div>
                    </div>
                    <div className="insight-item">
                      <div className="insight-header">Comparative Analysis</div>
                      <div className="insight-text">Lesion burden is 2.3x above normal range. Brain atrophy rate accelerating compared to baseline scans.</div>
                    </div>
                    <div className="insight-item">
                      <div className="insight-header">Treatment Response</div>
                      <div className="insight-text">Current therapy showing suboptimal response. Consider switching to high-efficacy DMT or combination therapy.</div>
                    </div>
                  </>
                )}
                {diagnosisType === "FILLER" && (
                  <>
                    <div className="insight-item">
                      <div className="insight-header">Distribution Analysis</div>
                      <div className="insight-text">Hyaluronic acid filler detected in subcutaneous and deep dermal layers. Distribution pattern consistent with aesthetic enhancement procedures.</div>
                    </div>
                    <div className="insight-item">
                      <div className="insight-header">Volume Assessment</div>
                      <div className="insight-text">Total filler volume of 2.4ml detected across 3 injection sites. Bilateral symmetry maintained with minimal migration observed.</div>
                    </div>
                    <div className="insight-item">
                      <div className="insight-header">Tissue Integration</div>
                      <div className="insight-text">Excellent tissue integration (92%) with no signs of granulomatous reaction or vascular compromise. Good biocompatibility profile.</div>
                    </div>
                    <div className="insight-item">
                      <div className="insight-header">Clinical Recommendation</div>
                      <div className="insight-text">Filler placement shows optimal aesthetic outcome. Monitor for long-term tissue response and plan maintenance schedule accordingly.</div>
                    </div>
                  </>
                )}
                {!diagnosisType && (
                  <>
                    <div className="insight-item">
                      <div className="insight-header">Critical Finding</div>
                      <div className="insight-text">Multiple periventricular lesions detected with active enhancement indicating ongoing inflammatory process. Consider immediate treatment modification.</div>
                    </div>
                    <div className="insight-item">
                      <div className="insight-header">Pattern Analysis</div>
                      <div className="insight-text">Distribution pattern consistent with demyelinating disease. Corpus callosum involvement suggests advanced progression.</div>
                    </div>
                    <div className="insight-item">
                      <div className="insight-header">Comparative Analysis</div>
                      <div className="insight-text">Lesion burden is 2.3x above normal range. Brain atrophy rate accelerating compared to baseline scans.</div>
                    </div>
                    <div className="insight-item">
                      <div className="insight-header">Treatment Response</div>
                      <div className="insight-text">Current therapy showing suboptimal response. Consider switching to high-efficacy DMT or combination therapy.</div>
                    </div>
                  </>
                )}
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
          </div>
        </div>
      </div>
    </div>
    </Navigation>
    </ProtectedRoute>
  );
}

const lesionItemStyle = {
  background: "#0f1117",
  border: "1px solid #2d3142",
  borderRadius: "6px",
  padding: "8px",
  cursor: "pointer"
};

const lesionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: "12px",
  color: "#e8eaed",
  fontWeight: 500
};

const lesionDescriptionStyle = {
  marginTop: "8px",
  padding: "8px",
  background: "#1a1d29",
  borderRadius: "4px",
  fontSize: "11px",
  color: "#9aa0a6",
  lineHeight: 1.4
};
