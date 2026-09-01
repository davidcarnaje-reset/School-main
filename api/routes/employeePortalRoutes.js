import express from 'express';
import {
  getPersonalInfo,
  getTimesheet,
  addTimeLog,
  logEmployeeClock,
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
  hireEmployee,
  getEmployeeShifts,
  assignEmployeeShift,
  getMyShift,
  getShiftTemplates,
  createShiftTemplate,
  deleteShiftTemplate,
  removeEmployeeShift,
  getAllDtrLogs
} from '../controllers/employee/employeePortalController.js';

const router = express.Router();

// Personal Details
router.get('/personal', getPersonalInfo);

// Attendance / Timesheet
router.get('/timesheet', getTimesheet);
router.post('/timelog', addTimeLog);
router.post('/log-clock', logEmployeeClock);

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

// Attendance logs list (HR view)
router.get('/dtr-logs', getAllDtrLogs);

// Portal-specific Notifications
router.get('/notifications', getEmployeeNotifications);
router.post('/notifications/read', markEmployeeNotificationRead);

// Hire/Register Employee (EIS)
router.post('/hire', hireEmployee);

// Employee Shifts Scheduling
router.get('/shifts', getEmployeeShifts);
router.post('/shifts', assignEmployeeShift);
router.post('/shifts/remove', removeEmployeeShift);
router.get('/my-shift', getMyShift);

// Shift Templates catalog CRUD
router.get('/shifts/templates', getShiftTemplates);
router.post('/shifts/templates', createShiftTemplate);
router.delete('/shifts/templates/:id', deleteShiftTemplate);

export default router;
