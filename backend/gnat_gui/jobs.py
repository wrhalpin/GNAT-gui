"""Register all gnat.jobs handlers for this application.

The ``gnat`` core library is an editable/optional install (see CLAUDE.md). When it
is absent — for example in a CI unit-test image that does not vendor GNAT — importing
this module must not crash app startup. We fall back to a no-op ``job`` decorator so
the handler functions are still defined; real registration only happens when the
``gnat.jobs`` registry is importable.
"""
from collections.abc import Callable
from typing import Any

try:
    from gnat.jobs import job  # type: ignore[import]

    GNAT_AVAILABLE = True
except ModuleNotFoundError:  # pragma: no cover - exercised only without the gnat lib
    GNAT_AVAILABLE = False

    def job(name: str) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
        def decorator(fn: Callable[..., Any]) -> Callable[..., Any]:
            return fn

        return decorator


@job("build_investigation")
def build_investigation_job(payload: dict, progress_cb, cancel) -> dict:
    from gnat.investigations.builder import InvestigationBuilder  # type: ignore[import]
    builder = InvestigationBuilder(seeds=payload["seeds"])
    result = builder.build_with_progress(lambda p, msg: progress_cb(p, msg))
    return result.to_dict()


@job("expand_node")
def expand_node_job(payload: dict, progress_cb, cancel) -> dict:
    from gnat.analyst_services.investigations import InvestigationsService  # type: ignore[import]
    svc = InvestigationsService()
    result = svc.expand_node(
        payload["investigation_id"], payload["node_id"],
        progress_callback=lambda p, msg: progress_cb(p, msg),
    )
    return result.to_dict()


@job("gap_detection")
def gap_detection_job(payload: dict, progress_cb, cancel) -> dict:
    from gnat.analysis.copilot import GapDetector  # type: ignore[import]
    detector = GapDetector()
    gaps = detector.detect_with_progress(
        hypothesis=payload["hypothesis"],
        investigation=payload["investigation_id"],
        progress_callback=lambda p, msg: progress_cb(p, msg),
    )
    return {"gaps": [g.to_dict() for g in gaps]}


@job("report_draft")
def report_draft_job(payload: dict, progress_cb, cancel) -> dict:
    from gnat.analysis.copilot.drafting import ReportDraftingAssistant  # type: ignore[import]
    import os
    from anthropic import Anthropic  # type: ignore[import]
    client = Anthropic(api_key=os.environ.get("GNAT_GUI_LLM_API_KEY", ""))
    assistant = ReportDraftingAssistant(llm_client=client)
    result = assistant.draft_with_progress(
        report=payload["report"],
        progress_callback=lambda p, msg: progress_cb(p, msg),
    )
    return result.to_dict()


@job("test_rule")
def test_rule_job(payload: dict, progress_cb, cancel) -> dict:
    from gnat.analyst_services.rules import RulesService  # type: ignore[import]
    svc = RulesService()
    result = svc.test_rule(
        payload["rule_id"],
        payload["fixture"],
        progress_callback=lambda p, msg: progress_cb(p, msg),
    )
    return result.to_dict()
