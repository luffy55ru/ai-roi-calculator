/**
 * AIROI.dev - Interactive Calculators & Affiliate Conversion Engine
 */

(function () {
  // Load custom saved affiliate links from localStorage if owner tested them locally
  const savedConfig = localStorage.getItem("airoi_custom_partners");
  if (savedConfig) {
    try {
      const parsed = JSON.parse(savedConfig);
      Object.keys(parsed).forEach((k) => {
        if (window.AFFILIATE_CONFIG.partners[k] && parsed[k].url) {
          window.AFFILIATE_CONFIG.partners[k].url = parsed[k].url;
        }
      });
    } catch (e) {
      console.error("Failed to parse saved partner config:", e);
    }
  }

  const partners = window.AFFILIATE_CONFIG.partners;

  // =========================================================================
  // TAB SWITCHING
  // =========================================================================
  const tabButtons = document.querySelectorAll(".tab-btn");
  const toolPanels = document.querySelectorAll(".tool-panel");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-tab");
      tabButtons.forEach((b) => b.classList.remove("active"));
      toolPanels.forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      const panel = document.getElementById(target);
      if (panel) panel.classList.add("active");
    });
  });

  // =========================================================================
  // TOOL 1: AI SUBSCRIPTION VS PAY-AS-YOU-GO AUDIT CALCULATOR
  // =========================================================================
  const subCheckboxes = document.querySelectorAll(".sub-checkbox");
  const promptsPerDaySlider = document.getElementById("promptsPerDay");
  const avgPromptWordsSlider = document.getElementById("avgPromptWords");
  const promptsPerDayVal = document.getElementById("promptsPerDayVal");
  const avgPromptWordsVal = document.getElementById("avgPromptWordsVal");

  function updateSubCalculator() {
    let currentSubMonthly = 0;
    let selectedCount = 0;

    subCheckboxes.forEach((cb) => {
      const parent = cb.closest(".sub-item");
      if (cb.checked) {
        currentSubMonthly += parseFloat(cb.getAttribute("data-price") || "0");
        selectedCount++;
        if (parent) parent.classList.add("checked");
      } else {
        if (parent) parent.classList.remove("checked");
      }
    });

    const promptsDay = parseInt(promptsPerDaySlider.value, 10) || 25;
    const wordsPerPrompt = parseInt(avgPromptWordsSlider.value, 10) || 400;

    promptsPerDayVal.textContent = `${promptsDay} msgs/day`;
    avgPromptWordsVal.textContent = `${wordsPerPrompt} words`;

    // 1 word ~ 1.35 tokens. Include input + output tokens across 30 days
    const monthlyTokens = promptsDay * 30 * (wordsPerPrompt * 1.35);
    const millionTokens = monthlyTokens / 1000000;

    // Blended API rate across Claude 3.7 Sonnet / GPT-4o / Gemini 2.5 Pro ($4.80 per 1M blended tokens) + $5 light asset buffer
    const estimatedApiCost = Math.max(2.5, millionTokens * 4.8 + (selectedCount > 2 ? 9 : 0));
    const monthlySavings = Math.max(0, currentSubMonthly - estimatedApiCost);
    const yearlySavings = monthlySavings * 12;

    document.getElementById("subCurrentSpend").textContent = `$${currentSubMonthly.toFixed(0)}/mo`;
    document.getElementById("subApiEquivalent").textContent = `$${estimatedApiCost.toFixed(2)}/mo`;
    document.getElementById("subYearlySavings").textContent = `$${yearlySavings.toFixed(0)}/yr`;

    const verdictEl = document.getElementById("subVerdictText");
    if (monthlySavings > 15) {
      verdictEl.textContent = `You are overpaying by $${monthlySavings.toFixed(0)}/month! Switching to unified API / All-in-One tools cuts your bill by ${Math.round((monthlySavings / Math.max(1, currentSubMonthly)) * 100)}%.`;
    } else if (currentSubMonthly === 0) {
      verdictEl.textContent = "Select at least one subscription on the left to calculate your potential savings.";
    } else {
      verdictEl.textContent = "Your usage is high enough that flat subscriptions or bundled workspaces are well-utilized.";
    }

    // Render top affiliate recommendations for Tool 1
    const recContainer = document.getElementById("subRecommendations");
    recContainer.innerHTML = [
      renderRecCard(partners.customgpt, "Top Pick: Replace Team AI Seats with 1 Custom Bot"),
      renderRecCard(partners.submagic, "Save 90% on AI Video Editing & Captions"),
      renderRecCard(partners.openrouter, "Cut Idle $20/mo Subscriptions")
    ].join("");
  }

  subCheckboxes.forEach((cb) => cb.addEventListener("change", updateSubCalculator));
  if (promptsPerDaySlider) promptsPerDaySlider.addEventListener("input", updateSubCalculator);
  if (avgPromptWordsSlider) avgPromptWordsSlider.addEventListener("input", updateSubCalculator);

  // =========================================================================
  // TOOL 2: LLM API TOKEN COST COMPARATOR (2026 MODELS)
  // =========================================================================
  const apiRunsDay = document.getElementById("apiRunsDay");
  const apiInputTokens = document.getElementById("apiInputTokens");
  const apiOutputTokens = document.getElementById("apiOutputTokens");
  const apiCachePct = document.getElementById("apiCachePct");

  const MODELS = [
    { name: "Gemini 2.5 Flash", inputPerM: 0.15, outputPerM: 0.60, tag: "Best Budget Speed" },
    { name: "DeepSeek R1 (API)", inputPerM: 0.55, outputPerM: 2.19, tag: "Best Reasoning Value" },
    { name: "GPT-4o mini / o3-mini", inputPerM: 1.10, outputPerM: 4.40, tag: "Fast Generalist" },
    { name: "Gemini 2.5 Pro", inputPerM: 1.25, outputPerM: 5.00, tag: "2M Context King" },
    { name: "OpenAI GPT-4o", inputPerM: 2.50, outputPerM: 10.00, tag: "Enterprise Standard" },
    { name: "Claude 3.7 Sonnet", inputPerM: 3.00, outputPerM: 15.00, tag: "Top Coding & Writing" }
  ];

  function updateApiCalculator() {
    const runsDay = parseInt(apiRunsDay.value, 10);
    const inTok = parseInt(apiInputTokens.value, 10);
    const outTok = parseInt(apiOutputTokens.value, 10);
    const cacheRatio = parseInt(apiCachePct.value, 10) / 100;

    document.getElementById("apiRunsDayVal").textContent = `${runsDay.toLocaleString()} calls/day`;
    document.getElementById("apiInputTokensVal").textContent = `${inTok.toLocaleString()} tok`;
    document.getElementById("apiOutputTokensVal").textContent = `${outTok.toLocaleString()} tok`;
    document.getElementById("apiCachePctVal").textContent = `${Math.round(cacheRatio * 100)}% cached`;

    const monthlyCalls = runsDay * 30;
    const totalInMillions = (monthlyCalls * inTok) / 1000000;
    const totalOutMillions = (monthlyCalls * outTok) / 1000000;

    // Cached input tokens typically get a 75% discount
    const effectiveInFactor = (1 - cacheRatio) + cacheRatio * 0.25;

    const results = MODELS.map((m) => {
      const cost = totalInMillions * effectiveInFactor * m.inputPerM + totalOutMillions * m.outputPerM;
      return { ...m, monthlyCost: cost };
    });

    const maxCost = Math.max(...results.map((r) => r.monthlyCost), 1);
    const minModel = results[0];
    const maxModel = results[results.length - 1];

    document.getElementById("apiSpreadSavings").textContent =
      `$${Math.max(0, maxModel.monthlyCost - minModel.monthlyCost).toFixed(2)}/mo`;
    document.getElementById("apiTotalMonthlyTokens").textContent =
      `${(totalInMillions + totalOutMillions).toFixed(1)}M tok/mo`;

    const barsContainer = document.getElementById("modelBarsContainer");
    barsContainer.innerHTML = results
      .map((r) => {
        const widthPct = Math.max(6, Math.min(100, (r.monthlyCost / maxCost) * 100));
        return `
          <div class="model-bar-item">
            <div class="model-bar-header">
              <span>${r.name} <small style="color:#34d399; margin-left:6px;">(${r.tag})</small></span>
              <span style="color:#fff; font-family:monospace;">$${r.monthlyCost.toFixed(2)}/mo</span>
            </div>
            <div class="model-bar-track">
              <div class="model-bar-fill" style="width:${widthPct}%"></div>
            </div>
          </div>
        `;
      })
      .join("");

    document.getElementById("apiRecommendations").innerHTML = [
      renderRecCard(partners.n8n, "Connect Any LLM API into an Agent"),
      renderRecCard(partners.customgpt, "Zero-Maintenance RAG Without Raw API Hassle")
    ].join("");
  }

  [apiRunsDay, apiInputTokens, apiOutputTokens, apiCachePct].forEach((el) => {
    if (el) el.addEventListener("input", updateApiCalculator);
  });

  // =========================================================================
  // TOOL 3: B2B AI AUTOMATION & AGENT ROI CALCULATOR
  // =========================================================================
  const roiTeamSize = document.getElementById("roiTeamSize");
  const roiHoursWeek = document.getElementById("roiHoursWeek");
  const roiHourlyWage = document.getElementById("roiHourlyWage");
  const roiAutoPct = document.getElementById("roiAutoPct");

  function updateRoiCalculator() {
    const team = parseInt(roiTeamSize.value, 10);
    const hoursWeek = parseInt(roiHoursWeek.value, 10);
    const wage = parseInt(roiHourlyWage.value, 10);
    const autoRate = parseInt(roiAutoPct.value, 10) / 100;

    document.getElementById("roiTeamSizeVal").textContent = `${team} employees`;
    document.getElementById("roiHoursWeekVal").textContent = `${hoursWeek} hrs/wk each`;
    document.getElementById("roiHourlyWageVal").textContent = `$${wage}/hr`;
    document.getElementById("roiAutoPctVal").textContent = `${Math.round(autoRate * 100)}% automated`;

    const monthlyManualCost = team * hoursWeek * 4.33 * wage;
    const grossMonthlySaved = monthlyManualCost * autoRate;
    const estSoftwareCost = Math.min(450, 29 + team * 18);
    const netMonthlySaved = Math.max(0, grossMonthlySaved - estSoftwareCost);
    const annualNetRoi = netMonthlySaved * 12;
    const hoursReclaimedMonth = Math.round(team * hoursWeek * 4.33 * autoRate);

    document.getElementById("roiAnnualNet").textContent = `$${Math.round(annualNetRoi).toLocaleString()}/yr`;
    document.getElementById("roiMonthlyNet").textContent = `$${Math.round(netMonthlySaved).toLocaleString()}/mo`;
    document.getElementById("roiHoursReclaimed").textContent = `${hoursReclaimedMonth.toLocaleString()} hrs/mo`;

    document.getElementById("roiRecommendations").innerHTML = [
      renderRecCard(partners.customgpt, "Automate 80% of Customer Support Tickets"),
      renderRecCard(partners.submagic, "Automate Short-Form Video & Social Production"),
      renderRecCard(partners.synthflow, "Automate Inbound/Outbound Phone Calls")
    ].join("");
  }

  [roiTeamSize, roiHoursWeek, roiHourlyWage, roiAutoPct].forEach((el) => {
    if (el) el.addEventListener("input", updateRoiCalculator);
  });

  // =========================================================================
  // TOOL 4: AI STACK FINDER QUIZ
  // =========================================================================
  const quizGoal = document.getElementById("quizGoal");
  const quizBudget = document.getElementById("quizBudget");
  const quizSkill = document.getElementById("quizSkill");

  function updateStackQuiz() {
    const goal = quizGoal.value;
    const skill = quizSkill.value;

    let picks = [];
    if (goal === "automation") {
      picks = skill === "developer"
        ? [partners.n8n, partners.openrouter, partners.elevenlabs]
        : [partners.make, partners.customgpt, partners.synthflow];
    } else if (goal === "content") {
      picks = [partners.submagic, partners.heygen, partners.writesonic];
    } else if (goal === "support") {
      picks = [partners.customgpt, partners.synthflow, partners.make];
    } else {
      picks = [partners.openrouter, partners.n8n, partners.writesonic];
    }

    const container = document.getElementById("quizResultsContainer");
    container.innerHTML = picks
      .map((p, idx) => renderRecCard(p, `Step ${idx + 1} in Your Recommended Stack`))
      .join("");
  }

  [quizGoal, quizBudget, quizSkill].forEach((el) => {
    if (el) el.addEventListener("change", updateStackQuiz);
  });

  // =========================================================================
  // RENDER PARTNER DIRECTORY & HELPER CARDS
  // =========================================================================
  function renderRecCard(partner, customBadge) {
    if (!partner) return "";
    return `
      <div class="rec-card">
        <div class="rec-top">
          <span class="rec-title">${partner.name}</span>
          <span class="rec-badge">${customBadge || partner.badge}</span>
        </div>
        <p class="rec-desc">${partner.description}</p>
        <div class="rec-footer">
          <span class="rec-price">${partner.priceText} • ${partner.discountText}</span>
          <a href="${partner.url}" target="_blank" rel="noopener sponsored" class="btn-primary">
            Try ${partner.name} →
          </a>
        </div>
      </div>
    `;
  }

  function renderPartnerDirectory() {
    const grid = document.getElementById("partnerDirectoryGrid");
    if (!grid) return;
    grid.innerHTML = Object.values(partners)
      .map(
        (p) => `
        <div class="partner-card">
          <div>
            <div class="rec-top" style="margin-bottom:0.6rem;">
              <span class="rec-title">${p.name}</span>
              <span class="rec-badge">${p.badge}</span>
            </div>
            <div style="font-size:0.76rem; color:#93c5fd; font-weight:600; margin-bottom:0.5rem;">
              ${p.category}
            </div>
            <p class="rec-desc">${p.description}</p>
          </div>
          <div style="margin-top:1rem; padding-top:0.85rem; border-top:1px solid rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:space-between;">
            <span style="font-size:0.8rem; color:#34d399; font-weight:700;">${p.discountText}</span>
            <a href="${p.url}" target="_blank" rel="noopener sponsored" class="btn-primary" style="padding:0.5rem 0.9rem; font-size:0.82rem;">
              Visit Site ↗
            </a>
          </div>
        </div>
      `
      )
      .join("");
  }

  // =========================================================================
  // SHARE CALCULATION BUTTON
  // =========================================================================
  const shareBtn = document.getElementById("shareCalcBtn");
  if (shareBtn) {
    shareBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(window.location.href).then(() => {
        const orig = shareBtn.textContent;
        shareBtn.textContent = "✓ Link Copied!";
        setTimeout(() => {
          shareBtn.textContent = orig;
        }, 2000);
      });
    });
  }

  // =========================================================================
  // AFFILIATE LINK MANAGER MODAL (FOR SITE OWNER)
  // =========================================================================
  const adminModal = document.getElementById("adminModal");
  const openAdminBtn = document.getElementById("openAdminBtn");
  const closeAdminBtn = document.getElementById("closeAdminBtn");
  const saveAdminBtn = document.getElementById("saveAdminBtn");
  const downloadConfigBtn = document.getElementById("downloadConfigBtn");
  const adminInputsContainer = document.getElementById("adminInputsContainer");

  function populateAdminModal() {
    if (!adminInputsContainer) return;
    adminInputsContainer.innerHTML = Object.entries(partners)
      .map(
        ([key, p]) => `
        <div style="margin-bottom:1rem; padding-bottom:0.85rem; border-bottom:1px solid rgba(255,255,255,0.07);">
          <div style="display:flex; justify-content:space-between; font-size:0.88rem; font-weight:700;">
            <span>${p.name} (${p.category})</span>
            <span style="color:#34d399;">Avg Commission: ${p.commissionInfo}</span>
          </div>
          <input type="url" class="input-field partner-url-input" data-key="${key}" value="${p.url}" placeholder="https://..." />
        </div>
      `
      )
      .join("");
  }

  if (openAdminBtn) {
    openAdminBtn.addEventListener("click", (e) => {
      e.preventDefault();
      populateAdminModal();
      adminModal.classList.add("open");
    });
  }

  if (closeAdminBtn) {
    closeAdminBtn.addEventListener("click", () => {
      adminModal.classList.remove("open");
    });
  }

  if (saveAdminBtn) {
    saveAdminBtn.addEventListener("click", () => {
      const inputs = document.querySelectorAll(".partner-url-input");
      inputs.forEach((inp) => {
        const key = inp.getAttribute("data-key");
        if (partners[key] && inp.value.trim()) {
          partners[key].url = inp.value.trim();
        }
      });
      localStorage.setItem("airoi_custom_partners", JSON.stringify(partners));
      updateSubCalculator();
      updateApiCalculator();
      updateRoiCalculator();
      updateStackQuiz();
      renderPartnerDirectory();
      saveAdminBtn.textContent = "✓ Saved! Links Active";
      setTimeout(() => {
        saveAdminBtn.textContent = "Save & Apply Links";
      }, 2000);
    });
  }

  if (downloadConfigBtn) {
    downloadConfigBtn.addEventListener("click", () => {
      const inputs = document.querySelectorAll(".partner-url-input");
      inputs.forEach((inp) => {
        const key = inp.getAttribute("data-key");
        if (partners[key] && inp.value.trim()) {
          partners[key].url = inp.value.trim();
        }
      });
      const fileContent =
        "window.AFFILIATE_CONFIG = " + JSON.stringify(window.AFFILIATE_CONFIG, null, 2) + ";\n";
      const blob = new Blob([fileContent], { type: "application/javascript" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "affiliate-config.js";
      a.click();
    });
  }

  // Open admin modal automatically if URL has ?admin=1
  if (window.location.search.includes("admin=1")) {
    populateAdminModal();
    adminModal.classList.add("open");
  }

  // Initialize all calculators on page load
  updateSubCalculator();
  updateApiCalculator();
  updateRoiCalculator();
  updateStackQuiz();
  renderPartnerDirectory();
})();
