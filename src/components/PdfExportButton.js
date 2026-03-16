// src/components/PdfExportButton.js
import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

export default function PdfExportButton({
  canvasRef,
  title = 'Diseño',
  qualityName = '',
  summary = {},
  breakdown = { items: [], total: 0, instances: [] },
  brandName = 'Dekam',
  logoUrl = '/logo512.png',
  customerName = '',
  customerEmail = '',
  businessPhone = '',
  businessAddress = '',
}) {
  const [loading, setLoading] = useState(false);

  async function loadImageSafe(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  async function addHeader(doc, margin, pageW, {
    brandName, logoUrl, businessAddress, businessPhone,
    customerName, customerEmail, qualityName
  }) {
    let y = margin;

    try {
      const img = await loadImageSafe(logoUrl);
      if (img) {
        const logoW = 18;
        const logoH = (img.height / img.width) * logoW || 18;
        doc.addImage(img, 'PNG', margin, y, logoW, logoH);
      }
    } catch {}

    doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
    doc.text(brandName, margin + 22, y + 6);

    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    const leftLines = [businessAddress, businessPhone ? `Tel: ${businessPhone}` : ''].filter(Boolean);
    leftLines.forEach((line, i) => doc.text(line, margin + 22, y + 11 + i * 5));

    const rightX = pageW - margin;
    const rightLines = [
      customerName ? `Cliente: ${customerName}` : '',
      customerEmail ? `Email: ${customerEmail}` : '',
      qualityName ? `Calidad: ${qualityName}` : '',
    ].filter(Boolean);
    rightLines.forEach((line, i) => doc.text(line, rightX, y + 6 + i * 5, { align: 'right' }));

    return y + 22;
  }

  const onExport = async () => {
    if (!canvasRef?.current || loading) {
      if (!canvasRef?.current) {
        console.error('[PDF] canvasRef.current es null/undefined');
      }
      return;
    }

    setLoading(true);
    try {
      const wrapNode = canvasRef.current;

      // 👇 Intentá capturar SOLO la capa escalada (“zoomLayer”)
      // Estructura: .canvas-surface > div (ese <div> interno contiene el <svg> + los módulos)
      const target =
        wrapNode.querySelector('.canvas-surface > div') ||
        wrapNode; // fallback por si cambia el markup

      // preparar doc
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 12;

      let y = await addHeader(doc, margin, pageW, {
        brandName, logoUrl, businessAddress, businessPhone,
        customerName, customerEmail, qualityName
      });

      // Título
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
      doc.text(title, margin, y); y += 6;

      // -------- Captura de la capa de dibujo ----------
      // scale alto para más nitidez de grilla y módulos
      const canvas = await html2canvas(target, {
        backgroundColor: '#ffffff',
        scale: 3,
        useCORS: true,
        allowTaint: false,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const maxW = pageW - margin * 2;
      const imgW = maxW;
      const imgH = (canvas.height / canvas.width) * imgW;

      if (y + imgH > pageH - margin) { doc.addPage(); y = margin; }
      doc.addImage(imgData, 'PNG', margin, y, imgW, imgH);
      y += imgH + 6;

      // ---- Detalle por instancia (sin Δ%) ----
      const inst = Array.isArray(breakdown.instances) ? breakdown.instances : [];
      if (inst.length > 0) {
        if (y > pageH - 50) { doc.addPage(); y = margin; }
        doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
        doc.text('Detalle de módulos', margin, y); y += 4;

        const body = inst.map((r) => [
          r.title,
          r.width && r.height ? `${r.width}×${r.height} cm` : '—',
          typeof r.unit === 'number' ? `$ ${r.unit.toLocaleString()}` : '—',
        ]);

        autoTable(doc, {
          startY: y + 2,
          head: [['Módulo', 'Medida', 'Unit.']],
          body,
          styles: { fontSize: 10 },
          headStyles: { fillColor: [240, 240, 240] },
          margin: { left: margin, right: margin },
        });
        y = doc.lastAutoTable.finalY + 6;
      }

      // ---- Resumen por tipo ----
      if (Array.isArray(breakdown.items) && breakdown.items.length > 0) {
        if (y > pageH - 60) { doc.addPage(); y = margin; }
        doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
        doc.text('Resumen por módulo', margin, y); y += 4;

        const body2 = breakdown.items.map((it) => [
          it.title,
          it.count,
          typeof it.unit === 'number' ? `$ ${it.unit.toLocaleString()}` : '—',
          `$ ${Number(it.subtotal || 0).toLocaleString()}`,
        ]);

        autoTable(doc, {
          startY: y + 2,
          head: [['Módulo', 'Cant.', 'Unit.', 'Subtotal']],
          body: body2,
          styles: { fontSize: 10 },
          headStyles: { fillColor: [240, 240, 240] },
          margin: { left: margin, right: margin },
        });
        y = doc.lastAutoTable.finalY + 6;
      }

      // ---- Total ----
      if (y > pageH - 20) { doc.addPage(); y = margin; }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
      doc.text(`Total: $ ${Number(breakdown.total || 0).toLocaleString()}`, pageW - margin, y, { align: 'right' });

      const safeName = (customerName || 'cliente').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
      const file = `${safeName || 'diseno'}_${new Date().toISOString().slice(0,10)}.pdf`;
      doc.save(file);
    } catch (e) {
      console.error('[PDF] Error:', e);
      alert('No se pudo exportar el PDF.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button className="btn" onClick={onExport} disabled={loading}>
      {loading ? 'Generando…' : 'Exportar PDF 📝'}
    </button>
  );
}
