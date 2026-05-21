# Implementation Plan: Groups Visibility and State Fix

## Overview

This implementation plan breaks down the groups-visibility-and-state-fix feature into discrete, actionable tasks. The solution addresses two critical issues:

1. **Groups not visible from other accounts**: Implement real-time group fetching from the backend API instead of using hardcoded mock data
2. **Members being added multiple times**: Implement proper state cleanup after group creation to prevent duplicate member additions

The implementation follows an incremental approach, starting with core API integration, then adding member management, and finally implementing comprehensive testing to validate all correctness properties.

---

## Tasks

- [ ] 1. Set up project structure and verify backend API endpoints
  - Verify GET /api/groups endpoint returns all groups with proper authentication
  - Verify POST /api/groups endpoint creates groups correctly
  - Verify POST /api/groups/:id/members endpoint adds members to groups
  - Verify PATCH /api/groups/:id/members/:userId/role endpoint assigns roles
  - Document API response formats and error codes
  - _Requirements: 1.1, 10.1, 10.2, 10.3, 10.5_

- [ ] 2. Implement group fetching from backend API
  - [ ] 2.1 Create fetchGroups() function in GroupsPage component
    - Retrieve authentication token from localStorage
    - Make GET request to /api/groups with Bearer token in Authorization header
    - Handle successful response by updating groups state with fetched data
    - Handle errors by logging to console and setting groups to empty array
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ] 2.2 Add useEffect hook to fetch groups on component mount
    - Call fetchGroups() when component mounts
    - Ensure fetch only occurs when user is authenticated
    - Set up proper dependency array to prevent infinite loops
    - _Requirements: 1.1, 1.4, 10.1, 10.2_

  - [ ]* 2.3 Write property test for groups visibility across users
    - **Property 1: Groups Visibility Across Users**
    - **Validates: Requirements 2.1, 2.2, 2.3**
    - Test that groups created by one user are visible to all authenticated users
    - Test that all public groups are returned by GET /api/groups
    - Test that groups list is consistent across multiple fetch calls

- [ ] 3. Replace mock data with real API data
  - [ ] 3.1 Remove MOCK_GROUPS constant from GroupsPage component
    - Delete the hardcoded MOCK_GROUPS array
    - Ensure no references to mock data remain in component logic
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 3.2 Update groups state initialization to use empty array
    - Change initial groups state from MOCK_GROUPS to []
    - Verify groups are populated only from API fetch
    - _Requirements: 1.2, 2.1_

  - [ ]* 3.3 Write unit tests for groups state initialization
    - Test that groups state starts as empty array
    - Test that groups state is populated after successful fetch
    - Test that groups state remains empty if fetch fails
    - _Requirements: 1.2, 1.3_

- [ ] 4. Implement complete form state reset after group creation
  - [ ] 4.1 Update resetCreateGroupModal() function to reset ALL form state
    - Reset groupName to empty string
    - Reset groupDescription to empty string
    - Reset groupType to "CLUB"
    - Reset joinPolicy to "PUBLIC"
    - Reset messagePermission to "everyone"
    - Reset assignAsAdmin to false (CRITICAL for preventing duplicate admin assignments)
    - Reset memberSearch to empty string
    - Reset memberResults to empty array
    - Reset invitedMembers to empty array (CRITICAL for preventing duplicate members)
    - Reset groupCreationError to null
    - Reset errorContext to null
    - Close the create group modal
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 4.1, 5.1, 5.3_

  - [ ] 4.2 Ensure resetCreateGroupModal() is called after successful group creation
    - Call resetCreateGroupModal() after all members are added and roles assigned
    - Verify form state is completely reset before modal closes
    - Ensure reset happens AFTER local UI state is updated with new group
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

  - [ ]* 4.3 Write property test for complete state reset
    - **Property 2: Complete State Reset After Group Creation**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10**
    - Test that all form state variables are reset to initial values
    - Test that form state is clean when creating multiple groups in sequence
    - Test that no form state from first group appears in second group

- [ ] 5. Implement member addition with duplicate prevention
  - [ ] 5.1 Update handleCreateGroup() to add invited members to group
    - After group creation, iterate through invitedMembers array
    - For each member, make POST request to /api/groups/:id/members with userId
    - Include Bearer token in Authorization header
    - Continue processing other members even if one fails
    - Log member-specific errors but don't stop group creation
    - _Requirements: 9.1, 9.2, 9.3, 11.1, 11.2, 11.3_

  - [ ] 5.2 Implement admin role assignment when checkbox is checked
    - After adding each member, check if assignAsAdmin is true
    - If true, find Admin role in group.roles array
    - Make PATCH request to /api/groups/:id/members/:userId/role with roleId
    - Include Bearer token in Authorization header
    - Continue with other members if role assignment fails
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ] 5.3 Ensure invitedMembers array is cleared after group creation
    - Verify invitedMembers is reset to empty array in resetCreateGroupModal()
    - Test that members from first group don't appear in second group
    - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.3_

  - [ ]* 5.4 Write property test for member uniqueness
    - **Property 3: Member Uniqueness in Groups**
    - **Validates: Requirements 4.4, 4.5**
    - Test that same user cannot be added to group twice
    - Test that ALREADY_MEMBER error is returned for duplicate additions
    - Test that member count is correct after additions

- [ ] 6. Implement admin role assignment validation
  - [ ] 6.1 Verify assignAsAdmin checkbox state during group creation
    - Check assignAsAdmin value before assigning roles
    - Only assign Admin role if assignAsAdmin is true
    - Skip role assignment if assignAsAdmin is false
    - _Requirements: 5.2, 5.4, 5.5, 8.1, 8.2_

  - [ ] 6.2 Ensure assignAsAdmin is reset to false after group creation
    - Verify assignAsAdmin is reset in resetCreateGroupModal()
    - Test that checkbox is unchecked when creating second group
    - _Requirements: 5.1, 5.3_

  - [ ]* 6.3 Write property test for admin role assignment
    - **Property 4: Admin Role Assignment Based on Checkbox State**
    - **Validates: Requirements 5.2, 5.4, 5.5, 8.1, 8.2**
    - Test that members get Admin role when checkbox is checked
    - Test that members don't get Admin role when checkbox is unchecked
    - Test that role assignment works correctly for multiple members

- [ ] 7. Implement new group display in list
  - [ ] 7.1 Update groups state with newly created group
    - After successful group creation and member addition, add group to groups state
    - Add new group at the beginning of the list (newest first)
    - Include all group details: name, description, member count, type
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 13.1_

  - [ ] 7.2 Format new group data for UI display
    - Map backend group response to UI group format
    - Extract group ID, name, description, member count
    - Generate gradient colors for avatar
    - Set initial message and timestamp
    - _Requirements: 6.1, 6.2, 6.3, 6.5_

  - [ ]* 7.3 Write unit tests for new group display
    - Test that new group appears at top of list
    - Test that all group details are displayed correctly
    - Test that multiple groups maintain correct order
    - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [ ] 8. Implement comprehensive error handling
  - [ ] 8.1 Handle group creation errors gracefully
    - Extract error message from response.data.message or response.data.error
    - Log full error details including status, message, and context
    - Display user-friendly error message in UI
    - Keep form state intact (don't reset on error)
    - Keep modal open so user can retry
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 15.1, 15.2, 15.3_

  - [ ] 8.2 Handle member addition errors without stopping group creation
    - Catch errors for individual member additions
    - Log member-specific error details
    - Display error message indicating which member failed
    - Continue processing remaining members
    - _Requirements: 7.5, 7.6, 8.5, 11.3_

  - [ ] 8.3 Handle API errors for role assignment
    - Catch errors when assigning admin roles
    - Log error details but continue with other members
    - Display error message but don't prevent group creation
    - _Requirements: 8.5_

  - [ ] 8.4 Implement error recovery mechanism
    - Allow user to retry failed operations
    - Preserve form state so user doesn't lose input
    - Clear error messages when user retries
    - _Requirements: 7.7, 15.4, 15.5_

  - [ ]* 8.5 Write unit tests for error handling
    - Test error message extraction from various response formats
    - Test that form state is preserved on error
    - Test that modal stays open on error
    - Test that user can retry after error
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 9. Implement group name validation
  - [ ] 9.1 Add validation before group creation
    - Check if groupName is empty or contains only whitespace
    - Prevent group creation if validation fails
    - Display validation error message to user
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [ ] 9.2 Improve validation error messaging
    - Provide clear, actionable error messages
    - Indicate what the user needs to do to fix the error
    - Allow user to correct and retry
    - _Requirements: 12.4, 12.5_

  - [ ]* 9.3 Write unit tests for group name validation
    - Test that empty group name is rejected
    - Test that whitespace-only group name is rejected
    - Test that valid group name is accepted
    - Test that error message is displayed for invalid names
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 10. Implement support for group creation without members
  - [ ] 10.1 Allow group creation with empty invitedMembers list
    - Skip member addition loop if invitedMembers is empty
    - Create group successfully with only creator as member
    - Display group in list with member count of 1
    - _Requirements: 14.1, 14.2, 14.3, 14.5_

  - [ ] 10.2 Verify member count reflects creator-only groups
    - Ensure member count is 1 when no members are invited
    - Update member count when members are added later
    - _Requirements: 14.4, 14.5_

  - [ ]* 10.3 Write unit tests for group creation without members
    - Test that group is created with empty invitedMembers
    - Test that member count is 1 for creator-only groups
    - Test that group displays correctly in list
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 11. Implement group list state consistency
  - [ ] 11.1 Maintain group list order (newest first)
    - Ensure new groups are added at the beginning of the list
    - Preserve order when updating existing groups
    - Sort groups by creation date in descending order
    - _Requirements: 13.1, 13.2, 13.3_

  - [ ] 11.2 Prevent loss of existing groups during updates
    - Use immutable state updates to preserve existing groups
    - Verify all groups remain in state after updates
    - _Requirements: 13.4_

  - [ ] 11.3 Preserve groups state across component re-renders
    - Ensure groups state is not reset on re-renders
    - Maintain state consistency throughout component lifecycle
    - _Requirements: 13.5_

  - [ ]* 11.4 Write unit tests for group list state consistency
    - Test that groups maintain correct order
    - Test that existing groups are not lost during updates
    - Test that state persists across re-renders
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 12. Checkpoint - Verify core functionality
  - Ensure all tests pass for group fetching, creation, and member management
  - Verify groups are visible across different user accounts
  - Verify form state is completely reset after group creation
  - Verify no duplicate members are added across multiple group creations
  - Ask the user if questions arise

- [ ] 13. Implement property-based tests for correctness properties
  - [ ] 13.1 Write property test for groups visibility across users
    - **Property 1: Groups Visibility Across Users**
    - **Validates: Requirements 2.1, 2.2, 2.3**
    - Generate random groups and verify all authenticated users can fetch them
    - Test with various group types and configurations

  - [ ] 13.2 Write property test for complete state reset
    - **Property 2: Complete State Reset After Group Creation**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10**
    - Generate random form states and verify complete reset after creation
    - Test with various combinations of form values

  - [ ] 13.3 Write property test for member uniqueness
    - **Property 3: Member Uniqueness in Groups**
    - **Validates: Requirements 4.4, 4.5**
    - Generate random member lists and verify no duplicates in groups
    - Test with various member combinations

  - [ ] 13.4 Write property test for admin role assignment
    - **Property 4: Admin Role Assignment Based on Checkbox State**
    - **Validates: Requirements 5.2, 5.4, 5.5, 8.1, 8.2**
    - Generate random checkbox states and verify correct role assignments
    - Test with various member and role combinations

  - [ ] 13.5 Write property test for error recovery
    - **Property 5: Error Recovery During Member Addition**
    - **Validates: Requirements 7.5, 8.5, 11.3**
    - Generate random error scenarios and verify group creation continues
    - Test that other members are still added when one fails

  - [ ] 13.6 Write property test for form state isolation
    - **Property 6: Form State Isolation Between Group Creations**
    - **Validates: Requirements 4.1, 4.2, 5.1, 5.3**
    - Generate random form states for multiple group creations
    - Verify no state leakage between creations

  - [ ] 13.7 Write property test for new group display
    - **Property 7: New Groups Appear Immediately in List**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.5**
    - Generate random groups and verify they appear in list immediately
    - Test with various group configurations

  - [ ] 13.8 Write property test for group fetching with authentication
    - **Property 8: Group Fetching with Authentication**
    - **Validates: Requirements 1.1, 1.2, 1.4, 10.1, 10.2, 10.3, 10.5**
    - Generate random authentication states and verify correct fetch behavior
    - Test with valid and invalid tokens

  - [ ] 13.9 Write property test for multiple members addition
    - **Property 9: Multiple Members Addition**
    - **Validates: Requirements 9.1, 9.4, 9.5, 11.1, 11.4**
    - Generate random member lists and verify all are added correctly
    - Test with various member counts

  - [ ] 13.10 Write property test for group name validation
    - **Property 10: Group Name Validation**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4**
    - Generate random group names and verify validation works correctly
    - Test with empty, whitespace, and valid names

  - [ ] 13.11 Write property test for group list state consistency
    - **Property 11: Group List State Consistency**
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5**
    - Generate random group operations and verify state consistency
    - Test with various operation sequences

  - [ ] 13.12 Write property test for group creation without members
    - **Property 12: Group Creation Without Members**
    - **Validates: Requirements 14.1, 14.2, 14.3, 14.5**
    - Generate random empty member lists and verify group creation
    - Test member count for creator-only groups

  - [ ] 13.13 Write property test for error handling and recovery
    - **Property 13: Error Handling and Recovery**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.6, 7.7, 15.1, 15.2, 15.3, 15.4, 15.5**
    - Generate random error scenarios and verify proper handling
    - Test error message display and recovery mechanisms

  - [ ] 13.14 Write property test for API endpoint usage
    - **Property 14: API Endpoint Usage**
    - **Validates: Requirements 8.3, 8.4, 9.2, 9.3**
    - Verify correct endpoints are called for each operation
    - Test with various operation sequences

  - [ ] 13.15 Write property test for member count updates
    - **Property 15: Member Count Updates**
    - **Validates: Requirements 14.4, 14.5**
    - Generate random member additions and verify count updates
    - Test with various member counts

- [ ] 14. Implement integration tests
  - [ ] 14.1 Test group creation flow end-to-end
    - Create group with multiple members and admin assignment
    - Verify group appears in list for all users
    - Verify members are added with correct roles
    - _Requirements: 1.1, 6.1, 9.1, 11.1_

  - [ ] 14.2 Test multiple group creation sequence
    - Create first group with members
    - Verify form state is clean for second group
    - Create second group and verify no members from first group appear
    - _Requirements: 4.1, 4.2, 5.1, 5.3_

  - [ ] 14.3 Test error scenarios and recovery
    - Simulate API errors during group creation
    - Verify error messages are displayed
    - Verify user can retry after error
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ] 14.4 Test group visibility across user accounts
    - Create group with User A
    - Fetch groups with User B
    - Verify User B can see group created by User A
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 14.5 Test member addition with various scenarios
    - Add single member to group
    - Add multiple members to group
    - Add members with admin role assignment
    - Verify all members are added correctly
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 15. Final checkpoint - Ensure all tests pass
  - Ensure all unit tests pass
  - Ensure all property-based tests pass
  - Ensure all integration tests pass
  - Verify all correctness properties are validated
  - Ask the user if questions arise

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP, but are recommended for comprehensive validation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation of core functionality
- Property tests validate universal correctness properties defined in the design
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end workflows
- All code examples use JavaScript (React for frontend, Node.js/Express for backend)
- Error handling is critical throughout to ensure graceful recovery
- State management must be precise to prevent duplicate members and admin assignments
- API authentication must be verified on every request

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "3.1", "3.2"] },
    { "id": 2, "tasks": ["2.3", "3.3", "4.1", "4.2"] },
    { "id": 3, "tasks": ["4.3", "5.1", "5.2", "5.3"] },
    { "id": 4, "tasks": ["5.4", "6.1", "6.2"] },
    { "id": 5, "tasks": ["6.3", "7.1", "7.2"] },
    { "id": 6, "tasks": ["7.3", "8.1", "8.2", "8.3", "8.4"] },
    { "id": 7, "tasks": ["8.5", "9.1", "9.2"] },
    { "id": 8, "tasks": ["9.3", "10.1", "10.2"] },
    { "id": 9, "tasks": ["10.3", "11.1", "11.2", "11.3"] },
    { "id": 10, "tasks": ["11.4", "13.1", "13.2", "13.3", "13.4", "13.5", "13.6", "13.7", "13.8", "13.9", "13.10", "13.11", "13.12", "13.13", "13.14", "13.15"] },
    { "id": 11, "tasks": ["14.1", "14.2", "14.3", "14.4", "14.5"] }
  ]
}
```

