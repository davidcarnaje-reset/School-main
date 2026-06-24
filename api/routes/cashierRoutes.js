import express from 'express';
import getDashboardStats from '../controllers/cashier/getDashboardStats.js';
import getBillingDetails from '../controllers/cashier/getBillingDetails.js';
import processBillingPayment from '../controllers/cashier/processBillingPayment.js';
import fetchScholarships from '../controllers/cashier/fetchScholarships.js';

const router = express.Router();

// Clean RESTful endpoints
router.get('/dashboard-stats', getDashboardStats);
router.get('/billing-details', getBillingDetails);
router.post('/billing-payment', processBillingPayment);
router.get('/scholarships', fetchScholarships);

// Legacy compatibility endpoints
router.get('/get_dashboard_stats', getDashboardStats);
router.get('/get_dashboard_stats.php', getDashboardStats);
router.get('/get_billing_details', getBillingDetails);
router.get('/get_billing_details.php', getBillingDetails);
router.post('/process_billing_payment', processBillingPayment);
router.post('/process_billing_payment.php', processBillingPayment);
router.get('/fetch_scholarships', fetchScholarships);
router.get('/fetch_scholarships.php', fetchScholarships);

export default router;
