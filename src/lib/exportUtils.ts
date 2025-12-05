interface PrintExportData {
  name: string;
  printerName: string;
  filamentName: string;
  filamentUsedGrams: number;
  printTimeHours: number;
  calculations: {
    filamentCost: number;
    energyCost: number;
    depreciationCost: number;
    fixedCostShare: number;
    extraCosts: number;
    preparationCost: number;
    postProcessingCost: number;
    shippingCost: number;
    consumablesCost: number;
    totalCost: number;
    recommendedPrice: number;
    profit: number;
    profitAmount: number;
    discountTable: {
      discountPct: number;
      discountedPrice: number;
      potentialProfit: number;
    }[];
  };
  profitMarginPercent: number;
  discountPercent: number;
}

export function exportPrintToCSV(data: PrintExportData) {
  const rows = [
    ['Print Cost Report', ''],
    ['', ''],
    ['Print Name', data.name],
    ['Printer', data.printerName],
    ['Filament', data.filamentName],
    ['Filament Used (g)', data.filamentUsedGrams.toString()],
    ['Print Time (h)', data.printTimeHours.toString()],
    ['', ''],
    ['Cost Breakdown', ''],
    ['Filament Cost', `€${data.calculations.filamentCost.toFixed(2)}`],
    ['Depreciation', `€${data.calculations.depreciationCost.toFixed(2)}`],
    ['Electricity', `€${data.calculations.energyCost.toFixed(2)}`],
    ['Consumables', `€${data.calculations.consumablesCost.toFixed(2)}`],
    ['Preparation', `€${data.calculations.preparationCost.toFixed(2)}`],
    ['Post-Processing', `€${data.calculations.postProcessingCost.toFixed(2)}`],
    ['Shipping', `€${data.calculations.shippingCost.toFixed(2)}`],
    ['Fixed/Subscriptions', `€${data.calculations.fixedCostShare.toFixed(2)}`],
    ['Extra Costs', `€${data.calculations.extraCosts.toFixed(2)}`],
    ['', ''],
    ['Total Production Cost', `€${data.calculations.totalCost.toFixed(2)}`],
    [`Profit (${data.profitMarginPercent}%)`, `€${data.calculations.profitAmount.toFixed(2)}`],
    ['Recommended Sale Price', `€${data.calculations.recommendedPrice.toFixed(2)}`],
    ['Expected Profit', `€${data.calculations.profit.toFixed(2)}`],
    ['', ''],
    ['Discount Table', ''],
    ['Discount %', 'Price', 'Profit'],
  ];

  data.calculations.discountTable.forEach((d) => {
    rows.push([`${d.discountPct}%`, `€${d.discountedPrice.toFixed(2)}`, `€${d.potentialProfit.toFixed(2)}`]);
  });

  const csvContent = rows.map(row => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${data.name.replace(/[^a-z0-9]/gi, '_')}_cost_report.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportPrintToPDF(data: PrintExportData) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${data.name} - Cost Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
        h1 { color: #333; border-bottom: 2px solid #8b5cf6; padding-bottom: 10px; }
        h2 { color: #666; margin-top: 30px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; }
        .info-item { background: #f5f5f5; padding: 10px; border-radius: 5px; }
        .info-label { color: #888; font-size: 12px; }
        .info-value { font-weight: bold; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background: #f5f5f5; }
        .total-row { background: #f0f0f0; font-weight: bold; }
        .price-box { background: linear-gradient(135deg, #f59e0b, #f97316); color: white; padding: 20px; border-radius: 10px; margin: 20px 0; }
        .price-box h3 { margin: 0 0 10px 0; }
        .price-box .price { font-size: 32px; font-weight: bold; }
        .profit { color: #16a34a; }
        .loss { color: #dc2626; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <h1>Print Cost Report</h1>
      <p style="color: #888;">Generated on ${new Date().toLocaleDateString()}</p>
      
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Print Name</div>
          <div class="info-value">${data.name}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Printer</div>
          <div class="info-value">${data.printerName}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Filament</div>
          <div class="info-value">${data.filamentName}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Print Time</div>
          <div class="info-value">${data.printTimeHours} hours</div>
        </div>
      </div>

      <div class="price-box">
        <h3>Recommended Sale Price</h3>
        <div class="price">€${data.calculations.recommendedPrice.toFixed(2)}</div>
        <div>Profit: €${data.calculations.profit.toFixed(2)}</div>
      </div>

      <h2>Cost Breakdown</h2>
      <table>
        <tr><th>Component</th><th>Cost</th></tr>
        <tr><td>Filament (${data.filamentUsedGrams}g)</td><td>€${data.calculations.filamentCost.toFixed(2)}</td></tr>
        <tr><td>Depreciation</td><td>€${data.calculations.depreciationCost.toFixed(2)}</td></tr>
        <tr><td>Electricity</td><td>€${data.calculations.energyCost.toFixed(2)}</td></tr>
        <tr><td>Consumables</td><td>€${data.calculations.consumablesCost.toFixed(2)}</td></tr>
        <tr><td>Preparation Labor</td><td>€${data.calculations.preparationCost.toFixed(2)}</td></tr>
        <tr><td>Post-Processing Labor</td><td>€${data.calculations.postProcessingCost.toFixed(2)}</td></tr>
        <tr><td>Shipping</td><td>€${data.calculations.shippingCost.toFixed(2)}</td></tr>
        <tr><td>Fixed/Subscriptions</td><td>€${data.calculations.fixedCostShare.toFixed(2)}</td></tr>
        <tr><td>Extra Costs</td><td>€${data.calculations.extraCosts.toFixed(2)}</td></tr>
        <tr class="total-row"><td>Total Production Cost</td><td>€${data.calculations.totalCost.toFixed(2)}</td></tr>
        <tr><td>Profit Margin (${data.profitMarginPercent}%)</td><td>€${data.calculations.profitAmount.toFixed(2)}</td></tr>
      </table>

      <h2>Discount Table</h2>
      <table>
        <tr>
          <th>Discount</th>
          ${data.calculations.discountTable.map(d => `<th>${d.discountPct}%</th>`).join('')}
        </tr>
        <tr>
          <td>Price</td>
          ${data.calculations.discountTable.map(d => `<td>€${d.discountedPrice.toFixed(2)}</td>`).join('')}
        </tr>
        <tr>
          <td>Profit</td>
          ${data.calculations.discountTable.map(d => `<td class="${d.potentialProfit >= 0 ? 'profit' : 'loss'}">€${d.potentialProfit.toFixed(2)}</td>`).join('')}
        </tr>
      </table>

      <script>window.print();</script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
