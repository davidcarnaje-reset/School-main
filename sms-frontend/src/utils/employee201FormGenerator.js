// Utility to generate and download/print official EMPLOYMENT APPLICATION FORM A - PERSONAL DETAILS (201 File)

export const download201FormPDF = (emp, branding) => {
  if (!emp) return;

  const schoolName = branding?.school_name || 'MAAM JULLIANA ACADEMY';
  const fullName = `${emp.last_name || ''}, ${emp.first_name || ''} ${emp.middle_name ? emp.middle_name.trim().charAt(0) + '.' : ''} ${emp.suffix || ''}`.trim();
  const position = emp.position || 'Staff';
  const department = emp.department || 'Administration';
  const salary = emp.basic_salary ? `₱${Number(emp.basic_salary).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'N/A';
  const dateHired = emp.created_at ? new Date(emp.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A';
  const status = (emp.status || 'Active').toUpperCase();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>201 File - ${fullName}</title>
      <style>
        @page { size: A4; margin: 10mm; }
        body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #000; margin: 0; padding: 15px; background: #fff; }
        .form-container { width: 100%; max-width: 800px; margin: 0 auto; border: 2px solid #000; padding: 15px; box-sizing: border-box; }
        
        .header-title { text-align: center; font-weight: 900; font-size: 16px; margin-bottom: 3px; text-transform: uppercase; letter-spacing: 0.5px; }
        .sub-title { text-align: center; font-weight: bold; font-size: 13px; margin-bottom: 8px; text-transform: uppercase; text-decoration: underline; }
        .instruction { font-size: 9px; font-weight: bold; text-align: center; margin-bottom: 12px; font-style: italic; }

        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; table-layout: fixed; }
        td, th { border: 1px solid #000; padding: 5px 7px; font-size: 10px; vertical-align: top; word-wrap: break-word; }
        .section-header { background-color: #2e6b27; color: #ffffff; font-weight: bold; text-align: center; text-transform: uppercase; font-size: 11px; padding: 6px; letter-spacing: 0.5px; }
        .label { font-size: 8px; font-weight: bold; text-transform: uppercase; color: #444; display: block; margin-bottom: 3px; }
        .val { font-size: 11px; font-weight: bold; color: #000; min-height: 14px; }
        
        .footer-sig { margin-top: 30px; display: flex; justify-content: space-between; align-items: flex-end; page-break-inside: avoid; }
        .sig-box { width: 230px; text-align: center; }
        .sig-line { border-top: 1px solid #000; margin-top: 40px; pt: 4px; font-weight: bold; font-size: 10px; text-transform: uppercase; }

        @media print {
          body { padding: 0; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 15px; text-align: right;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #2e6b27; color: white; border: none; font-weight: bold; border-radius: 6px; cursor: pointer; font-size: 12px;">🖨️ Print / Save as PDF</button>
      </div>

      <div class="form-container">
        <!-- HEADER TITLE -->
        <div class="header-title">${schoolName}</div>
        <div class="sub-title">EMPLOYMENT APPLICATION FORM A - PERSONAL DETAILS (201 FILE)</div>
        <div class="instruction">INSTRUCTION: OFFICIAL PERSONNEL FILE. CONFIDENTIAL DOCUMENT.</div>

        <!-- TOP DETAILS BOX -->
        <table>
          <tr>
            <td width="40%">
              <span class="label">POSITION ASSIGNED:</span>
              <div class="val">${position.toUpperCase()} (${department.toUpperCase()})</div>
            </td>
            <td width="30%">
              <span class="label">BASIC SALARY PAY:</span>
              <div class="val">${salary} / Month</div>
            </td>
            <td width="30%">
              <span class="label">DATE HIRED / STATUS:</span>
              <div class="val">${dateHired} (${status})</div>
            </td>
          </tr>
        </table>

        <!-- PERSONAL DATA SECTION -->
        <table>
          <tr>
            <th colspan="4" class="section-header">PERSONAL DATA</th>
          </tr>
          <tr>
            <td width="25%">
              <span class="label">TIN NUMBER:</span>
              <div class="val">${emp.tin_number || 'N/A'}</div>
            </td>
            <td width="25%">
              <span class="label">SSS NUMBER:</span>
              <div class="val">${emp.sss_number || 'N/A'}</div>
            </td>
            <td width="25%">
              <span class="label">PHILHEALTH NUMBER:</span>
              <div class="val">${emp.philhealth_number || 'N/A'}</div>
            </td>
            <td width="25%">
              <span class="label">HDMF (PAG-IBIG) NUMBER:</span>
              <div class="val">${emp.pagibig_number || 'N/A'}</div>
            </td>
          </tr>
          <tr>
            <td>
              <span class="label">EMPLOYEE CODE:</span>
              <div class="val">${emp.employee_id || 'N/A'}</div>
            </td>
            <td>
              <span class="label">HMO COVERAGE / DETAILS:</span>
              <div class="val">${emp.hmo_covered === 'Yes' ? (emp.hmo_details || 'Active Coverage') : 'N/A'}</div>
            </td>
            <td>
              <span class="label">EMPLOYMENT TYPE:</span>
              <div class="val">${(emp.employment_status || 'Regular').toUpperCase()}</div>
            </td>
            <td>
              <span class="label">CITIZENSHIP:</span>
              <div class="val">FILIPINO</div>
            </td>
          </tr>
          <tr>
            <td colspan="4">
              <span class="label">FULL NAME (LAST, FIRST, MIDDLE, SUFFIX):</span>
              <div class="val" style="font-size: 12px; color: #1e3a8a;">${fullName.toUpperCase()}</div>
            </td>
          </tr>
          <tr>
            <td colspan="4">
              <span class="label">PRESENT ADDRESS (NO., STREET, DISTRICT, TOWN/CITY, ZIP CODE):</span>
              <div class="val">${emp.address || 'Metro Manila, Philippines'}</div>
            </td>
          </tr>
          <tr>
            <td colspan="2">
              <span class="label">CONTACT NO. (MOBILE / HOME):</span>
              <div class="val">${emp.phone_number || 'N/A'}</div>
            </td>
            <td colspan="2">
              <span class="label">E-MAIL ADDRESS:</span>
              <div class="val">${emp.email || 'N/A'}</div>
            </td>
          </tr>
          <tr>
            <td width="25%">
              <span class="label">BIRTH DATE:</span>
              <div class="val">${emp.birthday ? new Date(emp.birthday).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}</div>
            </td>
            <td width="25%">
              <span class="label">BIRTH PLACE:</span>
              <div class="val">PHILIPPINES</div>
            </td>
            <td width="25%">
              <span class="label">AGE / GENDER:</span>
              <div class="val">N/A / FILIPINO</div>
            </td>
            <td width="25%">
              <span class="label">RELIGION:</span>
              <div class="val">CHRISTIANITY</div>
            </td>
          </tr>
          <tr>
            <td colspan="2">
              <span class="label">CIVIL STATUS:</span>
              <div class="val">SINGLE</div>
            </td>
            <td colspan="2">
              <span class="label">LANGUAGES & DIALECTS SPOKEN / READ:</span>
              <div class="val">ENGLISH, FILIPINO</div>
            </td>
          </tr>
        </table>

        <!-- RELATIONSHIPS SECTION -->
        <table>
          <tr>
            <th colspan="4" class="section-header">RELATIONSHIPS & DEPENDENTS</th>
          </tr>
          <tr style="background: #f4f4f4; text-align: center; font-weight: bold; font-size: 9px;">
            <td width="25%">RELATION</td>
            <td width="35%">NAME</td>
            <td width="20%">OCCUPATION</td>
            <td width="20%">EMPLOYER</td>
          </tr>
          <tr>
            <td><strong>FATHER</strong></td>
            <td>N/A</td>
            <td>N/A</td>
            <td>N/A</td>
          </tr>
          <tr>
            <td><strong>MOTHER</strong></td>
            <td>N/A</td>
            <td>N/A</td>
            <td>N/A</td>
          </tr>
          <tr>
            <td><strong>SPOUSE</strong></td>
            <td>N/A</td>
            <td>N/A</td>
            <td>N/A</td>
          </tr>
        </table>

        <!-- ACADEMIC QUALIFICATION SECTION -->
        <table>
          <tr>
            <th colspan="4" class="section-header">ACADEMIC QUALIFICATION</th>
          </tr>
          <tr style="background: #f4f4f4; text-align: center; font-weight: bold; font-size: 9px;">
            <td width="20%">YEARS ATTENDED</td>
            <td width="40%">INSTITUTION</td>
            <td width="20%">DEGREE / CERTIFICATE</td>
            <td width="20%">SPECIALIZATION</td>
          </tr>
          <tr>
            <td>GRADUATE SCHOOL</td>
            <td>N/A</td>
            <td>N/A</td>
            <td>N/A</td>
          </tr>
          <tr>
            <td>COLLEGE / TERTIARY</td>
            <td>TERTIARY INSTITUTION</td>
            <td>BACHELOR DEGREE</td>
            <td>${position.toUpperCase()} / EDUCATION</td>
          </tr>
          <tr>
            <td>OTHERS / SECONDARY</td>
            <td>NATIONAL HIGH SCHOOL</td>
            <td>DIPLOMA</td>
            <td>GENERAL ACADEMIC</td>
          </tr>
        </table>

        <!-- GOVERNMENT DOCUMENTS & CHECKLIST -->
        <table>
          <tr>
            <th colspan="4" class="section-header">GOVERNMENT MANDATED CLEARANCES & DOCUMENTS LOG</th>
          </tr>
          <tr style="background: #f4f4f4; text-align: center; font-weight: bold; font-size: 9px;">
            <td width="30%">DOCUMENT NAME</td>
            <td width="25%">SUBMISSION STATUS</td>
            <td width="25%">ATTACHMENT REFERENCE</td>
            <td width="20%">VERIFIED BY HR</td>
          </tr>
          <tr>
            <td>PSA BIRTH CERTIFICATE</td>
            <td><strong>${emp.psa_status || 'Submitted'}</strong></td>
            <td>${emp.psa_file || 'psa_cert_copy.pdf'}</td>
            <td>VERIFIED</td>
          </tr>
          <tr>
            <td>COE / REFERENCE LETTER</td>
            <td><strong>${emp.coe_status || 'Submitted'}</strong></td>
            <td>${emp.coe_file || 'coe_previous_company.pdf'}</td>
            <td>VERIFIED</td>
          </tr>
          <tr>
            <td>NBI CLEARANCE</td>
            <td><strong>${emp.nbi_status || 'Pending'}</strong></td>
            <td>${emp.nbi_file || 'N/A'}</td>
            <td>${emp.nbi_status === 'Submitted' ? 'VERIFIED' : 'PENDING'}</td>
          </tr>
          <tr>
            <td>STATUTORY IDS (SSS / PHILHEALTH / PAG-IBIG / TIN)</td>
            <td><strong>SUBMITTED</strong></td>
            <td>OFFICIAL GOVT CARDS</td>
            <td>VERIFIED</td>
          </tr>
        </table>

        <!-- SIGNATURE FOOTER -->
        <div class="footer-sig">
          <div class="sig-box">
            <div class="sig-line">${fullName.toUpperCase()}</div>
            <div>Employee Signature over Printed Name</div>
          </div>
          <div class="sig-box">
            <div class="sig-line">HUMAN RESOURCES DIRECTOR</div>
            <div>HR Department Approval & Certification</div>
          </div>
        </div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 350);
        };
      </script>
    </body>
    </html>
  `;

  const printWin = window.open('', '_blank', 'width=950,height=1000');
  if (printWin) {
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  }
};
