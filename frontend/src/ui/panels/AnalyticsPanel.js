// src/ui/panels/AnalyticsPanel.js
import { Chart, registerables } from 'chart.js';
import { ApiService } from '../../services/ApiService.js';

Chart.register(...registerables);

export class AnalyticsPanel {
  constructor(containerId, worldId) {
    this.container = document.getElementById(containerId);
    this.worldId = worldId;
    this.api = new ApiService();
    this.charts = {};
    
    this.renderLayout();
    this.loadData();
  }

  renderLayout() {
    this.container.innerHTML = `
      <div class="analytics-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 16px;">
        <div class="card">
          <h4>Top Viewed Products</h4>
          <canvas id="chart-top-products"></canvas>
        </div>
        <div class="card">
          <h4>Store Traffic (Last 7 Days)</h4>
          <canvas id="chart-traffic"></canvas>
        </div>
      </div>
    `;
  }

  async loadData() {
    try {
      const data = await this.api.get(`/api/analytics/world/${this.worldId}/summary`);
      this.renderTopProductsChart(data.topProducts);
      this.renderTrafficChart(data.traffic);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  }

  renderTopProductsChart(products) {
    const ctx = document.getElementById('chart-top-products').getContext('2d');
    this.charts.topProducts = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: products.map(p => p.name),
        datasets: [{
          label: 'Views',
          data: products.map(p => p.views),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, grid: { color: '#333' } }, x: { grid: { display: false } } }
      }
    });
  }

  renderTrafficChart(trafficData) {
    const ctx = document.getElementById('chart-traffic').getContext('2d');
    this.charts.traffic = new Chart(ctx, {
      type: 'line',
      data: {
        labels: trafficData.map(d => d.date),
        datasets: [{
          label: 'Unique Visitors',
          data: trafficData.map(d => d.visitors),
          borderColor: '#4ade80',
          tension: 0.4,
          fill: true,
          backgroundColor: 'rgba(74, 222, 128, 0.1)'
        }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true, grid: { color: '#333' } }, x: { grid: { display: false } } }
      }
    });
  }

  destroy() {
    Object.values(this.charts).forEach(chart => chart.destroy());
  }
}