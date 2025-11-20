import { jsPDF } from 'jspdf';

export interface SessionMetrics {
  accuracy?: number; // 0-100
  score?: number;
  correctCount?: number;
  totalCount?: number;
  leftEarAccuracy?: number;
  rightEarAccuracy?: number;
  averageReactionTime?: number;
}

export interface SessionLog {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // seconds
  mode: string;
  settings: {
    imbalance: number;
    noiseType: string;
    noiseVolume: number;
    leftVolume: number;
    rightVolume: number;
  };
  metrics?: SessionMetrics;
}

export function generatePDF(sessions: SessionLog[]) {
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text("Dichotic Training Session Report", 20, 20);
  
  let y = 40;
  sessions.forEach((session) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`${session.date} - ${session.startTime} to ${session.endTime}`, 20, y);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Duration: ${Math.round(session.duration)}s | Mode: ${session.mode}`, 20, y + 5);
    
    const settings = `Settings: Imbalance: ${session.settings.imbalance}, Noise: ${session.settings.noiseType} (Vol: ${session.settings.noiseVolume})`;
    doc.text(settings, 20, y + 10);

    if (session.metrics) {
        let metricsText = "";
        if (session.metrics.accuracy !== undefined) metricsText += `Accuracy: ${Math.round(session.metrics.accuracy)}% `;
        if (session.metrics.leftEarAccuracy !== undefined) metricsText += `| L: ${Math.round(session.metrics.leftEarAccuracy)}% `;
        if (session.metrics.rightEarAccuracy !== undefined) metricsText += `| R: ${Math.round(session.metrics.rightEarAccuracy)}% `;
        
        doc.setTextColor(0, 100, 0);
        doc.text(metricsText, 20, y + 15);
        y += 5;
    }
    
    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y + 15, 190, y + 15);
    
    y += 25;
  });
  
  doc.save("dichotic-report.pdf");
}

export function generateCSV(sessions: SessionLog[]) {
  const headers = ["Date", "Start Time", "End Time", "Duration (s)", "Mode", "Imbalance", "Noise Type", "Noise Volume", "Accuracy", "Left Ear Acc", "Right Ear Acc"];
  const rows = sessions.map(s => [
    s.date, 
    s.startTime, 
    s.endTime, 
    s.duration, 
    s.mode, 
    s.settings.imbalance, 
    s.settings.noiseType, 
    s.settings.noiseVolume,
    s.metrics?.accuracy ?? "",
    s.metrics?.leftEarAccuracy ?? "",
    s.metrics?.rightEarAccuracy ?? ""
  ]);
  
  const csvContent = "data:text/csv;charset=utf-8," 
    + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "dichotic_sessions.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

