import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

function escapeHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Genera HTML para el reporte de un paciente.
 */
function buildPatientReportHtml(patient, records, images) {
  const age = patient.birthDate ? calculateAge(patient.birthDate) : null;

  const recordsHtml = records.map((r) => {
    const recordImages = images.get(r.id) || [];
    const imagesHtml = recordImages.length > 0
      ? `<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
           ${recordImages.map((img) => `<img src="${img.uri}" style="width:100px;height:100px;object-fit:cover;border-radius:6px;" />`).join('')}
         </div>`
      : '';

    return `
      <div style="border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <strong style="color:#0f172a;">${escapeHtml(r.category || 'Sin categoria')}</strong>
          <span style="color:#64748b;font-size:13px;">${escapeHtml(r.date)}</span>
        </div>
        <p style="color:#334155;margin:0;font-size:14px;line-height:1.5;">${escapeHtml(r.description)}</p>
        ${imagesHtml}
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 24px; color: #0f172a; max-width: 800px; margin: 0 auto; }
        h1 { font-size: 24px; color: #0284c7; margin-bottom: 4px; }
        h2 { font-size: 18px; color: #0f172a; margin-top: 24px; border-bottom: 2px solid #0284c7; padding-bottom: 4px; }
        .meta { color: #64748b; font-size: 14px; }
        .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; margin-right: 6px; }
        .badge-blood { background: #fee2e2; color: #dc2626; }
        .badge-allergy { background: #fef3c7; color: #d97706; }
        .notes { background: #f8fafc; padding: 10px; border-radius: 8px; color: #475569; font-size: 14px; margin-top: 8px; }
        .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <h1>Reporte del Paciente</h1>

      <table style="margin-top:12px;font-size:14px;">
        <tr><td style="color:#64748b;padding-right:16px;">Nombre:</td><td><strong>${escapeHtml(patient.name)}</strong></td></tr>
        <tr><td style="color:#64748b;padding-right:16px;">ID interno:</td><td>${escapeHtml(patient.internalId)}</td></tr>
        ${patient.birthDate ? `<tr><td style="color:#64748b;">Nacimiento:</td><td>${escapeHtml(patient.birthDate)}${age !== null ? ` (${age} años)` : ''}</td></tr>` : ''}
        ${patient.gender ? `<tr><td style="color:#64748b;">Genero:</td><td>${escapeHtml(patient.gender)}</td></tr>` : ''}
        ${patient.phone ? `<tr><td style="color:#64748b;">Telefono:</td><td>${escapeHtml(patient.phone)}</td></tr>` : ''}
      </table>

      <div style="margin-top:12px;">
        ${patient.bloodType ? `<span class="badge badge-blood">🩸 ${escapeHtml(patient.bloodType)}</span>` : ''}
        ${patient.allergies ? `<span class="badge badge-allergy">⚠ ${escapeHtml(patient.allergies)}</span>` : ''}
      </div>

      ${patient.notes ? `<div class="notes">${escapeHtml(patient.notes)}</div>` : ''}

      <h2>Registros Medicos (${records.length})</h2>

      ${records.length === 0 ? '<p style="color:#94a3b8;">Sin registros.</p>' : recordsHtml}

      <div class="footer">
        Generado por MedDoc — ${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </body>
    </html>
  `;
}

function calculateAge(birthDate) {
  const [y, m, d] = birthDate.split('-').map(Number);
  const today = new Date();
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age--;
  return age >= 0 ? age : null;
}

/**
 * Genera un PDF del reporte y lo muestra en el visor de impresion.
 */
export async function printPatientReport(patient, records, imagesMap) {
  const html = buildPatientReportHtml(patient, records, imagesMap);
  await Print.printAsync({ html });
}

/**
 * Genera un PDF y lo comparte (email, mensajeria, etc.).
 */
export async function sharePatientReport(patient, records, imagesMap) {
  const html = buildPatientReportHtml(patient, records, imagesMap);
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `Reporte - ${patient.name}`,
    UTI: 'com.adobe.pdf',
  });
}
