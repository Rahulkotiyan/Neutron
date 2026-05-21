# Task 7: Test Execution Guide - Complete Group Creation Flow

## Quick Start

### 1. Start Backend Server
```bash
cd backend
npm run dev
# Expected output: Server running on http://localhost:5000
```

### 2. Start Frontend Server
```bash
cd frontend
npm run dev
# Expected output: Local: http://localhost:5173
```

### 3. Open Browser
- Navigate to `http://localhost:5173`
- Open DevTools: F12 or Ctrl+Shift+I
- Go to Console tab to monitor for errors
- Go to Network tab to monitor API calls

---

## Manual Test Execution

### Test 1: Valid Group Creation

**Duration:** ~2 minutes

**Steps:**
1. Click the "+" button in the Groups header
2. Fill in the form:
   - Name: `Test Group - Valid Creation`
   - Description: `Testing valid group creation flow`
   - Type: Select "CLUB"
   - Join Policy: Select "PUBLIC"
   - Message Permission: Select "Everyone"
3. Click "Next →"
4. Click "Create" (no members to invite)

**Expected Behavior:**
- Modal closes
- New group appears at top of group list
- Group name shows in list
- No errors in console

**Verification:**
```javascript
// In browser console, run:
// Check if group appears in DOM
document.querySelector('[class*="group"]')?.textContent.includes('Test Group - Valid Creation')

// Check Network tab:
// POST /api/groups - Status 201
// Response includes: _id, name, channels, roles, isEncrypted: true
```

**Backend Verification:**
```bash
# Check backend logs for:
# "Group created successfully" with groupId and groupName
```

---

### Test 2: Single Member Invitation

**Duration:** ~3 minutes

**Steps:**
1. Click "+" to create new group
2. Fill in group details:
   - Name: `Test Group - Single Member`
   - Description: `Testing single member invitation`
   - Type: "CLUB"
   - Join Policy: "PUBLIC"
   - Message Permission: "Everyone"
3. Click "Next →"
4. In Members section:
   - Type in search box: `test` (or any existing user)
   - Click on a user in dropdown
   - Verify user appears in selected members list
5. Leave "Make selected users Admin" unchecked
6. Click "Create"

**Expected Behavior:**
- Group created
- Member added to group
- Modal closes
- No errors in console

**Verification:**
```javascript
// In browser console:
// Check Network tab for:
// POST /api/groups - Status 201
// POST /api/groups/{id}/members - Status 201

// Check response data:
// Group should have members.length = 2 (creator + invited)
```

**Backend Verification:**
```bash
# Check logs for:
# "Group created successfully"
# "Member added successfully"
```

---

### Test 3: Multiple Member Invitation

**Duration:** ~4 minutes

**Steps:**
1. Click "+" to create new group
2. Fill in group details:
   - Name: `Test Group - Multiple Members`
   - Description: `Testing multiple member invitation`
   - Type: "CLUB"
   - Join Policy: "PUBLIC"
   - Message Permission: "Everyone"
3. Click "Next →"
4. In Members section:
   - Search and add first user
   - Search and add second user
   - Search and add third user
   - Verify all 3 appear in selected members list
5. Leave "Make selected users Admin" unchecked
6. Click "Create"

**Expected Behavior:**
- Group created
- All 3 members added
- Member count = 4 (creator + 3 invited)
- No errors for any member
- Modal closes

**Verification:**
```javascript
// In browser console:
// Check Network tab for:
// POST /api/groups - Status 201
// POST /api/groups/{id}/members - Status 201 (3 times)

// Verify member count
// Group should have members.length = 4
```

**Backend Verification:**
```bash
# Check logs for:
# "Group created successfully"
# "Member added successfully" (3 times)
# No error logs for member additions
```

---

### Test 4: Admin Role Assignment

**Duration:** ~4 minutes

**Steps:**
1. Click "+" to create new group
2. Fill in group details:
   - Name: `Test Group - Admin Assignment`
   - Description: `Testing admin role assignment`
   - Type: "CLUB"
   - Join Policy: "PUBLIC"
   - Message Permission: "Everyone"
3. Click "Next →"
4. In Members section:
   - Search and add first user
   - Search and add second user
   - Check "Make selected users Admin" checkbox
5. Click "Create"

**Expected Behavior:**
- Group created
- Members added
- Admin role assigned to both members
- No 404 or 403 errors
- Modal closes

**Verification:**
```javascript
// In browser console:
// Check Network tab for:
// POST /api/groups - Status 201
// POST /api/groups/{id}/members - Status 201 (2 times)
// PATCH /api/groups/{id}/members/{userId}/role - Status 200 (2 times)

// Verify role assignment in response
// Response should include roleId matching Admin role
```

**Backend Verification:**
```bash
# Check logs for:
# "Group created successfully"
# "Member added successfully" (2 times)
# "Member role updated successfully" (2 times)
# No error logs
```

---

### Test 5: Error Case - Missing Group Name

**Duration:** ~1 minute

**Steps:**
1. Click "+" to create new group
2. Leave Name field empty
3. Try to click "Next →" button

**Expected Behavior:**
- "Next →" button is disabled (grayed out)
- No request sent to backend
- No error message shown

**Verification:**
```javascript
// In browser console:
// Check that button is disabled
document.querySelector('button:contains("Next")').disabled === true

// Check Network tab:
// No POST request to /api/groups
```

---

### Test 6: Error Case - Invalid User ID

**Duration:** ~2 minutes

**Steps:**
1. Create a group with valid details
2. Open DevTools Network tab
3. In Members section, add a user
4. Before clicking Create, modify the request in Network tab to use invalid userId
5. Click Create

**Alternative (Simpler):**
1. Create group with valid details
2. Manually add a member with invalid ID using API call:
```javascript
// In browser console:
const token = localStorage.getItem('token');
const groupId = 'valid-group-id';
const invalidUserId = 'invalid-user-id';

fetch('http://localhost:5000/api/groups/' + groupId + '/members', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ userId: invalidUserId })
})
.then(r => r.json())
.then(d => console.log('Response:', d))
```

**Expected Behavior:**
- Request returns 404 status
- Error message: "Target user not found" or "User not found"
- Error code: "USER_NOT_FOUND"
- Frontend displays error message
- Error context shows operation and status

**Verification:**
```javascript
// In browser console:
// Check Network tab response:
// Status: 404
// Response: {
//   success: false,
//   message: "Target user not found",
//   code: "USER_NOT_FOUND"
// }
```

---

### Test 7: Error Case - Permission Denied

**Duration:** ~3 minutes

**Steps:**
1. Create group as User A
2. Add User B as regular member (don't make admin)
3. Switch to User B account (logout and login as User B)
4. Try to assign admin role to User C using API call:
```javascript
// In browser console (as User B):
const token = localStorage.getItem('token');
const groupId = 'group-created-by-user-a';
const userCId = 'user-c-id';
const adminRoleId = 'admin-role-id';

fetch('http://localhost:5000/api/groups/' + groupId + '/members/' + userCId + '/role', {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ roleId: adminRoleId })
})
.then(r => r.json())
.then(d => console.log('Response:', d))
```

**Expected Behavior:**
- Request returns 403 status
- Error message: "Only group owner or admins can assign roles"
- Error code: "INSUFFICIENT_PERMISSIONS"
- Role is NOT assigned
- Console shows detailed error log

**Verification:**
```javascript
// In browser console:
// Check Network tab response:
// Status: 403
// Response: {
//   success: false,
//   message: "Only group owner or admins can assign roles",
//   code: "INSUFFICIENT_PERMISSIONS"
// }
```

---

### Test 8: Default Channels Verification

**Duration:** ~2 minutes

**Steps:**
1. Create a group with valid data
2. Open DevTools Network tab
3. Find the POST /api/groups response
4. Inspect the channels array in response

**Expected Behavior:**
- Response includes channels array
- At least 2 default channels present
- "general" channel with correct properties
- "announcements" channel with correct properties

**Verification:**
```javascript
// In browser console:
// Check Network tab response for POST /api/groups
// Look for channels array:
{
  channels: [
    {
      _id: "...",
      name: "general",
      type: "TEXT",
      position: 0,
      messagePermissions: "everyone",
      createdBy: "..."
    },
    {
      _id: "...",
      name: "announcements",
      type: "ANNOUNCEMENT",
      position: 1,
      messagePermissions: "admin",
      createdBy: "..."
    }
  ]
}

// Verify in console:
const response = /* from Network tab */;
console.log('General channel:', response.channels.find(c => c.name === 'general'));
console.log('Announcements channel:', response.channels.find(c => c.name === 'announcements'));
```

---

### Test 9: Error Message Clarity

**Duration:** ~3 minutes

**Steps:**
1. Trigger various error scenarios:
   - Try to add non-existent user
   - Try to assign role without permission
   - Try to create group with invalid data
2. Observe error messages displayed

**Expected Behavior:**
- Error messages are clear and specific
- No technical jargon
- Error context visible
- Retry and Dismiss buttons available

**Verification:**
```javascript
// In browser console:
// Check error message text
const errorMessage = document.querySelector('[class*="error"]')?.textContent;
console.log('Error message:', errorMessage);

// Verify message quality:
// - Not empty
// - Not too long (< 200 chars)
// - No "undefined", "null", "[object Object]"
// - Specific about what went wrong
```

---

### Test 10: Console and Logs Verification

**Duration:** ~5 minutes

**Steps:**
1. Open browser DevTools Console
2. Execute complete group creation flow
3. Monitor console throughout
4. Check backend logs

**Expected Behavior:**

**Browser Console:**
- No JavaScript errors
- No unhandled promise rejections
- No 404 or 500 errors
- Detailed error logs when errors occur

**Backend Logs:**
- Group creation logged
- Member additions logged
- Role assignments logged
- All errors logged with context

**Verification:**
```javascript
// In browser console:
// Check for errors
console.log('Errors:', console.error.calls);
console.log('Warnings:', console.warn.calls);

// Check Network tab:
// All requests should have appropriate status codes
// 201 for successful creation
// 200 for successful updates
// 4xx for client errors
// 5xx for server errors (should not occur)
```

**Backend Verification:**
```bash
# Check backend logs for:
# [INFO] Group created successfully
# [INFO] Member added successfully
# [INFO] Member role updated successfully
# [ERROR] (if any errors occurred)

# Verify no sensitive data in logs:
# grep -i "password\|token\|secret" backend.log
# Should return nothing
```

---

## Automated Test Verification (Optional)

If you want to verify programmatically, use this Node.js script:

```javascript
// test-group-creation.js
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const TOKEN = 'your-auth-token';

async function testGroupCreation() {
  try {
    console.log('Test 1: Creating group...');
    const groupRes = await axios.post(`${API_URL}/groups`, {
      name: 'Test Group',
      description: 'Test Description',
      type: 'CLUB',
      joinPolicy: 'PUBLIC',
      messagePermission: 'everyone'
    }, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });

    const groupId = groupRes.data.data._id;
    console.log('✓ Group created:', groupId);
    console.log('✓ Channels:', groupRes.data.data.channels.length);
    console.log('✓ Roles:', groupRes.data.data.roles.length);
    console.log('✓ Encrypted:', groupRes.data.data.isEncrypted);

    console.log('\nTest 2: Adding member...');
    const memberRes = await axios.post(`${API_URL}/groups/${groupId}/members`, {
      userId: 'test-user-id'
    }, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    console.log('✓ Member added');

    console.log('\nTest 3: Assigning admin role...');
    const adminRole = groupRes.data.data.roles.find(r => r.name === 'Admin');
    const roleRes = await axios.patch(
      `${API_URL}/groups/${groupId}/members/test-user-id/role`,
      { roleId: adminRole._id },
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
    console.log('✓ Admin role assigned');

    console.log('\n✓ All tests passed!');
  } catch (error) {
    console.error('✗ Test failed:', error.response?.data || error.message);
  }
}

testGroupCreation();
```

Run with:
```bash
node test-group-creation.js
```

---

## Troubleshooting

### Issue: "Group not found" error
**Solution:** Ensure group ID is correct and group was created successfully

### Issue: "User not found" error
**Solution:** Verify user ID exists in database and is valid ObjectId format

### Issue: "Insufficient permissions" error
**Solution:** Ensure you're logged in as group owner or admin

### Issue: No channels in response
**Solution:** Check backend createGroup function is creating default channels

### Issue: Console shows CORS errors
**Solution:** Verify backend CORS configuration allows frontend origin

### Issue: Backend not logging
**Solution:** Check console.log statements are present in controller functions

---

## Success Criteria

All tests pass when:
- ✓ Groups can be created with valid data
- ✓ Members can be invited (single and multiple)
- ✓ Admin roles can be assigned
- ✓ Default channels are created
- ✓ Error cases return appropriate status codes
- ✓ Error messages are clear and helpful
- ✓ No console errors or warnings
- ✓ Backend logs show all operations
- ✓ No sensitive data in logs

---

## Sign-Off

**Tester Name:** ___________________  
**Date:** ___________________  
**Result:** ☐ PASS ☐ FAIL  
**Issues Found:** ___________________  
**Notes:** ___________________

