# Review Story - Workflow Instructions

```xml
<critical>The workflow execution engine is governed by: {project-root}/bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {installed_path}/workflow.yaml</critical>
<critical>Communicate all responses in {communication_language} and language MUST be tailored to {user_skill_level}</critical>
<critical>Generate all documents in {document_output_language}</critical>
<critical>Only modify the story file in these areas: Tasks/Subtasks checkboxes, Dev Agent Record (Debug Log, Completion Notes), File List, Change Log, and Status</critical>
<critical>Execute ALL steps in exact order; do NOT skip steps</critical>

<workflow>

  <step n="1" goal="Find story ready for review and load it">
    <action>Load the FULL file: {{output_folder}}/sprint-status.yaml</action>
    <action>Read ALL lines from beginning to end - do not skip any content</action>
    <action>Parse the development_status section completely to understand story order</action>

    <action>Find the FIRST story (by reading in order from top to bottom) where:
      - Key matches pattern: number-number-name (e.g., "1-2-user-auth")
      - NOT an epic key (epic-X) or retrospective (epic-X-retrospective)
      - Status value equals "review"
    </action>

    <check if="no review stories found">
      <output>📋 No stories found in "review" status in sprint-status.yaml
**Options:**
1. Check {output-folder}/sprint-status.yaml to see current story statuses
2. Run dev-story workflow to implement stories and mark them for review
      </output>
      <action>HALT</action>
    </check>

    <action>Store the found story_key (e.g., "1-2-user-authentication") for later status updates</action>
    <action>Find matching story file in {{story_dir}} using story_key pattern: {{story_key}}.md</action>
    <action>Read COMPLETE story file from discovered path</action>

    <action>Parse sections: Story, Acceptance Criteria, Tasks/Subtasks, Dev Notes, Dev Agent Record, File List, Change Log, Status</action>

    <action>Check if context file exists at: {{story_dir}}/{{story_key}}.context.xml</action>
    <check if="context file exists">
      <action>Read COMPLETE context file</action>
      <action>Parse all sections: story details, artifacts (docs, code, dependencies), interfaces, constraints, tests</action>
      <action>Use this context to inform review decisions</action>
    </check>

    <action if="story file inaccessible">HALT: "Cannot review story without access to story file"</action>
  </step>

  <step n="2" goal="Verify implementation completeness">
    <action>Check that ALL tasks and subtasks are marked [x] (completed)</action>
    <check if="any incomplete tasks found">
      <output>❌ Story cannot be reviewed - incomplete tasks detected:
{{incomplete_tasks_list}}

All tasks must be completed before review.
      </output>
      <action>HALT</action>
    </check>

    <action>Verify File List includes all changed files</action>
    <check if="File List is empty or incomplete">
      <output>⚠️ File List appears incomplete. Review should verify all changed files are documented.</output>
    </check>

    <action>Check Dev Agent Record for completion notes</action>
    <check if="no completion notes found">
      <output>⚠️ No completion notes found in Dev Agent Record. Implementation summary should be provided.</output>
    </check>
  </step>

  <step n="3" goal="Validate acceptance criteria">
    <action>Read all Acceptance Criteria from story</action>
    <action>For each AC, verify through code inspection and testing that it is satisfied</action>

    <check if="any AC not satisfied">
      <output>❌ Acceptance Criteria validation failed:
{{unsatisfied_ac_list}}

These ACs must be satisfied before story can be approved.
      </output>
      <action>Add review follow-up tasks for unsatisfied ACs</action>
      <action>Request changes to address unsatisfied criteria</action>
    </check>
  </step>

  <step n="4" goal="Code quality review">
    <action>Review all implemented code files listed in File List</action>
    <action>Check for:
      - TypeScript strict mode compliance
      - ESLint compliance (no errors, no eslint-disable)
      - Proper formatting (Prettier)
      - Code organization and structure
      - Error handling patterns
      - Test coverage and quality
    </action>

    <check if="code quality issues found">
      <output>❌ Code quality issues detected:
{{quality_issues_list}}

These issues must be addressed before story can be approved.
      </output>
      <action>Add review follow-up tasks for quality issues</action>
    </check>
  </step>

  <step n="5" goal="Verify Quality Gates Enforcement">
    <action>Scan implemented code for eslint-disable comments</action>
    <action>Scan implemented code for @ts-ignore/@ts-expect-error comments</action>
    <check if="quality anti-patterns found">
      <output>❌ QUALITY VIOLATIONS DETECTED:
      - eslint-disable comments found: {{count}}
      - @ts-ignore/@ts-expect-error found: {{count}}

    These violate project quality standards. All quality issues must be fixed.
      </output>
      <action>Request fixes for all quality violations</action>
    </check>

    <action>Verify TypeScript compilation was run with 0 errors</action>
    <action>Verify ESLint validation was run with 0 errors</action>
    <action>Verify all tests pass with 100% success rate</action>
  </step>

  <step n="6" goal="Review decision and documentation">
    <action>Evaluate overall story implementation quality</action>
    <action>Make review decision: Approve | Changes Requested | Blocked</action>

    <check if="decision = Approve">
      <output>✅ **STORY APPROVED**

**Story**: {{story_key}} - {{story_title}}
**Review Date**: {{current_date}}
**Decision**: Approve

**Summary**:
All acceptance criteria satisfied, code quality meets standards, ready for merge.

**Next Steps**:
- Story can be merged to main branch
- Update sprint status to "done"
- Consider deployment if applicable
      </output>

      <action>Add "Senior Developer Review (AI)" section with approval details</action>
      <action>Update story Status to: approved</action>
      <action>Update sprint-status.yaml: development_status[{{story_key}}] = "done"</action>
    </check>

    <check if="decision = Changes Requested">
      <output>🔄 **CHANGES REQUESTED**

**Story**: {{story_key}} - {{story_title}}
**Review Date**: {{current_date}}
**Decision**: Changes Requested

**Issues Found**:
{{issues_summary}}

**Required Changes**:
{{required_changes_list}}

**Next Steps**:
- Address all review follow-up tasks
- Re-run quality gates (TypeScript 0, ESLint 0, Tests 100%)
- Submit for re-review
      </output>

      <action>Add "Senior Developer Review (AI)" section with changes requested</action>
      <action>Add "Review Follow-ups (AI)" subsection with specific tasks</action>
      <action>Update story Status to: changes-requested</action>
      <action>Update sprint-status.yaml: development_status[{{story_key}}] = "in-progress"</action>
    </check>

    <check if="decision = Blocked">
      <output>🚫 **STORY BLOCKED**

**Story**: {{story_key}} - {{story_title}}
**Review Date**: {{current_date}}
**Decision**: Blocked

**Blocking Issues**:
{{blocking_issues_list}}

**Resolution Required**:
{{resolution_steps}}

**Next Steps**:
- Major rework required
- Consider architectural review
- Re-submit for review after complete rework
      </output>

      <action>Add "Senior Developer Review (AI)" section with blocking details</action>
      <action>Add "Review Follow-ups (AI)" subsection with major tasks</action>
      <action>Update story Status to: blocked</action>
      <action>Update sprint-status.yaml: development_status[{{story_key}}] = "blocked"</action>
    </check>

    <action>Save story file with review documentation</action>
    <action>Save sprint-status.yaml with updated status</action>
  </step>

  <step n="7" goal="Completion communication">
    <action>Communicate review decision to {user_name}</action>
    <action>Provide summary of findings and next steps</action>
    <action>Offer to answer questions about review decisions</action>

    <check if="user requests clarification">
      <action>Provide detailed explanations of review findings</action>
      <action>Offer suggestions for addressing issues</action>
    </check>
  </step>

</workflow>
```