import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import Papa from 'papaparse';
import { Mood } from './supabase';
import { moods } from './utils';

export interface ExportData {
  user: {
    username: string;
    displayName: string;
    id: string;
  };
  moodHistory: Mood[];
  dateRange: {
    start: Date;
    end: Date;
  };
}

// Export mood data to CSV
export function exportMoodDataToCSV(exportData: ExportData): void {
  const csvData = exportData.moodHistory.map(mood => {
    const moodDetails = moods.find(m => m.id === mood.mood_type);
    return {
      'Date': new Date(mood.created_at).toLocaleDateString(),
      'Time': new Date(mood.created_at).toLocaleTimeString(),
      'Mood': moodDetails?.name || mood.mood_type,
      'Emoji': moodDetails?.emoji || '',
      'Description': moodDetails?.description || '',
      'Visible to Friends': mood.is_visible ? 'Yes' : 'No',
      'Acknowledgments': mood.acknowledgment_count || 0,
      'ISO Timestamp': mood.created_at
    };
  });

  const csv = Papa.unparse(csvData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `steatus-mood-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Export mood data to PDF report
export async function exportMoodDataToPDF(exportData: ExportData): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Title
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('sTEAtus Mood Report', margin, yPosition);
  yPosition += 15;

  // User info
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`User: ${exportData.user.displayName} (@${exportData.user.username})`, margin, yPosition);
  yPosition += 7;
  pdf.text(`Export Date: ${new Date().toLocaleDateString()}`, margin, yPosition);
  yPosition += 7;
  pdf.text(`Date Range: ${exportData.dateRange.start.toLocaleDateString()} - ${exportData.dateRange.end.toLocaleDateString()}`, margin, yPosition);
  yPosition += 7;
  pdf.text(`Total Entries: ${exportData.moodHistory.length}`, margin, yPosition);
  yPosition += 15;

  // Summary statistics
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Mood Summary', margin, yPosition);
  yPosition += 10;

  // Calculate mood distribution
  const moodCounts: Record<string, number> = {};
  exportData.moodHistory.forEach(mood => {
    moodCounts[mood.mood_type] = (moodCounts[mood.mood_type] || 0) + 1;
  });

  const sortedMoods = Object.entries(moodCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5); // Top 5 moods

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  sortedMoods.forEach(([moodType, count]) => {
    const moodDetails = moods.find(m => m.id === moodType);
    const percentage = ((count / exportData.moodHistory.length) * 100).toFixed(1);
    pdf.text(`${moodDetails?.emoji || ''} ${moodDetails?.name || moodType}: ${count} times (${percentage}%)`, margin, yPosition);
    yPosition += 5;
  });

  yPosition += 10;

  // Mood history table
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Recent Mood History', margin, yPosition);
  yPosition += 10;

  // Table headers
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  const colWidths = [30, 20, 40, 25, 25];
  const headers = ['Date', 'Time', 'Mood', 'Visible', 'Acks'];
  let xPos = margin;
  
  headers.forEach((header, i) => {
    pdf.text(header, xPos, yPosition);
    xPos += colWidths[i];
  });
  yPosition += 7;

  // Table rows (limit to first 30 entries to fit on page)
  pdf.setFont('helvetica', 'normal');
  const displayEntries = exportData.moodHistory.slice(0, 30);
  
  displayEntries.forEach(mood => {
    if (yPosition > pageHeight - 30) {
      pdf.addPage();
      yPosition = margin;
    }

    const moodDetails = moods.find(m => m.id === mood.mood_type);
    const date = new Date(mood.created_at);
    
    xPos = margin;
    const rowData = [
      date.toLocaleDateString(),
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      `${moodDetails?.emoji || ''} ${moodDetails?.name || mood.mood_type}`,
      mood.is_visible ? 'Yes' : 'No',
      (mood.acknowledgment_count || 0).toString()
    ];

    rowData.forEach((data, i) => {
      // Truncate text if too long
      const maxWidth = colWidths[i] - 2;
      const text = pdf.getTextWidth(data) > maxWidth 
        ? data.substring(0, Math.floor(data.length * maxWidth / pdf.getTextWidth(data))) + '...'
        : data;
      
      pdf.text(text, xPos, yPosition);
      xPos += colWidths[i];
    });
    yPosition += 5;
  });

  if (exportData.moodHistory.length > 30) {
    yPosition += 5;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.text(`... and ${exportData.moodHistory.length - 30} more entries. Download CSV for complete data.`, margin, yPosition);
  }

  // Footer
  yPosition = pageHeight - 15;
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Generated by sTEAtus - Mood Tracking & Support Network', margin, yPosition);
  pdf.text('For complete data analysis, consider exporting to CSV format.', margin, yPosition + 4);

  // Save the PDF
  const fileName = `steatus-mood-report-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
}

// Generate insights from mood data
export function generateMoodInsights(moodHistory: Mood[]): {
  totalEntries: number;
  mostCommonMood: { name: string; count: number; percentage: number } | null;
  moodStreak: { current: string; count: number } | null;
  weeklyAverage: number;
  positiveRatio: number;
} {
  if (moodHistory.length === 0) {
    return {
      totalEntries: 0,
      mostCommonMood: null,
      moodStreak: null,
      weeklyAverage: 0,
      positiveRatio: 0
    };
  }

  // Most common mood
  const moodCounts: Record<string, number> = {};
  moodHistory.forEach(mood => {
    moodCounts[mood.mood_type] = (moodCounts[mood.mood_type] || 0) + 1;
  });

  const mostCommon = Object.entries(moodCounts).reduce((a, b) => 
    moodCounts[a[0]] > moodCounts[b[0]] ? a : b
  );

  const mostCommonMood = mostCommon ? {
    name: moods.find(m => m.id === mostCommon[0])?.name || mostCommon[0],
    count: mostCommon[1],
    percentage: Math.round((mostCommon[1] / moodHistory.length) * 100)
  } : null;

  // Current mood streak
  const currentMood = moodHistory[0]?.mood_type;
  let streakCount = 0;
  for (const mood of moodHistory) {
    if (mood.mood_type === currentMood) {
      streakCount++;
    } else {
      break;
    }
  }

  const moodStreak = currentMood ? {
    current: moods.find(m => m.id === currentMood)?.name || currentMood,
    count: streakCount
  } : null;

  // Weekly average (entries per week)
  const oldestEntry = new Date(moodHistory[moodHistory.length - 1]?.created_at || Date.now());
  const daysDiff = Math.max(1, (Date.now() - oldestEntry.getTime()) / (1000 * 60 * 60 * 24));
  const weeklyAverage = Math.round((moodHistory.length / daysDiff) * 7 * 10) / 10;

  // Positive mood ratio
  const positiveMoods = ['happy', 'calm', 'focused'];
  const positiveCount = moodHistory.filter(mood => positiveMoods.includes(mood.mood_type)).length;
  const positiveRatio = Math.round((positiveCount / moodHistory.length) * 100);

  return {
    totalEntries: moodHistory.length,
    mostCommonMood,
    moodStreak,
    weeklyAverage,
    positiveRatio
  };
}