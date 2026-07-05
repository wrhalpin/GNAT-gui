from enum import StrEnum


class AuditAction(StrEnum):
    LOGIN = "auth.login"
    LOGOUT = "auth.logout"
    LOGIN_FAILED = "auth.login_failed"
    PERMISSION_DENIED = "auth.permission_denied"

    INVESTIGATION_CREATED = "investigation.created"
    INVESTIGATION_UPDATED = "investigation.updated"
    INVESTIGATION_DELETED = "investigation.deleted"
    INVESTIGATION_MATERIALIZED = "investigation.materialized"

    HYPOTHESIS_CREATED = "hypothesis.created"
    HYPOTHESIS_UPDATED = "hypothesis.updated"

    NOTE_CREATED = "note.created"

    RULE_CREATED = "rule.created"
    RULE_UPDATED = "rule.updated"
    RULE_DELETED = "rule.deleted"
    RULE_TESTED = "rule.tested"
    RULE_PROMOTED = "rule.promoted"

    GAP_DETECTION_RUN = "analysis.gap_detection_run"

    REPORT_CREATED = "report.created"
    REPORT_PUBLISHED = "report.published"

    USER_CREATED = "admin.user_created"
    USER_UPDATED = "admin.user_updated"
    USER_DEACTIVATED = "admin.user_deactivated"
