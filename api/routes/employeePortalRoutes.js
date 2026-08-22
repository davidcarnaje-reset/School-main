import express from 'express';
import {
  getPersonalInfo,
  getTimesheet,
  addTimeLog,
  createRequest,
  getMyRequests,
  getAllRequestsForApproval,
  updateRequestStatus,
  getMyExpenses,
  createExpense,
  getMyPurchases,
  createPurchase,
  getMyAccomplishments,
  createAccomplishment,
  getEmployeeNotifications,
  markEmployeeNotificationRead,
  hireEmployee
} from '../controllers/employee/employeePortalController.js';

const router = express.Router();

// Personal Details
router.get('/personal', getPersonalInfo);

// Attendance / Timesheet
router.get('/timesheet', getTimesheet);
router.post('/timelog', addTimeLog);

// Request Filing
router.get('/requests', getMyRequests);
router.post('/requests', createRequest);

// Approvals & Management (HR/Admin)
router.get('/approvals', getAllRequestsForApproval);
router.post('/approvals/status', updateRequestStatus);

// Expense Liquidation & Reimbursements
router.get('/expenses', getMyExpenses);
router.post('/expenses', createExpense);

// Purchase Requests
router.get('/purchases', getMyPurchases);
router.post('/purchases', createPurchase);

// WFH Accomplishment Logs
router.get('/accomplishments', getMyAccomplishments);
router.post('/accomplishments', createAccomplishment);

// Portal-specific Notifications
router.get('/notifications', getEmployeeNotifications);
router.post('/notifications/read', markEmployeeNotificationRead);

// Hire/Register Employee (EIS)
router.post('/hire', hireEmployee);

export default router;
