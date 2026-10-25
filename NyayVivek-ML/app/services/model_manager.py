import os
import re
import pandas as pd
import numpy as np
import faiss
import logging
from collections import Counter, defaultdict
from sentence_transformers import SentenceTransformer
from app.config import DATASET_PATH, EMBEDDINGS_PATH, FAISS_INDEX_PATH

logger = logging.getLogger(__name__)

class ModelManager:
    """
    Singleton class to manage, load, and perform inference using ML assets.
    Loads models, FAISS indexes, and Excel datasets ONCE during system startup.
    """
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(ModelManager, cls).__new__(cls, *args, **kwargs)
            cls._instance._initialized = False
        return cls._instance

    def initialize(self):
        """
        Loads the required machine learning assets and datasets.
        This runs only once, ensuring high performance and memory efficiency.
        """
        if self._initialized:
            return

        logger.info("Initializing ModelManager and loading ML assets...")

        # 1. Load the Case dataset Registry (Excel)
        if not os.path.exists(DATASET_PATH):
            raise FileNotFoundError(f"Case dataset not found at: {DATASET_PATH}")
        
        logger.info(f"Loading Excel dataset from {DATASET_PATH}...")
        self.df = pd.read_excel(DATASET_PATH)

        # 2. Text Preprocessing & Field Concatenation
        # Concatenates diverse attributes to form a highly-dense semantic context string
        self.df['combined_text'] = (
            self.df['case_text'].fillna('') + ' ' +
            self.df['legal_sections'].fillna('') + ' ' +
            self.df['judge_observation'].fillna('') + ' ' +
            self.df['legal_keywords'].fillna('') + ' ' +
            self.df['sub_category'].fillna('')
        )
        self.df['combined_text'] = self.df['combined_text'].apply(self._clean_text)

        # 3. Load the SentenceTransformer Embeddings Model
        logger.info("Loading SentenceTransformer model ('all-MiniLM-L6-v2')...")
        self.model = SentenceTransformer('all-MiniLM-L6-v2')

        # 4. Load Saved Case Embeddings
        if not os.path.exists(EMBEDDINGS_PATH):
            raise FileNotFoundError(f"Case embeddings array not found at: {EMBEDDINGS_PATH}")
        logger.info(f"Loading case embeddings from {EMBEDDINGS_PATH}...")
        self.embeddings = np.load(EMBEDDINGS_PATH)

        # 5. Load Saved FAISS Index
        if not os.path.exists(FAISS_INDEX_PATH):
            raise FileNotFoundError(f"FAISS index file not found at: {FAISS_INDEX_PATH}")
        logger.info(f"Loading FAISS Index from {FAISS_INDEX_PATH}...")
        self.index = faiss.read_index(FAISS_INDEX_PATH)

        self._initialized = True
        logger.info("ModelManager initialized successfully. All ML assets cached in memory.")

    def _clean_text(self, text: str) -> str:
        """
        Cleans raw input text to normalize whitespace and remove noise.
        """
        text = str(text).lower()
        text = re.sub(r'\n', ' ', text)
        text = re.sub(r'[^a-zA-Z0-9 ]', '', text)
        text = re.sub(r'\s+', ' ', text)
        return text.strip()


    def _chunk_text(self, text: str, window_tokens: int = 200, overlap_tokens: int = 20) -> list:
        """
        Splits long merged case text into overlapping TOKEN windows using the
        model's own tokenizer, so every chunk re-tokenizes within the model's
        256 word-piece limit (200 content tokens + specials gives margin for
        legal names and multilingual text) and no content is silently truncated.
        Short texts return as a single chunk and behave exactly as before.
        """
        tokenizer = self.model.tokenizer
        token_ids = tokenizer(text, add_special_tokens=False)["input_ids"]
        if len(token_ids) + 2 <= self.model.max_seq_length:
            return [text]
        chunks = []
        step = window_tokens - overlap_tokens
        for start in range(0, len(token_ids), step):
            window = token_ids[start:start + window_tokens]
            chunks.append(tokenizer.decode(window, skip_special_tokens=True))
            if start + window_tokens >= len(token_ids):
                break
        return chunks

    def _normalize_law(self, law: str) -> str:
        """
        Standardizes legal sections / IPC abbreviations for high-quality comparisons.
        """
        law = str(law).upper().strip()
        law = law.replace("SECTION", "")
        law = law.replace("SECTIONS", "")
        law = law.replace("AND RELATED PROVISIONS", "")
        law = law.replace("IPC S", "IPC")
        law = law.replace("IPC SECTION", "IPC")
        law = re.sub(r'\s+', ' ', law)
        return law.strip()

    def _get_dominant_case_type(self, retrieved_indices: list) -> str:
        """
        Calculates the statistical majority case type among the nearest neighbors.
        """
        retrieved_types = []
        for idx in retrieved_indices:
            case_type = self.df.iloc[idx]["case_type"]
            retrieved_types.append(case_type)
        return Counter(retrieved_types).most_common(1)[0][0]

    def smart_retrieval(self, query: str, top_k: int = 5):
        """
        Model Flow:
        1. Splits the query into 256-token-sized chunks (single chunk for short
           queries, preserving original behavior exactly).
        2. Encodes chunks and executes a FAISS Euclidean search per chunk.
        3. Merges candidates across chunks keeping each case's best (lowest)
           distance, so long documents get complete coverage.
        4. Converts distances with the same 1/(1+d) metric and the same 0.45
           confidence threshold as before.
        """
        if not self._initialized:
            raise RuntimeWarning("ModelManager is not initialized yet. Call initialize() first.")

        chunks = self._chunk_text(query)
        query_embeddings = self.model.encode(chunks)

        # FAISS search on saved embeddings (one search per chunk)
        D, I = self.index.search(
            np.array(query_embeddings).astype('float32'),
            k=top_k
        )

        # Merge candidates across chunks: keep best distance per case
        best_distance = {}
        for chunk_row in range(len(chunks)):
            for dist, idx in zip(D[chunk_row], I[chunk_row]):
                if idx < 0:
                    continue
                if idx not in best_distance or dist < best_distance[idx]:
                    best_distance[idx] = dist

        # Rank merged candidates by best distance (same ordering as original)
        ranked = sorted(best_distance.items(), key=lambda kv: kv[1])[:top_k]

        retrieved_indices = []
        retrieved_scores = []

        # Convert L2 distances to cosine similarity metrics and filter
        for idx, score in ranked:
            similarity = 1 / (1 + score)
            if similarity >= 0.45:
                retrieved_indices.append(idx)
                retrieved_scores.append(float(similarity))

        if len(retrieved_indices) == 0:
            return None, None, None, None

        dominant_type = self._get_dominant_case_type([idx for idx, _ in ranked])

        return self.df, retrieved_indices, retrieved_scores, dominant_type

    def retrieve_similar_cases(self, query: str, top_k: int = 5) -> list:
        """
        Retrieves matching historical case records with similarity scores.
        """
        filtered_df, indices, scores, _ = self.smart_retrieval(query, top_k=top_k)
        if filtered_df is None:
            return []

        results = []
        for idx, score in zip(indices, scores):
            row = filtered_df.iloc[idx]
            results.append({
                "case_title": str(row["case_title"]) if "case_title" in row.index else "",
                "case_type": str(row["case_type"]) if "case_type" in row.index else "",
                "sub_category": str(row["sub_category"]) if "sub_category" in row.index else "",
                "legal_sections": str(row["legal_sections"]) if "legal_sections" in row.index else "",
                "judgment_outcome": str(row["judgment_outcome"]) if "judgment_outcome" in row.index else "",
                "judge_observation": str(row["judge_observation"]) if "judge_observation" in row.index else "",
                "similarity_score": round(float(score) * 100, 2),
                "case_text": str(row["case_text"]) if "case_text" in row.index else ""
            })
        return results

    def predict_legal_sections(self, query: str, top_k: int = 5) -> list:
        """
        Aggregates legal sections cited by matching historical cases to predict relevant statutes.
        """
        filtered_df, indices, _, _ = self.smart_retrieval(query, top_k=top_k)
        if filtered_df is None:
            return []

        all_sections = []
        for idx in indices:
            sections = str(filtered_df.iloc[idx]["legal_sections"])
            split_sections = sections.split(";")
            for sec in split_sections:
                sec = sec.strip()
                if sec:
                    all_sections.append(self._normalize_law(sec))

        section_counts = Counter(all_sections)
        total = sum(section_counts.values())

        results = []
        for sec, count in section_counts.items():
            confidence = round((count / total) * 100, 2)
            results.append({
                "section": sec,
                "confidence": confidence
            })

        results.sort(key=lambda x: x["confidence"], reverse=True)
        return results

    def dataset_evidence_law_mapping(self, query: str, top_k: int = 5) -> list:
        """
        Maps physical/digital evidence variables to the legal sections they support.
        """
        filtered_df, indices, _, _ = self.smart_retrieval(query, top_k=top_k)
        if filtered_df is None:
            return []

        evidence_map = defaultdict(list)
        for idx in indices:
            evidence_text = str(filtered_df.iloc[idx]["evidence_types"])
            legal_text = str(filtered_df.iloc[idx]["legal_sections"])
            evidence_list = evidence_text.split(',')
            law_list = legal_text.split(';')

            cleaned_laws = []
            for law in law_list:
                law = law.strip()
                if law and law.lower() != "nan":
                    cleaned_laws.append(self._normalize_law(law))

            for ev in evidence_list:
                ev = ev.strip().lower().capitalize()
                if ev:
                    evidence_map[ev].extend(cleaned_laws)

        results = []
        for evidence, laws in evidence_map.items():
            law_counts = Counter(laws)
            filtered_laws = [law for law, count in law_counts.items() if count >= 1]
            if not filtered_laws:
                continue

            results.append({
                "evidence": evidence,
                "laws": filtered_laws
            })
        return results

    def detect_missing_evidence(self, query: str, top_k: int = 5) -> list:
        """
        Performs audit checking to find missing items usually present in similar litigation.
        """
        filtered_df, indices, _, _ = self.smart_retrieval(query, top_k=top_k)
        if filtered_df is None:
            return []

        all_evidence = []
        for idx in indices:
            evidence_text = str(filtered_df.iloc[idx]["evidence_types"])
            evidence_list = evidence_text.split(',')
            for ev in evidence_list:
                ev = ev.strip().lower()
                if ev:
                    all_evidence.append(ev)

        evidence_counts = Counter(all_evidence)
        query_lower = query.lower()

        missing = []
        for evidence, count in evidence_counts.items():
            # If evidence type appears in at least 2 highly similar cases, but is absent in query
            if count >= 2 and evidence not in query_lower:
                missing.append({"evidence": evidence.capitalize()})

        unique_missing = []
        seen = set()
        for item in missing:
            if item["evidence"] not in seen:
                unique_missing.append(item)
                seen.add(item["evidence"])

        return unique_missing

    def judgment_pattern_analytics(self, query: str, top_k: int = 5) -> dict:
        """
        Compiles predictive percentage metrics regarding court outcomes and reliefs.
        """
        filtered_df, indices, _, dominant_type = self.smart_retrieval(query, top_k=top_k)
        if filtered_df is None:
            return {
                "case_type": "Unknown",
                "outcome_analytics": [],
                "relief_analytics": []
            }

        outcome_list = []
        relief_list = []

        for idx in indices:
            outcome = str(filtered_df.iloc[idx]["judgment_outcome"]).strip()
            if outcome and outcome.lower() != "nan":
                outcome_list.append(outcome)

            relief = str(filtered_df.iloc[idx]["interim_relief_or_custody_status"]).strip()
            if relief and relief.lower() != "nan":
                relief_list.append(relief)

        outcome_counts = Counter(outcome_list)
        relief_counts = Counter(relief_list)

        total_outcomes = sum(outcome_counts.values())
        total_reliefs = sum(relief_counts.values())

        outcome_results = []
        relief_results = []

        for outcome, count in outcome_counts.items():
            percentage = round((count / total_outcomes) * 100, 2) if total_outcomes else 0.0
            outcome_results.append({
                "outcome": outcome,
                "percentage": percentage
            })

        for relief, count in relief_counts.items():
            percentage = round((count / total_reliefs) * 100, 2) if total_reliefs else 0.0
            relief_results.append({
                "relief": relief,
                "percentage": percentage
            })

        outcome_results.sort(key=lambda x: x["percentage"], reverse=True)
        relief_results.sort(key=lambda x: x["percentage"], reverse=True)

        return {
            "case_type": dominant_type,
            "outcome_analytics": outcome_results,
            "relief_analytics": relief_results
        }

    def analyze_case(self, query: str) -> dict:
        """
        Master Inference Pipeline orchestrating multi-dimensional retrieval:
        - Retrieves similar matching cases.
        - Predicts likely legal IPC statutes.
        - Maps physical coordinates/evidence to specific laws.
        - Formulates checklists of missing evidentiary materials.
        - Evaluates historic judge tendencies/outcome analytics.
        """
        similar_cases = self.retrieve_similar_cases(query)
        predicted_sections = self.predict_legal_sections(query)
        evidence_mapping = self.dataset_evidence_law_mapping(query)
        missing_evidence = self.detect_missing_evidence(query)
        analytics = self.judgment_pattern_analytics(query)

        # Output contains predicted_sections under both predicted_sections and legal_sections
        # for backwards compatibility with Express backend/React frontend bindings.
        return {
            "predicted_sections": predicted_sections,
            "legal_sections": predicted_sections,
            "similar_cases": similar_cases,
            "evidence_mapping": evidence_mapping,
            "missing_evidence": missing_evidence,
            "analytics": analytics
        }
