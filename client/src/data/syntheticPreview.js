// SYNTHETIC PREVIEW DATA - 100% fictional, for UI demonstration only.
// Rendered solely when the dashboard URL contains ?preview=synthetic.
// Never fetched from, written to, or mixed with live backend data.

export const syntheticPreviewCase = {
  id: "synthetic-preview-01",
  case_title: "State v. Arjun Mehta (Fictional) - Criminal Appeal",
  filing_index: "SYN/2023/0001-X",
  jurisdiction: "Court of Sessions, Rampur (fictional)",
  date_logged: "Synthetic sample",
  type: "Criminal Appeal (Homicide)",
  brief_summary:
    "SYNTHETIC SAMPLE - fictional appeal against conviction under Section 302 IPC (fictional events dated 2022-2023, so citations follow the law then in force). The prosecution rests on circumstantial evidence: last-seen witness testimony, recovery of a weapon on a disclosure statement, and medical evidence. The brief deliberately cites no forensic, fingerprint or DNA evidence. Matches the fictional test document TEST-FICTIONAL-01.",
  predicted_sections: [
    { section: "IPC 302 - Punishment for murder", confidence: 88 },
    { section: "Evidence Act s.27 - Discovery on disclosure", confidence: 74 },
    { section: "CrPC 374 - Appeals from convictions", confidence: 61 },
  ],
  legal_sections: ["IPC 302", "Evidence Act s.27", "CrPC 374"],
  similar_cases: [
    {
      case_title: "Fictional sample: circumstantial conviction set aside",
      similarity_score: 0.87,
      summary:
        "Synthetic match - chain of circumstances held incomplete where forensic links between weapon and deceased were missing.",
    },
    {
      case_title: "Fictional sample: recovery on disclosure doubted",
      similarity_score: 0.79,
      summary:
        "Synthetic match - seizure witnesses not examined; the recovery was given reduced evidentiary weight.",
    },
    {
      case_title: "Fictional sample: last-seen plus medical corroboration",
      similarity_score: 0.72,
      summary:
        "Synthetic match - conviction sustained where last-seen testimony and medical evidence converged.",
    },
  ],
  evidence_mapping: [],
  missing_evidence: [
    { evidence: "Forensic / serological report linking the recovered weapon to the deceased" },
    { evidence: "Fingerprint analysis on the recovered weapon" },
    { evidence: "DNA profiling of the blood samples" },
    { evidence: "Call-detail and location records for the night of the incident" },
  ],
  recommended_actions: [
    "Secure missing evidentiary item: forensic linkage report (synthetic sample action)",
    "Corroborate the last-seen timeline against medical time-of-death (synthetic sample action)",
    "Examine independent seizure witnesses for the recovery (synthetic sample action)",
  ],
  analytics: {
    outcome_analytics: [
      { outcome: "Conviction upheld (synthetic sample rows)", percentage: 52 },
      { outcome: "Acquittal / benefit of doubt (synthetic sample rows)", percentage: 34 },
      { outcome: "Remand for fresh trial (synthetic sample rows)", percentage: 14 },
    ],
    relief_analytics: [
      { relief: "Bail pending appeal (synthetic sample rows)", percentage: 41 },
      { relief: "Sentence suspended during appeal (synthetic sample rows)", percentage: 33 },
      { relief: "Custody continued (synthetic sample rows)", percentage: 26 },
    ],
  },
  indexed_files: [
    {
      id: "syn-file-1",
      name: "TEST-FICTIONAL-01-criminal-appeal.pdf",
      size: 48200,
      uploadedAt: "Synthetic sample",
      status: "SYNTHETIC SAMPLE",
    },
  ],
};
