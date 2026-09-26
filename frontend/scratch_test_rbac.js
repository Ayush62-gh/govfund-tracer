import { ROLES, PERMISSIONS, hasPermission, checkProjectScope, checkAlertScope } from './src/services/rbacService.js';
import { api } from './src/services/api.js';
import { MOCK_USERS, MOCK_WORKS } from './src/data/mockData.js';

console.log('--- Starting RBAC & API Scope Verification Tests ---\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`[PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${message}`);
  }
}

async function runTests() {
  // Test 1: MP Role Permissions & Scope
  const mpVaranasi = MOCK_USERS.mp_varanasi;
  const mpSession = { isAuthenticated: true, currentUser: mpVaranasi, currentRole: ROLES.MP };

  assert(hasPermission(ROLES.MP, PERMISSIONS.VIEW_OWN_PROJECTS), 'MP has VIEW_OWN_PROJECTS permission');
  assert(!hasPermission(ROLES.MP, PERMISSIONS.MANAGE_USERS), 'MP does NOT have MANAGE_USERS permission');
  assert(!hasPermission(ROLES.MP, PERMISSIONS.APPROVE_MILESTONES), 'MP does NOT have APPROVE_MILESTONES permission');

  const mpWorksRes = await api.getProjects(mpSession);
  assert(mpWorksRes.ok && mpWorksRes.status === 200, 'MP getProjects returned 200 OK');
  assert(mpWorksRes.data.every(w => w.district === 'Varanasi' || w.constituency.includes('Varanasi')), 'MP only received projects in their constituency');

  // Test 2: MP Attempting ID Tampering (Requesting Patna project WRK-BR-PAT-0115)
  const tamperRes = await api.getProjectById(mpSession, 'WRK-BR-PAT-0115');
  assert(!tamperRes.ok && tamperRes.status === 403, 'MP requesting out-of-jurisdiction project ID returns 403 Forbidden');
  assert(tamperRes.error?.code === 'ACCESS_DENIED', 'Error code is ACCESS_DENIED on ID tampering');

  // Test 3: District Authority Scope & Milestone Approval
  const dmVaranasi = MOCK_USERS.district_varanasi;
  const dmSession = { isAuthenticated: true, currentUser: dmVaranasi, currentRole: ROLES.DISTRICT };

  assert(hasPermission(ROLES.DISTRICT, PERMISSIONS.APPROVE_MILESTONES), 'District Authority has APPROVE_MILESTONES permission');
  const verifyRes = await api.verifyProjectPhoto(dmSession, 'WRK-UP-VAR-0042', {});
  assert(verifyRes.ok && verifyRes.status === 200, 'District Authority can verify photos for projects in their district');

  // Cross-district milestone approval blocked (DM Varanasi trying to approve Pune project WRK-MH-PUN-0056)
  const crossDistrictVerify = await api.verifyProjectPhoto(dmSession, 'WRK-MH-PUN-0056', {});
  assert(!crossDistrictVerify.ok && crossDistrictVerify.status === 403, 'Cross-district milestone approval returned 403 Forbidden');

  // Test 4: State Nodal Authority Scope
  const snaUP = MOCK_USERS.state_up;
  const snaSession = { isAuthenticated: true, currentUser: snaUP, currentRole: ROLES.STATE };
  const snaWorks = await api.getProjects(snaSession);
  assert(snaWorks.ok && snaWorks.data.every(w => w.state === 'Uttar Pradesh'), 'State SNA only receives works in their state');

  // Test 5: Ministry Pan-India Access
  const ministryUser = MOCK_USERS.ministry;
  const ministrySession = { isAuthenticated: true, currentUser: ministryUser, currentRole: ROLES.MINISTRY };
  const minWorks = await api.getProjects(ministrySession);
  assert(minWorks.ok && minWorks.data.length >= 7, 'Ministry officer receives pan-India works across all states');

  // Test 6: System Admin Governance & Security Restrictions
  const adminUser = MOCK_USERS.admin;
  const adminSession = { isAuthenticated: true, currentUser: adminUser, currentRole: ROLES.ADMIN };

  assert(hasPermission(ROLES.ADMIN, PERMISSIONS.MANAGE_USERS), 'Admin has MANAGE_USERS permission');
  assert(hasPermission(ROLES.ADMIN, PERMISSIONS.MANAGE_SYSTEM_CONFIG), 'Admin has MANAGE_SYSTEM_CONFIG permission');

  const usersRes = await api.getUsers(adminSession);
  assert(usersRes.ok && usersRes.data.length > 0, 'Admin can fetch users list');

  const mpUsersRes = await api.getUsers(mpSession);
  assert(!mpUsersRes.ok && mpUsersRes.status === 403, 'Non-admin (MP) attempting to access /api/users returns 403 Forbidden');

  // Test 7: Unauthenticated access returns 401 Unauthorized
  const unauthSession = { isAuthenticated: false, currentUser: null, currentRole: null };
  const unauthRes = await api.getProjects(unauthSession);
  assert(!unauthRes.ok && unauthRes.status === 401, 'Unauthenticated request returns 401 Unauthorized');

  console.log(`\n--- Tests Completed: ${passedTests}/${totalTests} Passed ---`);
}

runTests();
