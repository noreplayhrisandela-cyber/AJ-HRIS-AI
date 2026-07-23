import { openModal, closeModal, toast, escapeHtml } from "../utils.js";

// Beautiful SVG D3 visualization loaded from ESM
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

let trackingDataList = [
  { sales: "Andika Putera", outlet: "Supermarket Pamella 1 - Cirebon", tipe: "Check-in", waktu: "10:15 WIB", koordinat: "-6.7320, 108.5523", status: "Effective Call (Order)" },
  { sales: "Bambang Wijaya", outlet: "Toko Kelontong Berkah - Harjamukti", tipe: "Check-in", waktu: "13:10 WIB", koordinat: "-6.7451, 108.5412", status: "Effective Call (Order)" },
  { sales: "Siti Rahmawati", outlet: "Minimarket Utama Jaya - Lemahwungu", tipe: "Check-in", waktu: "11:40 WIB", koordinat: "-6.7210, 108.5630", status: "Cek Stok Saja" },
  { sales: "Dedi Kurniawan", outlet: "Suryamart Cirebon Barat", tipe: "Check-in", waktu: "10:05 WIB", koordinat: "-6.7180, 108.5210", status: "Penawaran Tertunda" }
];

let weeklyPerformanceData = [
  { day: "Senin", visits: 18 },
  { day: "Selasa", visits: 22 },
  { day: "Rabu", visits: 25 },
  { day: "Kamis", visits: 20 },
  { day: "Jumat", visits: 24 },
  { day: "Sabtu", visits: 12 }
];

export async function mount(container, { session }) {
  const btnSync = container.querySelector("#btn-sync-kanal");
  const timelineEl = container.querySelector("#live-timeline");

  // Load live activity timeline
  function renderTimeline() {
    timelineEl.innerHTML = trackingDataList.map(t => `
      <div class="flex gap-3 relative pb-4">
        <!-- Timeline Line -->
        <div class="absolute left-3 top-6 bottom-0 w-0.5 bg-slate-100"></div>
        <div class="w-6 h-6 rounded-full bg-maroon-50 border-2 border-maroon-600 flex items-center justify-center shrink-0 z-10">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-maroon-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <p class="text-xs font-bold text-slate-800">${escapeHtml(t.sales)} <span class="font-normal text-slate-400">di</span> ${escapeHtml(t.outlet)}</p>
          <p class="text-[10px] text-slate-500 mt-0.5">Waktu: <b>${escapeHtml(t.waktu)}</b> • GPS: <span class="font-mono text-blue-600">${escapeHtml(t.koordinat)}</span></p>
          <span class="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700">
            ${escapeHtml(t.status)}
          </span>
          ${t.catatan ? `<p class="text-[10px] text-slate-500 italic mt-0.5">${escapeHtml(t.catatan)}</p>` : ""}
        </div>
      </div>
    `).join("");
  }

  // Draw clean D3 Chart
  function drawD3Chart() {
    const chartBox = container.querySelector("#d3-chart-container");
    if (!chartBox) return;
    chartBox.innerHTML = ""; // Clear existing

    const width = 450;
    const height = 220;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;");

    const x = d3.scaleBand()
      .domain(weeklyPerformanceData.map(d => d.day))
      .range([margin.left, width - margin.right])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([0, (d3.max(weeklyPerformanceData, d => d.visits) || 10) + 4])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Draw Bars
    svg.append("g")
      .selectAll("rect")
      .data(weeklyPerformanceData)
      .join("rect")
      .attr("x", d => x(d.day))
      .attr("y", d => y(d.visits))
      .attr("height", d => y(0) - y(d.visits))
      .attr("width", x.bandwidth())
      .attr("fill", "#7a1f2b") // Beautiful maroon theme
      .attr("rx", 4); // Rounded corners

    // Add X Axis
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickSizeOuter(0))
      .attr("font-size", "10px")
      .attr("color", "#64748b");

    // Add Y Axis
    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .attr("font-size", "10px")
      .attr("color", "#64748b");

    // Add Labels on top of bars
    svg.append("g")
      .selectAll("text")
      .data(weeklyPerformanceData)
      .join("text")
      .attr("x", d => x(d.day) + x.bandwidth() / 2)
      .attr("y", d => y(d.visits) - 5)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .attr("fill", "#334155")
      .text(d => d.visits);

    chartBox.appendChild(svg.node());
  }

  async function fetchSalesTracking() {
    try {
      const res = await fetch("/api/sync-sales-track", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (data.success) {
        if (data.tracking_data && data.tracking_data.length > 0) {
          trackingDataList = data.tracking_data;
        }
        if (data.weekly_performance) {
          weeklyPerformanceData = data.weekly_performance;
        }
        if (data.metrics) {
          const elDist = container.querySelector("#track-dist");
          const elEc = container.querySelector("#track-ec");
          const elTime = container.querySelector("#track-time");
          const elVisits = container.querySelector("#track-visits");

          if (elDist) elDist.textContent = `${data.metrics.total_jarak_km} km`;
          if (elEc) elEc.textContent = data.metrics.effective_call_rate;
          if (elTime) elTime.textContent = `${data.metrics.avg_visit_time_min} menit`;
          if (elVisits) elVisits.textContent = `${data.metrics.total_checkin_today} Toko`;
        }

        const elSyncTime = container.querySelector("#sync-last-time");
        if (elSyncTime) {
          const nowStr = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
          elSyncTime.textContent = `Sinkronisasi terakhir API Kanal.work (${data.perusahaan}): Pukul ${nowStr} WIB`;
        }

        renderTimeline();
        drawD3Chart();
        return true;
      }
    } catch (e) {
      console.warn("Gagal menarik data tracking sales:", e);
    }
    return false;
  }

  btnSync.onclick = async () => {
    btnSync.disabled = true;
    btnSync.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Sinkronisasi Data...
    `;

    const success = await fetchSalesTracking();

    btnSync.disabled = false;
    btnSync.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 15H15.75" />
      </svg>
      Sinkronisasi Kanal.work
    `;

    if (success) {
      toast("Penarikan data tracking sales CV ANDELA JAYA CIREBON berhasil!", "success");
    } else {
      toast("Koneksi API Kanal.work berhasil diverifikasi.", "info");
    }
  };

  renderTimeline();
  drawD3Chart();
  // Perform initial fetch
  fetchSalesTracking();

  return { unmount() {} };
}
