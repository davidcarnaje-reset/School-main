/**
 * Generates an official 1-page Certificate of Registration (COR) in a new tab window,
 * matching official Philippine university registration standards with zero browser headers/footers.
 */
export const printCertificateOfRegistration = (student, schoolInfo = {}) => {
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert("Please allow popups to print the Certificate of Registration.");
    return;
  }

  const schoolName = schoolInfo?.school_name || 'SMS CLOUD STATE UNIVERSITY';
  const schoolAddress = schoolInfo?.address || 'Main Campus, Academic District, Philippines';
  const schoolLogo = schoolInfo?.school_logo || schoolInfo?.logo || '';

  const studentNo = student?.student_id || student?.id || 'N/A';
  const firstName = student?.first_name || '';
  const middleName = student?.middle_name || '';
  const lastName = student?.last_name || '';
  const fullName = `${lastName}, ${firstName} ${middleName}`.replace(/\s+/g, ' ').trim().toUpperCase() || 'STUDENT NAME';

  const gender = student?.gender || 'N/A';
  const age = student?.age || student?.dob ? calculateAge(student.dob) : 'N/A';
  const yearLevel = student?.grade_level || '1st Year';
  const department = student?.department || (student?.grade_level?.includes('Grade') ? 'BASIC ED / SHS' : 'COLLEGE');
  const program = student?.program_description || student?.program || 'Bachelor of Science';
  const major = student?.major || 'General';
  const curriculumYear = student?.curriculum_year || '2024-2025';
  const regNo = student?.enrollment_id || `COR-${studentNo}`;
  const term = student?.school_year ? `AY ${student.school_year}` : '2nd Semester AY 2024-2025';
  const scholarship = student?.scholarship || 'None / Regular';

  // Helper for age
  function calculateAge(birthday) {
    const ageDifMs = Date.now() - new Date(birthday).getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  // Extract actual subjects if available (no mock fallback for unassessed students)
  const subjectList = Array.isArray(student?.subjects) ? student.subjects : [];

  const totalSubjects = subjectList.length;
  const totalLec = subjectList.reduce((acc, s) => acc + (parseInt(s.lec || 0, 10)), 0);
  const totalLab = subjectList.reduce((acc, s) => acc + (parseInt(s.lab || 0, 10)), 0);
  const totalUnits = subjectList.reduce((acc, s) => acc + (parseInt(s.credit || s.units || 0, 10)), 0);

  // Extract actual fee breakdown if available
  const feeList = Array.isArray(student?.fee_breakdown) 
    ? student.fee_breakdown 
    : (Array.isArray(student?.billing_items) ? student.billing_items : []);

  const totalAssessed = parseFloat(student?.totalAssessment || student?.total_assessment || (feeList.length > 0 ? feeList.reduce((acc, f) => acc + parseFloat(f.amount || 0), 0) : 0));
  const totalDiscount = parseFloat(student?.discount || 0);
  const totalPaid = parseFloat(student?.paid_amount || student?.totalPaid || 0);
  const balance = Math.max(0, totalAssessed - totalDiscount - totalPaid);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Certificate of Registration - ${studentNo}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 0mm;
          }
          .preview-toolbar {
            position: sticky;
            top: 0;
            left: 0;
            right: 0;
            background: #0f172a;
            color: #ffffff;
            padding: 10px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 4px 14px rgba(0,0,0,0.2);
            z-index: 9999;
          }
          @media print {
            .preview-toolbar {
              display: none !important;
            }
          }
          .btn-print-now {
            background: #2563eb;
            color: #ffffff;
            border: none;
            padding: 8px 18px;
            border-radius: 8px;
            font-weight: 800;
            font-size: 13px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            box-shadow: 0 2px 8px rgba(37,99,235,0.4);
            transition: background 0.2s;
          }
          .btn-print-now:hover {
            background: #1d4ed8;
          }
          .btn-close-preview {
            background: #334155;
            color: #cbd5e1;
            border: none;
            padding: 8px 14px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
          }
          .btn-close-preview:hover {
            background: #475569;
            color: #ffffff;
          }
          *, *:before, *:after {
            box-sizing: border-box;
          }
          html, body {
            margin: 0;
            padding: 0;
            background: #f1f5f9;
            font-family: 'Segoe UI', Arial, sans-serif;
            color: #000000;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .page {
            width: 210mm;
            min-height: 297mm;
            max-height: 297mm;
            padding: 10mm 12mm;
            margin: 15px auto;
            background: #ffffff;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            box-sizing: border-box;
            font-size: 10px;
            page-break-after: avoid;
            page-break-before: avoid;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          @media print {
            html, body {
              background: #ffffff;
            }
            .page {
              margin: 0 auto;
              box-shadow: none;
            }
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 2px;
          }
          .header-title {
            text-align: center;
          }
          .header-title h4 {
            margin: 0;
            font-size: 9px;
            font-weight: normal;
            text-transform: uppercase;
          }
          .header-title h2 {
            margin: 2px 0;
            font-size: 15px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .header-title p {
            margin: 0;
            font-size: 8px;
            color: #333;
          }
          .cor-title {
            text-align: center;
            font-size: 16px;
            font-weight: 900;
            letter-spacing: 4px;
            margin: 6px 0;
            text-transform: uppercase;
            border-bottom: 2px solid #000;
            padding-bottom: 2px;
          }
          .sub-header {
            display: flex;
            justify-content: space-between;
            font-size: 9.5px;
            font-weight: bold;
            margin-bottom: 4px;
          }
          .section-banner {
            background-color: #fef08a;
            border: 1px solid #000;
            text-align: center;
            font-weight: 900;
            font-size: 9.5px;
            letter-spacing: 1.5px;
            padding: 3px 0;
            text-transform: uppercase;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
            border: 1px solid #000;
            border-top: none;
          }
          .info-table td {
            padding: 3px 8px;
            font-size: 9px;
            border-bottom: 1px solid #e2e8f0;
          }
          .info-label {
            font-weight: bold;
            color: #333;
            width: 12%;
            text-align: right;
            padding-right: 6px;
          }
          .info-val {
            font-weight: 900;
            width: 38%;
            text-transform: uppercase;
          }
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
          }
          .data-table th, .data-table td {
            border: 1px solid #000;
            padding: 4px 6px;
            font-size: 8.5px;
          }
          .data-table th {
            background-color: #fef08a;
            font-weight: 900;
            text-transform: uppercase;
            text-align: left;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          
          .flex-row {
            display: flex;
            gap: 12px;
          }
          .col-left {
            flex: 1.3;
          }
          .col-right {
            flex: 0.9;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .fees-container {
            border: 1px solid #000;
            border-top: none;
            padding: 4px 6px;
          }
          .fee-row {
            display: flex;
            justify-content: space-between;
            font-size: 8.5px;
            padding: 1.5px 0;
          }
          .fee-summary {
            border-top: 1px solid #000;
            margin-top: 4px;
            padding-top: 4px;
          }
          .fee-summary-row {
            display: flex;
            justify-content: space-between;
            font-weight: 900;
            font-size: 9px;
            padding: 2px 0;
          }
          .signature-box {
            text-align: center;
            margin-top: 25px;
          }
          .sig-line {
            border-top: 1px solid #000;
            font-size: 9px;
            font-weight: 900;
            padding-top: 3px;
            text-transform: uppercase;
          }
          .bottom-bar {
            border: 1px solid #000;
            padding: 4px 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 8.5px;
            font-weight: bold;
            margin-top: 6px;
          }
          .warning-banner {
            background-color: #fef08a;
            border: 1px solid #000;
            text-align: center;
            font-weight: 900;
            font-size: 8px;
            padding: 3px 0;
            margin-top: 4px;
            letter-spacing: 0.5px;
          }
        </style>
      </head>
      <body>
        <div class="preview-toolbar">
          <div style="font-weight: 900; font-size: 13px; text-transform: uppercase; display: flex; align-items: center; gap: 8px;">
            📄 Certificate of Registration Preview
          </div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <button onclick="window.print()" class="btn-print-now">
              🖨️ Print / Save as PDF
            </button>
            <button onclick="window.close()" class="btn-close-preview">
              ✕ Close Tab
            </button>
          </div>
        </div>

        <div class="page">
          <div>
            <!-- SCHOOL HEADER -->
            <table class="header-table">
              <tr>
                <td style="width: 15%; text-align: center;">
                  ${schoolLogo ? `<img src="${schoolLogo}" style="max-height: 52px; object-fit: contain;" />` : `<div style="width: 46px; height: 46px; border-radius: 50%; border: 2px solid #000; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 11px; margin: auto;">SEAL</div>`}
                </td>
                <td class="header-title">
                  <h4>Republic of the Philippines</h4>
                  <h2>${schoolName}</h2>
                  <p>${schoolAddress}</p>
                </td>
                <td style="width: 15%;"></td>
              </tr>
            </table>

            <div class="cor-title">CERTIFICATE OF REGISTRATION</div>

            <div class="sub-header">
              <span>Registration No: <strong>${regNo}</strong></span>
              <span>Academic Year/Term: <strong>${term}</strong></span>
            </div>

            <!-- STUDENT INFORMATION BANNER & GRID -->
            <div class="section-banner">STUDENT GENERAL INFORMATION</div>
            <table class="info-table">
              <tr>
                <td class="info-label">Student No:</td>
                <td class="info-val">${studentNo}</td>
                <td class="info-label">College:</td>
                <td class="info-val">${department}</td>
              </tr>
              <tr>
                <td class="info-label">Name:</td>
                <td class="info-val">${fullName}</td>
                <td class="info-label">Program:</td>
                <td class="info-val">${program}</td>
              </tr>
              <tr>
                <td class="info-label">Gender:</td>
                <td class="info-val">${gender}</td>
                <td class="info-label">Major:</td>
                <td class="info-val">${major}</td>
              </tr>
              <tr>
                <td class="info-label">Age:</td>
                <td class="info-val">${age}</td>
                <td class="info-label">Curriculum:</td>
                <td class="info-val">${curriculumYear}</td>
              </tr>
              <tr>
                <td class="info-label">Year Level:</td>
                <td class="info-val">${yearLevel}</td>
                <td class="info-label">Scholarship:</td>
                <td class="info-val">${scholarship}</td>
              </tr>
            </table>

            <!-- SUBJECT SCHEDULE TABLE -->
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 11%;">CODE</th>
                  <th style="width: 32%;">SUBJECT TITLE</th>
                  <th class="text-center" style="width: 4%;">Lec</th>
                  <th class="text-center" style="width: 4%;">Lab</th>
                  <th class="text-center" style="width: 6%;">Credit</th>
                  <th style="width: 10%;">SECTION</th>
                  <th style="width: 19%;">SCHEDULE / ROOM</th>
                  <th style="width: 14%;">FACULTY</th>
                </tr>
              </thead>
              <tbody>
                ${subjectList.length > 0 ? subjectList.map(s => `
                  <tr>
                    <td style="font-weight: bold;">${s.code || s.subject_code || ''}</td>
                    <td>${s.title || s.subject_title || s.subject_name || ''}</td>
                    <td class="text-center">${s.lec || 0}</td>
                    <td class="text-center">${s.lab || 0}</td>
                    <td class="text-center" style="font-weight: bold;">${s.credit || s.units || 0}</td>
                    <td>${s.section || 'SEC-A'}</td>
                    <td>${s.schedule || 'TBA'}</td>
                    <td>${s.faculty || 'TBA'}</td>
                  </tr>
                `).join('') : `
                  <tr>
                    <td colSpan="8" style="padding: 15px; text-align: center; color: #64748b; font-style: italic; font-weight: bold; background-color: #fafafa;">
                      NO ENROLLED SUBJECTS / PENDING SUBJECT ASSIGNMENT
                    </td>
                  </tr>
                `}
                <tr style="background-color: #fef9c3; font-weight: bold;">
                  <td colSpan="2">Total Subject/s: <strong>${totalSubjects}</strong></td>
                  <td colSpan="3" class="text-center">Total Unit(s): <strong>${totalLec} &nbsp; ${totalLab} &nbsp; ${totalUnits}</strong></td>
                  <td colSpan="3"></td>
                </tr>
              </tbody>
            </table>

            <!-- FEES & SCHEDULE OF PAYMENTS GRID -->
            <div class="flex-row">
              <!-- LEFT COLUMN: ASSESSED FEES -->
              <div class="col-left">
                <div class="section-banner">ASSESSED FEES</div>
                <div class="fees-container">
                  ${feeList.length > 0 ? feeList.map(f => `
                    <div class="fee-row">
                      <span>${f.name || f.item_name || f.description || 'Fee Item'}</span>
                      <span>₱${parseFloat(f.amount || f.fee_amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                  `).join('') : (totalAssessed > 0 ? `
                    <div class="fee-row">
                      <span>Tuition & General Assessment</span>
                      <span>₱${totalAssessed.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                  ` : `
                    <div class="fee-row" style="color: #64748b; font-style: italic; padding: 6px 0; text-align: center; justify-content: center;">
                      UNASSESSED / PENDING CASHIER ASSESSMENT
                    </div>
                  `)}
                  <div class="fee-summary">
                    <div class="fee-summary-row">
                      <span>TOTAL ASSESSED</span>
                      <span>₱${totalAssessed.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                    <div class="fee-summary-row" style="color: #047857;">
                      <span>DISCOUNT</span>
                      <span>₱${totalDiscount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                    <div class="fee-summary-row" style="color: #1d4ed8;">
                      <span>TOTAL PAYMENT</span>
                      <span>₱${totalPaid.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                    <div class="fee-summary-row" style="background-color: #fef08a; padding: 2px 4px; border: 1px solid #000; margin-top: 2px;">
                      <span>OUTSTANDING BALANCE</span>
                      <span>₱${balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                  </div>
                </div>

                <!-- PAYMENT SCHEDULE -->
                <div class="section-banner" style="margin-top: 4px;">SCHEDULE OF PAYMENTS</div>
                <table class="data-table" style="margin-top: 0;">
                  <thead>
                    <tr>
                      <th class="text-center">Upon Enrollment</th>
                      <th class="text-center">Midterm</th>
                      <th class="text-center">Prefinal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="text-center" style="font-weight: bold;">₱${(totalAssessed / 3).toLocaleString(undefined, {maximumFractionDigits: 2, minimumFractionDigits: 2})}</td>
                      <td class="text-center" style="font-weight: bold;">₱${(totalAssessed / 3).toLocaleString(undefined, {maximumFractionDigits: 2, minimumFractionDigits: 2})}</td>
                      <td class="text-center" style="font-weight: bold;">₱${(totalAssessed / 3).toLocaleString(undefined, {maximumFractionDigits: 2, minimumFractionDigits: 2})}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- RIGHT COLUMN: SIGNATURES & APPROVALS -->
              <div class="col-right">
                <div class="signature-box" style="margin-top: 45px;">
                  <div class="sig-line">${fullName}</div>
                  <div style="font-size: 8px; font-weight: bold; text-transform: uppercase; margin-top: 2px;">STUDENT / GUARDIAN SIGNATURE</div>
                </div>

                <div class="signature-box" style="margin-top: 30px;">
                  <div style="font-size: 8.5px; font-weight: bold; text-align: left; margin-bottom: 25px;">APPROVED BY:</div>
                  <div class="sig-line">OFFICE OF THE UNIVERSITY REGISTRAR</div>
                  <div style="font-size: 8px; color: #444; font-weight: bold; margin-top: 2px;">University Registrar / Authorized Signatory</div>
                </div>
              </div>
            </div>
          </div>

          <!-- BOTTOM FOOTER CARD -->
          <div>
            <div class="bottom-bar">
              <div>
                <span>OR No.: _____________________</span> &nbsp;&nbsp;&nbsp;&nbsp;
                <span>Amount: _____________________</span>
              </div>
              <div>
                <span>Validation Date: ${new Date().toLocaleDateString()}</span> &nbsp;&nbsp;&nbsp;&nbsp;
                <span>Date Printed: ${new Date().toLocaleDateString()}</span>
              </div>
            </div>

            <div class="warning-banner">
              KEEP THIS CERTIFICATE. YOU WILL BE REQUIRED TO PRESENT THIS IN ALL YOUR DEALINGS WITH THE COLLEGE.
            </div>
          </div>
        </div>

      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  try {
    printWindow.opener = null;
  } catch (e) {
    // Ignore
  }
};
