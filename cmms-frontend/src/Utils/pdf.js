import jsPDF from "jspdf";

const AMBER = [232, 163, 61];
const STEEL = [107, 116, 128];
const DARK = [20, 23, 27];

export function crearDocumento(titulo, subtitulo, orientacion = "portrait") {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: orientacion });
  const anchoPagina = doc.internal.pageSize.getWidth();

  doc.setFillColor(...DARK);
  doc.rect(0, 0, anchoPagina, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("CMMS — Sistema de Gestión de Mantenimiento Preventivo", 14, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...AMBER);
  doc.text(titulo, 14, 20);

  if (subtitulo) {
    doc.setFontSize(9);
    doc.setTextColor(220, 220, 220);
    doc.text(subtitulo, 14, 25);
  }

  doc.setTextColor(0, 0, 0);
  return doc;
}

export function agregarPiePagina(doc) {
  const paginas = doc.internal.getNumberOfPages();
  const ancho = doc.internal.pageSize.getWidth();
  const alto = doc.internal.pageSize.getHeight();
  const fecha = new Date().toLocaleString();

  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...STEEL);
    doc.text(`Generado el ${fecha}`, 14, alto - 8);
    doc.text(`Página ${i} de ${paginas}`, ancho - 14, alto - 8, { align: "right" });
  }
}