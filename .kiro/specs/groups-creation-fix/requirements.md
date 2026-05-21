# Groups & Clubs Creation Error Fix - Requirements

## Problem Statement
Users encounter errors when creating or adding groups/clubs in the Neutron application. The group creation flow fails at various stages, preventing users from successfully creating groups and inviting members.

## Current Issues
1. **Missing Admin Assignment Endpoint** - Frontend calls `POST /api/groups/{id}/admins` but this route doesn't exist in the backend
2. **E2EE Key Distribution Mismatch** - Frontend doesn't generate or send encrypted group keys when adding members
3. **Channel Creation Conflict** - Frontend sends channels array in group creation payload, but backend expects separate channel creation
4. **Route Ordering Issues** - Overlapping route patterns may cause request routing conflicts
5. **Poor Error Handling** - Frontend shows generic alerts without detailed error context for debugging

## Requirements

### R1: Group Creation Flow Must Complete Successfully
**Description:** Users should be able to create a group with name, description, type, and join policy without errors.

**Acceptance Criteria:**
- User can fill in group details (name, description, type, join policy)
- Backend successfully creates group document
- Group appears in user's group list immediately after creation
- No 500 errors or validation failures

### R2: Member Invitation Must Work
**Description:** Users should be able to invite members to a group during creation.

**Acceptance Criteria:**
- User can search and select members to invite
- Selected members are added to the group successfully
- Members receive notification of group invitation
- No errors when adding multiple members

### R3: Admin Assignment Must Work
**Description:** Group creator should be able to assign admin roles to invited members.

**Acceptance Criteria:**
- User can check "Make selected users Admin" checkbox
- Selected members are assigned admin role
- Admins have appropriate permissions in the group
- No 404 or permission errors

### R4: Default Channels Must Be Created
**Description:** Groups should have default channels (general, announcements) created automatically.

**Acceptance Criteria:**
- Group is created with at least one default "general" channel
- Channels are properly configured with correct permissions
- Users can immediately start messaging in default channel
- No missing channel errors

### R5: Error Messages Must Be Clear
**Description:** When errors occur, users should see helpful, specific error messages.

**Acceptance Criteria:**
- Frontend displays detailed error messages (not generic alerts)
- Error messages indicate what went wrong (validation, permission, server error)
- Backend logs include full error context for debugging
- Users can understand and act on error messages

### R6: E2EE Integration Must Be Correct
**Description:** Group encryption should be properly initialized and keys distributed.

**Acceptance Criteria:**
- Groups are created with `isEncrypted: true`
- Encrypted group keys are generated and distributed to members
- Members can decrypt group messages
- No encryption-related errors in console

## Success Criteria
- All group creation flows complete without errors
- Users can create groups, invite members, and assign admins in one workflow
- Error messages are clear and actionable
- No console errors or warnings related to group operations
- Backend logs show successful group creation and member addition

## Out of Scope
- Encryption key generation algorithm (use existing implementation)
- UI/UX redesign (only fix functional issues)
- Performance optimization
- New features beyond group creation
