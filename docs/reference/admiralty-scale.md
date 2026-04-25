# NATO Admiralty Scale reference

GNAT-gui uses the NATO Admiralty Scale (also known as the Admiralty System or AI Code) to rate hypothesis confidence. It combines two independent dimensions: **source reliability** and **information credibility**.

A hypothesis score is written as a letter–number pair, e.g. **B3**, **C2**, **A1**.

---

## Source reliability (letter, A–F)

Rates the track record and trustworthiness of the source providing the information.

| Code | Label | Criteria |
|---|---|---|
| **A** | Reliable | No doubt about authenticity, trustworthiness, or competency; history of complete reliability |
| **B** | Usually reliable | Minor doubts; history of mostly valid information |
| **C** | Fairly reliable | Doubts about authenticity or competency; provided valid information in the past |
| **D** | Not usually reliable | Significant doubts; provided valid information only occasionally |
| **E** | Unreliable | Lacking in authenticity, trustworthiness, and competency; history of invalid information |
| **F** | Reliability cannot be judged | Insufficient information to evaluate; first-time source or insufficient track record |

---

## Information credibility (number, 1–6)

Rates the plausibility of the specific piece of information, independent of the source.

| Code | Label | Criteria |
|---|---|---|
| **1** | Confirmed | Confirmed by other independent sources; consistent with other information on the subject |
| **2** | Probably true | Not confirmed; consistent with other information on the subject |
| **3** | Possibly true | Not confirmed; agrees with some other information on the subject |
| **4** | Doubtful | Not confirmed; inconsistent with other information on the subject |
| **5** | Improbable | Not confirmed; contradicted by other information on the subject |
| **6** | Truth cannot be judged | No basis exists for evaluating the validity of the information |

---

## Combined rating

A hypothesis scored **B3** means:
- Source is *usually reliable* (B)
- Information is *possibly true* (3)

The UI renders this as a badge (e.g. `B3`) colour-coded by relative strength:

| Rating range | Colour |
|---|---|
| A1, A2, B1, B2 | Green (high confidence) |
| A3, B3, C1, C2 | Yellow (moderate confidence) |
| C3, D1–D3, E1–E3 | Orange (low confidence) |
| D4–F6 | Red (very low / cannot judge) |

---

## Using the scale in GNAT-gui

When creating or editing a hypothesis in the Analysis module, you select the source reliability (A–F) and information credibility (1–6) separately. The combined badge is computed and displayed on the hypothesis card.

The `confidence_above` rule predicate operates on the numeric credibility score normalised to 0.0–1.0:

| Credibility | Normalised value |
|---|---|
| 1 | 1.0 |
| 2 | 0.8 |
| 3 | 0.6 |
| 4 | 0.4 |
| 5 | 0.2 |
| 6 | 0.0 |

Source reliability is not currently mapped to the `confidence_above` predicate; it is displayed for human reference.
