import { sendStaffInvitationEmail } from '../api/utils/emailEngine.js';

console.log('Testing sendStaffInvitationEmail...');

// Simulate a request context
const mockReq = {
  headers: {
    origin: 'http://localhost:5173'
  }
};

sendStaffInvitationEmail(
  'primaschool1@gmail.com',
  'Test Staff User',
  'admin',
  'mock_token_123',
  'test_admin_user',
  mockReq
).then((result) => {
  console.log('Test send success!', result);
  process.exit(0);
}).catch((error) => {
  console.error('Test send failed!', error);
  process.exit(1);
});
