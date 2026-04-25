from enum import StrEnum


class Permission(StrEnum):
    INVESTIGATION_CREATE = "investigation.create"
    INVESTIGATION_READ_OWN = "investigation.read.own"
    INVESTIGATION_READ_ANY = "investigation.read.any"
    INVESTIGATION_UPDATE_OWN = "investigation.update.own"
    INVESTIGATION_UPDATE_ANY = "investigation.update.any"
    INVESTIGATION_DELETE_OWN = "investigation.delete.own"
    INVESTIGATION_DELETE_ANY = "investigation.delete.any"
    INVESTIGATION_MATERIALIZE = "investigation.materialize"

    RULE_CREATE = "rule.create"
    RULE_READ = "rule.read"
    RULE_UPDATE_OWN = "rule.update.own"
    RULE_UPDATE_ANY = "rule.update.any"
    RULE_TEST = "rule.test"
    RULE_PUBLISH = "rule.publish"

    REPORT_CREATE = "report.create"
    REPORT_READ = "report.read"
    REPORT_PUBLISH = "report.publish"

    AUDIT_READ = "audit.read"
    ADMIN_USERS = "admin.users"
    ADMIN_ROLES = "admin.roles"


ROLE_PERMISSIONS: dict[str, list[str]] = {
    "viewer": [
        Permission.INVESTIGATION_READ_OWN,
        Permission.INVESTIGATION_READ_ANY,
        Permission.RULE_READ,
        Permission.REPORT_READ,
    ],
    "analyst": [
        Permission.INVESTIGATION_CREATE,
        Permission.INVESTIGATION_READ_OWN,
        Permission.INVESTIGATION_READ_ANY,
        Permission.INVESTIGATION_UPDATE_OWN,
        Permission.INVESTIGATION_DELETE_OWN,
        Permission.RULE_CREATE,
        Permission.RULE_READ,
        Permission.RULE_UPDATE_OWN,
        Permission.RULE_TEST,
        Permission.REPORT_CREATE,
        Permission.REPORT_READ,
    ],
    "senior_analyst": [
        Permission.INVESTIGATION_CREATE,
        Permission.INVESTIGATION_READ_OWN,
        Permission.INVESTIGATION_READ_ANY,
        Permission.INVESTIGATION_UPDATE_OWN,
        Permission.INVESTIGATION_UPDATE_ANY,
        Permission.INVESTIGATION_DELETE_OWN,
        Permission.INVESTIGATION_MATERIALIZE,
        Permission.RULE_CREATE,
        Permission.RULE_READ,
        Permission.RULE_UPDATE_OWN,
        Permission.RULE_UPDATE_ANY,
        Permission.RULE_TEST,
        Permission.RULE_PUBLISH,
        Permission.REPORT_CREATE,
        Permission.REPORT_READ,
        Permission.REPORT_PUBLISH,
    ],
    "admin": [p for p in Permission],
}
