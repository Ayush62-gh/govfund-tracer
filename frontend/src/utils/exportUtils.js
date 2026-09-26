import confetti from 'canvas-confetti';

/**
 * Trigger celebratory confetti on action completion
 */
export function triggerCelebration() {
  try {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#FF671F', '#046A38', '#0A2540', '#10B981'],
    });
  } catch {
    // ignore in testing environments
  }
}

/**
 * Export array of objects to CSV download
 * @param {Array<object>} data 
 * @param {string} filename 
 */
export function exportToCSV(data, filename = 'MPLADS_Report.csv') {
  if (!data || !data.length) return;

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Header row
  csvRows.push(headers.join(','));

  // Data rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      if (val === null || val === undefined) return '""';
      const escaped = ('' + val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export raw JSON
 * @param {object|Array} data 
 * @param {string} filename 
 */
export function exportToJSON(data, filename = 'MPLADS_Export.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Trigger browser print for printable report dossier
 */
export function printDossier() {
  window.print();
}
