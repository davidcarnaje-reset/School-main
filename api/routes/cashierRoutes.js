import express from 'express';

// Existing controllers
import getDashboardStats from '../controllers/cashier/getDashboardStats.js';
import getBillingDetails from '../controllers/cashier/getBillingDetails.js';
import processBillingPayment from '../controllers/cashier/processBillingPayment.js';

// Newly migrated controllers
import { 
  fetchScholarships, 
  manageScholarships, 
  getStudentScholarships, 
  getAllApprovedScholarships, 
  applyScholarshipToBilling 
} from '../controllers/cashier/scholarshipsController.js';

import { 
  getPayments, 
  getCollectionReports, 
  getServiceRequests, 
  processServicePayment 
} from '../controllers/cashier/paymentsController.js';

import { manageFees } from '../controllers/cashier/feesController.js';

import { 
  getEmployees, 
  addEmployee, 
  updateEmployee, 
  getPeriods, 
  addPeriod, 
  processPayrollInit, 
  savePayroll, 
  getCompletedPeriods, 
  getCompletedPayroll 
} from '../controllers/cashier/payrollController.js';

const router = express.Router();

// Clean RESTful endpoints
router.get('/dashboard-stats', getDashboardStats);
router.get('/billing-details', getBillingDetails);
router.post('/billing-payment', processBillingPayment);

router.get('/scholarships', fetchScholarships);
router.all('/scholarships/manage', manageScholarships);
router.get('/scholarships/student', getStudentScholarships);
router.get('/scholarships/approved', getAllApprovedScholarships);
router.post('/scholarships/apply', applyScholarshipToBilling);

router.get('/payments', getPayments);
router.get('/payments/collection-reports', getCollectionReports);
router.get('/payments/service-requests', getServiceRequests);
router.post('/payments/service-payment', processServicePayment);

router.all('/fees', manageFees);

router.get('/payroll/employees', getEmployees);
router.post('/payroll/employees', addEmployee);
router.put('/payroll/employees', updateEmployee);
router.get('/payroll/periods', getPeriods);
router.post('/payroll/periods', addPeriod);
router.get('/payroll/init', processPayrollInit);
router.post('/payroll/save', savePayroll);
router.get('/payroll/periods-completed', getCompletedPeriods);
router.get('/payroll/completed', getCompletedPayroll);


// Legacy compatibility endpoints
router.get('/get_dashboard_stats', getDashboardStats);
router.get('/get_dashboard_stats.php', getDashboardStats);
router.get('/get_billing_details', getBillingDetails);
router.get('/get_billing_details.php', getBillingDetails);
router.post('/process_billing_payment', processBillingPayment);
router.post('/process_billing_payment.php', processBillingPayment);

router.get('/fetch_scholarships', fetchScholarships);
router.get('/fetch_scholarships.php', fetchScholarships);
router.all('/manage_scholarships.php', manageScholarships);
router.get('/get_student_scholarships.php', getStudentScholarships);
router.get('/get_all_approved_scholarships.php', getAllApprovedScholarships);
router.post('/apply_scholarship_to_billing.php', applyScholarshipToBilling);

router.get('/get_payments.php', getPayments);
router.get('/get_collection_reports.php', getCollectionReports);
router.get('/get_service_requests.php', getServiceRequests);
router.post('/process_service_payment.php', processServicePayment);

router.all('/manage_fees.php', manageFees);

router.get('/get_employees.php', getEmployees);
router.post('/add_employee.php', addEmployee);
router.post('/update_employee.php', updateEmployee);
router.get('/get_periods.php', getPeriods);
router.post('/add_period.php', addPeriod);
router.get('/process_payroll_init.php', processPayrollInit);
router.post('/save_payroll.php', savePayroll);
router.get('/get_completed_periods.php', getCompletedPeriods);
router.get('/get_completed_payroll.php', getCompletedPayroll);

export default router;
