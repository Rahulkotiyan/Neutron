# Task 7: API Test Scenarios - Complete Group Creation Flow

## API Endpoints Being Tested

1. `POST /api/groups` - Create group
2. `POST /api/groups/{id}/members` - Add member
3. `PATCH /api/groups/{id}/members/{userId}/role` - Assign role
4. `GET /api/groups/{id}` - Get group details

---

## Test Scenario 1: Create Group - Success

### Request
```http
POST /api/groups HTTP/1.1
Host: localhost:5000
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Test Group",
  "description": "A test group for verification",
  "type": "CLUB",
  "joinPolicy": "PUBLIC",
  "messagePermission": "everyone"
}
```

### Expected Response (201 Created)
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Test Group",
    "description": "A test group for verification",
    "type": "CLUB",
    "college": "user-college",
    "owner": "507f1f77bcf86cd799439012",
    "admins": ["507f1f77bcf86cd799439012"],
    "members": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "userId": "507f1f77bcf86cd799439012",
        "joinedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "channels": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "name": "general",
        "type": "TEXT",
        "position": 0,
        "messagePermissions": "everyone",
        "createdBy": "507f1f77bcf86cd799439012"
      },
      {
        "_id": "507f1f77bcf86cd799439015",
        "name": "announcements",
        "type": "ANNOUNCEMENT",
        "position": 1,
        "messagePermissions": "admin",
        "createdBy": "507f1f77bcf86cd799439012"
      }
    ],
    "roles": [
      {
        "_id": "507f1f77bcf86cd799439016",
        "name": "Owner",
        "color": "#F472B6",
        "position": 100,
        "permissions": ["*"]
      },
      {
        "_id": "507f1f77bcf86cd799439017",
        "name": "Admin",
        "color": "#8B5CF6",
        "position": 50,
        "permissions": [
          "MANAGE_CHANNELS",
          "KICK_MEMBERS",
          "BAN_MEMBERS",
          "ADD_MEMBERS",
          "DELETE_MESSAGES",
          "PIN_MESSAGES",
          "SEND_MESSAGES"
        ]
      },
      {
        "_id": "507f1f77bcf86cd799439018",
        "name": "Moderator",
        "color": "#3B82F6",
        "position": 25,
        "permissions": [
          "MANAGE_MESSAGES",
          "MUTE_MEMBERS",
          "DELETE_MESSAGES",
          "PIN_MESSAGES",
          "SEND_MESSAGES"
        ]
      },
      {
        "_id": "507f1f77bcf86cd799439019",
        "name": "Member",
        "color": "#10B981",
        "position": 0,
        "permissions": ["SEND_MESSAGES", "READ_MESSAGES"]
      }
    ],
    "joinPolicy": "PUBLIC",
    "isEncrypted": true,
    "stats": {
      "memberCount": 1,
      "activeMembers": 1,
      "lastActivity": "2024-01-15T10:30:00Z"
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "message": "Group created successfully"
}
```

### Verification Points
- ✓ Status code is 201
- ✓ Response has success: true
- ✓ Group has _id
- ✓ Channels array has 2 items (general, announcements)
- ✓ Roles array has 4 items (Owner, Admin, Moderator, Member)
- ✓ isEncrypted is true
- ✓ memberCount is 1
- ✓ Creator is in members array
- ✓ Creator is in admins array

---

## Test Scenario 2: Create Group - Missing Name

### Request
```http
POST /api/groups HTTP/1.1
Host: localhost:5000
Authorization: Bearer {token}
Content-Type: application/json

{
  "description": "A test group without name",
  "type": "CLUB",
  "joinPolicy": "PUBLIC"
}
```

### Expected Response (400 Bad Request)
```json
{
  "success": false,
  "message": "Group name is required",
  "code": "INVALID_GROUP_NAME"
}
```

### Verification Points
- ✓ Status code is 400
- ✓ Response has success: false
- ✓ Error message is specific
- ✓ Error code is provided

---

## Test Scenario 3: Create Group - User Not Found

### Request
```http
POST /api/groups HTTP/1.1
Host: localhost:5000
Authorization: Bearer {invalid-token}
Content-Type: application/json

{
  "name": "Test Group",
  "description": "Test",
  "type": "CLUB"
}
```

### Expected Response (404 Not Found)
```json
{
  "success": false,
  "message": "User not found",
  "code": "USER_NOT_FOUND"
}
```

### Verification Points
- ✓ Status code is 404
- ✓ Response has success: false
- ✓ Error code is USER_NOT_FOUND

---

## Test Scenario 4: Add Member - Success

### Request
```http
POST /api/groups/507f1f77bcf86cd799439011/members HTTP/1.1
Host: localhost:5000
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "507f1f77bcf86cd799439020",
  "encryptedGroupKey": null
}
```

### Expected Response (201 Created)
```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439020"
  },
  "message": "Member added successfully"
}
```

### Verification Points
- ✓ Status code is 201
- ✓ Response has success: true
- ✓ Member userId is returned
- ✓ Group member count increased

---

## Test Scenario 5: Add Member - User Not Found

### Request
```http
POST /api/groups/507f1f77bcf86cd799439011/members HTTP/1.1
Host: localhost:5000
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "invalid-user-id"
}
```

### Expected Response (404 Not Found)
```json
{
  "success": false,
  "message": "Target user not found",
  "code": "USER_NOT_FOUND"
}
```

### Verification Points
- ✓ Status code is 404
- ✓ Response has success: false
- ✓ Error code is USER_NOT_FOUND
- ✓ Member not added to group

---

## Test Scenario 6: Add Member - Already Member

### Request
```http
POST /api/groups/507f1f77bcf86cd799439011/members HTTP/1.1
Host: localhost:5000
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "507f1f77bcf86cd799439012"
}
```

### Expected Response (400 Bad Request)
```json
{
  "success": false,
  "message": "User is already a member",
  "code": "ALREADY_MEMBER"
}
```

### Verification Points
- ✓ Status code is 400
- ✓ Response has success: false
- ✓ Error code is ALREADY_MEMBER

---

## Test Scenario 7: Add Member - Insufficient Permissions

### Request
```http
POST /api/groups/507f1f77bcf86cd799439011/members HTTP/1.1
Host: localhost:5000
Authorization: Bearer {non-admin-token}
Content-Type: application/json

{
  "userId": "507f1f77bcf86cd799439020"
}
```

### Expected Response (403 Forbidden)
```json
{
  "success": false,
  "message": "Insufficient permissions",
  "code": "INSUFFICIENT_PERMISSIONS"
}
```

### Verification Points
- ✓ Status code is 403
- ✓ Response has success: false
- ✓ Error code is INSUFFICIENT_PERMISSIONS
- ✓ Member not added

---

## Test Scenario 8: Assign Role - Success

### Request
```http
PATCH /api/groups/507f1f77bcf86cd799439011/members/507f1f77bcf86cd799439020/role HTTP/1.1
Host: localhost:5000
Authorization: Bearer {token}
Content-Type: application/json

{
  "roleId": "507f1f77bcf86cd799439017"
}
```

### Expected Response (200 OK)
```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439020",
    "roleId": "507f1f77bcf86cd799439017",
    "joinedAt": "2024-01-15T10:30:00Z"
  },
  "message": "Member role updated successfully"
}
```

### Verification Points
- ✓ Status code is 200
- ✓ Response has success: true
- ✓ Member roleId is updated
- ✓ Response includes member data

---

## Test Scenario 9: Assign Role - Invalid Role ID

### Request
```http
PATCH /api/groups/507f1f77bcf86cd799439011/members/507f1f77bcf86cd799439020/role HTTP/1.1
Host: localhost:5000
Authorization: Bearer {token}
Content-Type: application/json

{
  "roleId": "invalid-role-id"
}
```

### Expected Response (400 Bad Request)
```json
{
  "success": false,
  "message": "Invalid role ID",
  "code": "INVALID_ROLE_ID"
}
```

### Verification Points
- ✓ Status code is 400
- ✓ Response has success: false
- ✓ Error code is INVALID_ROLE_ID

---

## Test Scenario 10: Assign Role - Role Not Found

### Request
```http
PATCH /api/groups/507f1f77bcf86cd799439011/members/507f1f77bcf86cd799439020/role HTTP/1.1
Host: localhost:5000
Authorization: Bearer {token}
Content-Type: application/json

{
  "roleId": "507f1f77bcf86cd799439099"
}
```

### Expected Response (404 Not Found)
```json
{
  "success": false,
  "message": "Role not found in this group",
  "code": "ROLE_NOT_FOUND"
}
```

### Verification Points
- ✓ Status code is 404
- ✓ Response has success: false
- ✓ Error code is ROLE_NOT_FOUND

---

## Test Scenario 11: Assign Role - Insufficient Permissions

### Request
```http
PATCH /api/groups/507f1f77bcf86cd799439011/members/507f1f77bcf86cd799439021/role HTTP/1.1
Host: localhost:5000
Authorization: Bearer {non-admin-token}
Content-Type: application/json

{
  "roleId": "507f1f77bcf86cd799439017"
}
```

### Expected Response (403 Forbidden)
```json
{
  "success": false,
  "message": "Only group owner or admins can assign roles",
  "code": "INSUFFICIENT_PERMISSIONS"
}
```

### Verification Points
- ✓ Status code is 403
- ✓ Response has success: false
- ✓ Error code is INSUFFICIENT_PERMISSIONS
- ✓ Role not assigned

---

## Test Scenario 12: Assign Role - User Not Member

### Request
```http
PATCH /api/groups/507f1f77bcf86cd799439011/members/507f1f77bcf86cd799439099/role HTTP/1.1
Host: localhost:5000
Authorization: Bearer {token}
Content-Type: application/json

{
  "roleId": "507f1f77bcf86cd799439017"
}
```

### Expected Response (400 Bad Request)
```json
{
  "success": false,
  "message": "User is not a member of this group",
  "code": "NOT_A_MEMBER"
}
```

### Verification Points
- ✓ Status code is 400
- ✓ Response has success: false
- ✓ Error code is NOT_A_MEMBER

---

## Test Scenario 13: Get Group - Success

### Request
```http
GET /api/groups/507f1f77bcf86cd799439011 HTTP/1.1
Host: localhost:5000
Authorization: Bearer {token}
```

### Expected Response (200 OK)
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Test Group",
    "description": "A test group for verification",
    "type": "CLUB",
    "owner": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Owner Name",
      "avatar": "..."
    },
    "admins": ["507f1f77bcf86cd799439012"],
    "members": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "userId": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Owner Name",
          "avatar": "...",
          "handle": "owner",
          "email": "owner@example.com"
        },
        "joinedAt": "2024-01-15T10:30:00Z"
      },
      {
        "_id": "507f1f77bcf86cd799439014",
        "userId": {
          "_id": "507f1f77bcf86cd799439020",
          "name": "Member Name",
          "avatar": "...",
          "handle": "member",
          "email": "member@example.com"
        },
        "roleId": "507f1f77bcf86cd799439017",
        "joinedAt": "2024-01-15T10:35:00Z"
      }
    ],
    "channels": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "name": "general",
        "type": "TEXT",
        "position": 0,
        "messagePermissions": "everyone"
      },
      {
        "_id": "507f1f77bcf86cd799439015",
        "name": "announcements",
        "type": "ANNOUNCEMENT",
        "position": 1,
        "messagePermissions": "admin"
      }
    ],
    "roles": [
      {
        "_id": "507f1f77bcf86cd799439016",
        "name": "Owner",
        "color": "#F472B6",
        "position": 100,
        "permissions": ["*"]
      },
      {
        "_id": "507f1f77bcf86cd799439017",
        "name": "Admin",
        "color": "#8B5CF6",
        "position": 50,
        "permissions": [
          "MANAGE_CHANNELS",
          "KICK_MEMBERS",
          "BAN_MEMBERS",
          "ADD_MEMBERS",
          "DELETE_MESSAGES",
          "PIN_MESSAGES",
          "SEND_MESSAGES"
        ]
      }
    ],
    "joinPolicy": "PUBLIC",
    "isEncrypted": true,
    "stats": {
      "memberCount": 2,
      "activeMembers": 1,
      "lastActivity": "2024-01-15T10:35:00Z"
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:35:00Z"
  },
  "message": "Group fetched successfully"
}
```

### Verification Points
- ✓ Status code is 200
- ✓ Response has success: true
- ✓ Group data is complete
- ✓ Members are populated with user details
- ✓ Channels are present
- ✓ Roles are present
- ✓ Stats are updated

---

## Test Scenario 14: Get Group - Not Found

### Request
```http
GET /api/groups/invalid-group-id HTTP/1.1
Host: localhost:5000
Authorization: Bearer {token}
```

### Expected Response (404 Not Found)
```json
{
  "success": false,
  "message": "Group not found"
}
```

### Verification Points
- ✓ Status code is 404
- ✓ Response has success: false

---

## Complete Flow Test

### Sequence of Requests

1. **Create Group**
   ```
   POST /api/groups
   Response: 201 with group data
   ```

2. **Add Member 1**
   ```
   POST /api/groups/{id}/members
   Response: 201
   ```

3. **Add Member 2**
   ```
   POST /api/groups/{id}/members
   Response: 201
   ```

4. **Assign Admin to Member 1**
   ```
   PATCH /api/groups/{id}/members/{userId}/role
   Response: 200
   ```

5. **Assign Admin to Member 2**
   ```
   PATCH /api/groups/{id}/members/{userId}/role
   Response: 200
   ```

6. **Get Group**
   ```
   GET /api/groups/{id}
   Response: 200 with updated group data
   ```

### Expected Final State
- Group has 3 members (creator + 2 invited)
- 2 members have Admin role
- 2 default channels created
- All operations logged
- No errors in any response

---

## cURL Test Commands

### Create Group
```bash
curl -X POST http://localhost:5000/api/groups \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Group",
    "description": "Test Description",
    "type": "CLUB",
    "joinPolicy": "PUBLIC",
    "messagePermission": "everyone"
  }'
```

### Add Member
```bash
curl -X POST http://localhost:5000/api/groups/GROUP_ID/members \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID"
  }'
```

### Assign Role
```bash
curl -X PATCH http://localhost:5000/api/groups/GROUP_ID/members/USER_ID/role \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleId": "ROLE_ID"
  }'
```

### Get Group
```bash
curl -X GET http://localhost:5000/api/groups/GROUP_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Postman Collection

Import this into Postman for easy testing:

```json
{
  "info": {
    "name": "Group Creation Flow",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create Group",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"Test Group\",\n  \"description\": \"Test Description\",\n  \"type\": \"CLUB\",\n  \"joinPolicy\": \"PUBLIC\",\n  \"messagePermission\": \"everyone\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/groups",
          "host": ["{{baseUrl}}"],
          "path": ["groups"]
        }
      }
    },
    {
      "name": "Add Member",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"userId\": \"{{userId}}\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/groups/{{groupId}}/members",
          "host": ["{{baseUrl}}"],
          "path": ["groups", "{{groupId}}", "members"]
        }
      }
    },
    {
      "name": "Assign Role",
      "request": {
        "method": "PATCH",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"roleId\": \"{{adminRoleId}}\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/groups/{{groupId}}/members/{{userId}}/role",
          "host": ["{{baseUrl}}"],
          "path": ["groups", "{{groupId}}", "members", "{{userId}}", "role"]
        }
      }
    },
    {
      "name": "Get Group",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/groups/{{groupId}}",
          "host": ["{{baseUrl}}"],
          "path": ["groups", "{{groupId}}"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5000/api"
    },
    {
      "key": "token",
      "value": ""
    },
    {
      "key": "groupId",
      "value": ""
    },
    {
      "key": "userId",
      "value": ""
    },
    {
      "key": "adminRoleId",
      "value": ""
    }
  ]
}
```

