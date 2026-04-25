# Rules Builder Module Spec

## Purpose

Lets analysts author, test, and promote detection rules in three engines: Hy/Lisp, YAML declarative DSL, and Prolog logic.

## Rule engines

| Engine | File extension | Use case |
|--------|---------------|----------|
| Hy | `.hy` | Lisp-style programmatic rules |
| YAML | `.yml` | Declarative rules; visual form builder available |
| Prolog | `.pl` | Logic rules with relational reasoning |

## 26 helper predicates

Available across all engines via the predicate palette: `has_indicator`, `has_ttp`, `has_malware`, `has_threat_actor`, `has_campaign`, `has_domain`, `has_ip`, `has_hash`, `has_email`, `has_url`, `has_cve`, `has_platform`, `tlp_at_most`, `confidence_above`, `observed_after`, `observed_before`, `stix_type`, `stix_rel`, `count_indicators`, `all_of`, `any_of`, `none_of`, `not`, `hypothesis_has_tag`, `investigation_status`, `audit_ceiling`.

## Backend routes

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/rules` | `rule.read` | List rules |
| POST | `/api/rules` | `rule.create` | Create rule |
| GET | `/api/rules/{id}` | `rule.read` | Get rule |
| PUT | `/api/rules/{id}` | `rule.update.own` | Update rule content |
| DELETE | `/api/rules/{id}` | `rule.update.own` | Delete rule |
| POST | `/api/rules/{id}/test` | `rule.test` | Submit test job → `{ job_id }` |
| GET | `/api/rules/{id}/audit-trail` | `rule.read` | Get audit trail |
| POST | `/api/rules/{id}/promote` | `rule.publish` | Promote to shared scope |

## Test runner

`POST /api/rules/{id}/test` accepts `{ fixture: EvidenceJSON }` and returns `{ job_id }`. The job runs the rule against the fixture and emits `ProgressEvent` per evaluation step, then a `ResultEvent` containing firing/non-firing result and audit trail detail.

## Promotion workflow

1. Analyst creates rule in `personal` scope
2. Analyst tests rule against one or more fixtures
3. Analyst (or senior_analyst) submits promote request
4. Rule moves to `shared` scope; promotion is recorded in audit log
5. All analysts can now use the rule in their investigations

## Frontend pages

- `/rules` — filterable list by engine, scope, status
- `/rules/:id` — tabbed view: Monaco editor + predicate palette | test runner panel | audit trail
