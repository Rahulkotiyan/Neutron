# Requirements Document: Groups Visibility and State Fix

## Introduction

This document specifies the requirements for fixing two critical issues in the Groups & Clubs feature:

1. **Groups not visible from other accounts**: Groups created by one user are invisible to other users because the frontend uses hardcoded mock data instead of fetching from the backend API.

2. **Members being added multiple times**: The form state (invited members list and admin checkbox) is not reset after group creation, causing previously invited members to appear again when creating subsequent groups.

The solution ensures that groups are fetched from the backend API on component mount, making them visible across all authenticated user accounts, and implements proper state cleanup after successful group creation to prevent duplicate member additions.

---

## Glossary

- **GroupsPage**: The React component that displays the list of groups and handles group creation
- **Group**: A collection of users organized around a common interest or department
- **Member**: A user who belongs to a group
- **Admin**: A member with elevated permissions within a group
- **Form State**: The collection of state variables that track the group creation form (name, description, members, etc.)
- **Backend API**: The Express.js server providing REST endpoints for group operations
- **Authentication Token**: JWT token stored in localStorage that identifies the authenticated user
- **Invited Members**: Users selected to be added to a group during the creation process
- **State Reset**: The process of clearing all form state variables to their initial values
- **Real-time Updates**: Socket.io events that notify clients of group changes
- **Group Visibility**: Whether a group appears in the groups list for a given user

---

## Requirements

### Requirement 1: Fetch Groups from Backend API

**User Story:** As a user, I want to see all groups created by other users so that I can discover and join communities.

#### Acceptance Criteria

1. WHEN the GroupsPage component mounts THEN the system SHALL fetch all groups from the GET /api/groups endpoint
2. WHEN groups are successfully fetched THEN the system SHALL populate the groups state with the returned data
3. WHEN the API request fails THEN the system SHALL set the groups state to an empty array and log the error
4. WHEN the user is not authenticated THEN the system SHALL not attempt to fetch groups
5. WHEN groups are fetched THEN the system SHALL include all groups regardless of which user created them

---

### Requirement 2: Display All Public Groups to Authenticated Users

**User Story:** As an authenticated user, I want to see all public groups in the system so that I can discover communities created by other users.

#### Acceptance Criteria

1. WHEN a user is authenticated THEN the system SHALL display all public groups in the groups list
2. WHEN a group is created by User A THEN the system SHALL make it visible to User B upon the next fetch
3. WHEN multiple users are viewing the groups list THEN the system SHALL show the same groups to all users
4. WHEN a group has joinPolicy set to PUBLIC THEN the system SHALL include it in the fetched groups
5. WHEN the groups list is displayed THEN the system SHALL show group name, description, member count, and type

---

### Requirement 3: Reset Form State After Successful Group Creation

**User Story:** As a user, I want the form to be clean when creating multiple groups so that I don't accidentally add the same members twice.

#### Acceptance Criteria

1. WHEN a group is successfully created THEN the system SHALL reset the groupName state to an empty string
2. WHEN a group is successfully created THEN the system SHALL reset the groupDescription state to an empty string
3. WHEN a group is successfully created THEN the system SHALL reset the invitedMembers state to an empty array
4. WHEN a group is successfully created THEN the system SHALL reset the assignAsAdmin checkbox to false
5. WHEN a group is successfully created THEN the system SHALL reset the memberSearch state to an empty string
6. WHEN a group is successfully created THEN the system SHALL reset the memberResults state to an empty array
7. WHEN a group is successfully created THEN the system SHALL reset the groupType to "CLUB"
8. WHEN a group is successfully created THEN the system SHALL reset the joinPolicy to "PUBLIC"
9. WHEN a group is successfully created THEN the system SHALL reset the messagePermission to "everyone"
10. WHEN a group is successfully created THEN the system SHALL close the create group modal

---

### Requirement 4: Prevent Duplicate Member Addition

**User Story:** As a user, I want to create multiple groups without accidentally adding the same members twice.

#### Acceptance Criteria

1. WHEN the form state is reset after group creation THEN the system SHALL clear the invitedMembers array
2. WHEN a user creates a second group THEN the system SHALL not include members from the first group in the invited members list
3. WHEN the invitedMembers array is empty THEN the system SHALL not add any members to the new group
4. WHEN a member is added to a group THEN the system SHALL prevent adding the same member twice to that group
5. WHEN attempting to add a duplicate member THEN the system SHALL return an error with code "ALREADY_MEMBER"

---

### Requirement 5: Reset Admin Checkbox After Group Creation

**User Story:** As a user, I want the admin checkbox to be unchecked when creating a new group so that I don't accidentally assign admin roles to members in subsequent groups.

#### Acceptance Criteria

1. WHEN a group is successfully created THEN the system SHALL reset the assignAsAdmin checkbox to false
2. WHEN the assignAsAdmin checkbox is false THEN the system SHALL not assign admin roles to invited members
3. WHEN a user creates a second group THEN the system SHALL not have the assignAsAdmin checkbox checked
4. WHEN the assignAsAdmin checkbox is checked during group creation THEN the system SHALL assign the Admin role to invited members
5. WHEN the assignAsAdmin checkbox is unchecked during group creation THEN the system SHALL not assign the Admin role to invited members

---

### Requirement 6: Display New Groups Immediately After Creation

**User Story:** As a user, I want to see the group I just created appear in the list immediately so that I can verify it was created successfully.

#### Acceptance Criteria

1. WHEN a group is successfully created THEN the system SHALL add it to the groups state immediately
2. WHEN a group is added to the groups state THEN the system SHALL display it at the top of the groups list
3. WHEN a new group is displayed THEN the system SHALL show all group details (name, description, member count, type)
4. WHEN a group is created THEN the system SHALL update the UI within 1 second of receiving the success response
5. WHEN multiple groups are created in sequence THEN the system SHALL display all of them in the correct order

---

### Requirement 7: Handle Group Creation Errors Gracefully

**User Story:** As a user, I want to see clear error messages when group creation fails so that I can understand what went wrong and retry.

#### Acceptance Criteria

1. WHEN group creation fails THEN the system SHALL display an error message to the user
2. WHEN an error occurs THEN the system SHALL not reset the form state
3. WHEN an error occurs THEN the system SHALL not close the create group modal
4. WHEN an error occurs THEN the system SHALL log the error details including operation, status, and message
5. WHEN a member addition fails THEN the system SHALL continue attempting to add other members
6. WHEN a member addition fails THEN the system SHALL display an error message indicating which member failed
7. WHEN an error occurs THEN the system SHALL allow the user to retry the operation

---

### Requirement 8: Assign Admin Roles to Invited Members When Checkbox is Checked

**User Story:** As a user, I want to assign admin roles to invited members when creating a group so that I can delegate management responsibilities.

#### Acceptance Criteria

1. WHEN the assignAsAdmin checkbox is checked THEN the system SHALL assign the Admin role to all invited members
2. WHEN the assignAsAdmin checkbox is unchecked THEN the system SHALL not assign the Admin role to invited members
3. WHEN assigning the Admin role THEN the system SHALL use the PATCH /api/groups/:id/members/:userId/role endpoint
4. WHEN the Admin role is assigned THEN the system SHALL include the roleId in the request payload
5. WHEN admin role assignment fails THEN the system SHALL display an error message but continue with other members

---

### Requirement 9: Add Invited Members to Group After Creation

**User Story:** As a user, I want to invite members to my group during creation so that I can build the community immediately.

#### Acceptance Criteria

1. WHEN a group is successfully created THEN the system SHALL add all invited members to the group
2. WHEN adding members THEN the system SHALL use the POST /api/groups/:id/members endpoint
3. WHEN adding a member THEN the system SHALL include the userId in the request payload
4. WHEN a member is added THEN the system SHALL update the group's member count
5. WHEN all members are added THEN the system SHALL update the local groups state with the new member count

---

### Requirement 10: Fetch Groups with Proper Authentication

**User Story:** As an authenticated user, I want the system to use my authentication token when fetching groups so that the backend can verify my identity.

#### Acceptance Criteria

1. WHEN fetching groups THEN the system SHALL retrieve the authentication token from localStorage
2. WHEN fetching groups THEN the system SHALL include the token in the Authorization header as "Bearer {token}"
3. WHEN the token is missing THEN the system SHALL not attempt to fetch groups
4. WHEN the token is invalid THEN the system SHALL handle the 401 error and log it
5. WHEN the token is valid THEN the system SHALL successfully fetch and display groups

---

### Requirement 11: Support Group Creation with Multiple Members

**User Story:** As a user, I want to add multiple members to a group during creation so that I can build the community with my team.

#### Acceptance Criteria

1. WHEN creating a group THEN the system SHALL support adding multiple members from the invitedMembers list
2. WHEN multiple members are invited THEN the system SHALL add each member sequentially
3. WHEN adding members THEN the system SHALL continue even if one member addition fails
4. WHEN all members are added THEN the system SHALL update the group's member count to reflect all additions
5. WHEN no members are invited THEN the system SHALL create the group with only the creator as a member

---

### Requirement 12: Validate Group Name Before Creation

**User Story:** As a user, I want the system to validate the group name so that I don't create groups with empty or invalid names.

#### Acceptance Criteria

1. WHEN the group name is empty THEN the system SHALL prevent group creation
2. WHEN the group name contains only whitespace THEN the system SHALL prevent group creation
3. WHEN the group name is valid THEN the system SHALL proceed with group creation
4. WHEN group creation is prevented THEN the system SHALL display a validation error message
5. WHEN the user corrects the group name THEN the system SHALL allow group creation to proceed

---

### Requirement 13: Maintain Group List State Consistency

**User Story:** As a user, I want the group list to remain consistent and accurate so that I always see the correct information.

#### Acceptance Criteria

1. WHEN a group is created THEN the system SHALL add it to the groups state
2. WHEN a group is updated THEN the system SHALL reflect the changes in the groups state
3. WHEN multiple groups are displayed THEN the system SHALL maintain the correct order (newest first)
4. WHEN the groups list is updated THEN the system SHALL not lose any existing groups
5. WHEN the component re-renders THEN the system SHALL preserve the groups state

---

### Requirement 14: Support Group Creation with Optional Members

**User Story:** As a user, I want to create a group without inviting members so that I can add them later.

#### Acceptance Criteria

1. WHEN the invitedMembers list is empty THEN the system SHALL create the group successfully
2. WHEN no members are invited THEN the system SHALL create the group with only the creator as a member
3. WHEN the group is created without members THEN the system SHALL display it in the groups list
4. WHEN the user adds members to an existing group THEN the system SHALL increase the group's member count by the number of members added
5. WHEN a group has no members except the creator THEN the system SHALL display the member count as 1

---

### Requirement 15: Handle Backend API Errors Appropriately

**User Story:** As a user, I want the system to handle API errors gracefully so that I understand what went wrong and can retry.

#### Acceptance Criteria

1. WHEN the backend returns an error THEN the system SHALL extract the error message from the response
2. WHEN an error occurs THEN the system SHALL log the error details including status code and message
3. WHEN an error occurs THEN the system SHALL display a user-friendly error message
4. WHEN the user retries after an error THEN the system SHALL attempt the operation again
5. WHEN the backend is unavailable THEN the system SHALL display an appropriate error message

---

## Non-Functional Requirements

### Performance Requirements

1. THE system SHALL fetch groups from the backend API within 2 seconds
2. THE system SHALL create a group within 5 seconds
3. THE system SHALL reset form state within 100 milliseconds after successful group creation
4. THE system SHALL support displaying at least 1000 groups in the list without performance degradation
5. THE system SHALL render the groups list with less than 100ms latency

### Reliability Requirements

1. THE system SHALL not lose group data when the component re-renders
2. THE system SHALL maintain form state consistency throughout the group creation process
3. THE system SHALL recover gracefully from API errors without crashing
4. THE system SHALL log all errors for debugging and monitoring purposes
5. THE system SHALL not display stale data to users

### Usability Requirements

1. THE system SHALL display clear and actionable error messages to users
2. THE system SHALL provide visual feedback when groups are being fetched or created
3. THE system SHALL prevent accidental duplicate member additions through proper state management
4. THE system SHALL allow users to retry failed operations without losing their input
5. THE system SHALL display the newly created group immediately in the groups list

### Security Requirements

1. THE system SHALL use authentication tokens to verify user identity when fetching groups
2. THE system SHALL not expose sensitive user information in error messages
3. THE system SHALL validate all user input before sending to the backend
4. THE system SHALL use HTTPS for all API communications
5. THE system SHALL not store sensitive data in localStorage except for the authentication token

---

## Constraints

1. The system must use the existing backend API endpoints (GET /api/groups, POST /api/groups, etc.)
2. The system must maintain backward compatibility with existing group data structures
3. The system must work with the existing authentication mechanism (JWT tokens in localStorage)
4. The system must support the existing group types (CLUB, DEPT, etc.)
5. The system must not modify the backend API endpoints or data models

---

## Assumptions

1. The backend API is always available and responsive
2. The user is authenticated before attempting to create groups
3. The authentication token is valid and not expired
4. The backend returns groups in the expected JSON format
5. The user has permission to create groups and add members
6. The browser supports localStorage for token storage
7. The user has a stable internet connection

---

## Dependencies

### External Dependencies

1. Backend API endpoints:
   - GET /api/groups - Fetch all groups
   - POST /api/groups - Create a new group
   - POST /api/groups/:id/members - Add a member to a group
   - PATCH /api/groups/:id/members/:userId/role - Assign a role to a member

2. Frontend libraries:
   - React 18+ for component rendering
   - axios for HTTP requests
   - localStorage API for token storage

### Internal Dependencies

1. Authentication system (token management)
2. Group data model
3. User data model
4. Error handling utilities

---

## Acceptance Criteria Summary

| Requirement | Key Acceptance Criteria |
|-------------|------------------------|
| 1 | Fetch groups on component mount from GET /api/groups |
| 2 | Display all public groups to all authenticated users |
| 3 | Reset all form state after successful group creation |
| 4 | Clear invitedMembers array to prevent duplicates |
| 5 | Reset assignAsAdmin checkbox to false |
| 6 | Display new groups immediately in the list |
| 7 | Display error messages when operations fail |
| 8 | Assign Admin roles when checkbox is checked |
| 9 | Add invited members to group after creation |
| 10 | Use authentication token when fetching groups |
| 11 | Support adding multiple members during creation |
| 12 | Validate group name before creation |
| 13 | Maintain group list state consistency |
| 14 | Support group creation without members |
| 15 | Handle backend API errors appropriately |

