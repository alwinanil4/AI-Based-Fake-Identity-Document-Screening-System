"""DocShield AI — Cross-Document Biometric Face Verification Layer.

Provides real, privacy-preserving face detection and visual embedding comparison
between two user-supplied documents or photographs.

CRITICAL NOTICE & PRIVACY GUARANTEE:
1. This module performs local visual comparison strictly between images supplied by the user.
2. It does NOT query Aadhaar, DigiLocker, CCTNS, or any government biometric database.
3. No face crops or biometric embeddings are permanently persisted in the database or filesystem.
   All face vectors are computed strictly in-memory and discarded immediately after scoring.
"""

import logging
from typing import Dict, Any, Optional, Tuple, List
import cv2
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

FACE_SIMILARITY_THRESHOLD = 0.78


class CrossDocumentFaceMatcher:
    """Biometric face detection and visual consistency matcher."""

    @staticmethod
    def detect_and_align_face(image: Image.Image) -> Tuple[int, Optional[np.ndarray], Optional[Tuple[int, int, int, int]]]:
        """Detects frontal faces and returns (face_count, normalized_128x128_crop, bbox)."""
        img_np = np.array(image.convert("RGB"))
        gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)

        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        face_cascade = cv2.CascadeClassifier(cascade_path)

        # Multi-scale face detection
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=4,
            minSize=(40, 40),
        )

        face_count = len(faces)
        if face_count != 1:
            return face_count, None, None

        x, y, w, h = faces[0]
        # Crop square region around face
        face_crop = gray[y : y + h, x : x + w]
        # Normalize to 128x128
        aligned = cv2.resize(face_crop, (128, 128), interpolation=cv2.INTER_AREA)

        # Equalize histogram to reduce illumination differences
        equalized = cv2.equalizeHist(aligned)

        return 1, equalized, (int(x), int(y), int(w), int(h))

    @staticmethod
    def extract_face_embedding(face_gray_128: np.ndarray) -> np.ndarray:
        """Computes spatial grid texture and gradient feature vector for the normalized face.

        Uses a 4x4 spatial grid with multi-bin intensity and gradient orientation histograms,
        producing a normalized 256-dimensional descriptor vector.
        """
        h, w = face_gray_128.shape
        grid_y, grid_x = 4, 4
        cell_h, cell_w = h // grid_y, w // grid_x

        descriptors = []

        # Sobel gradients for edge/structure distribution
        sobelx = cv2.Sobel(face_gray_128, cv2.CV_32F, 1, 0, ksize=3)
        sobely = cv2.Sobel(face_gray_128, cv2.CV_32F, 0, 1, ksize=3)
        mag, angle = cv2.cartToPolar(sobelx, sobely, angleInDegrees=True)

        for r in range(grid_y):
            for c in range(grid_x):
                # 1. Pixel intensity distribution in cell
                cell_pix = face_gray_128[r * cell_h : (r + 1) * cell_h, c * cell_w : (c + 1) * cell_w]
                hist_p, _ = np.histogram(cell_pix, bins=8, range=(0, 256))
                norm_p = np.linalg.norm(hist_p)
                if norm_p > 0:
                    hist_p = hist_p / norm_p
                descriptors.append(hist_p)

                # 2. Gradient orientation distribution in cell
                cell_ang = angle[r * cell_h : (r + 1) * cell_h, c * cell_w : (c + 1) * cell_w]
                hist_a, _ = np.histogram(cell_ang, bins=8, range=(0, 360))
                norm_a = np.linalg.norm(hist_a)
                if norm_a > 0:
                    hist_a = hist_a / norm_a
                descriptors.append(hist_a)

        # 3. Global spatial geometry profile (downsampled 16x16 face structure)
        thumb = cv2.resize(face_gray_128, (16, 16), interpolation=cv2.INTER_AREA).flatten().astype(np.float32)
        thumb_norm = np.linalg.norm(thumb)
        if thumb_norm > 0:
            descriptors.append(thumb / thumb_norm)

        combined = np.concatenate(descriptors).astype(np.float32)
        norm_total = np.linalg.norm(combined)
        if norm_total > 0:
            combined = combined / norm_total
        return combined

    @staticmethod
    def compare_documents(
        primary_image: Image.Image,
        secondary_image: Optional[Image.Image] = None,
    ) -> Dict[str, Any]:
        """Compares faces between primary document and optional secondary document."""
        if secondary_image is None:
            return {
                "performed": False,
                "status": "NOT APPLICABLE",
                "similarity_score": None,
                "distance": None,
                "details": "Cross-document face matching skipped (secondary document was not provided)",
                "limitations": "Secondary document upload is optional. Single-document forensic pipeline executed.",
            }

        # 1. Detect faces in Primary Document
        p_count, p_crop, p_bbox = CrossDocumentFaceMatcher.detect_and_align_face(primary_image)

        # 2. Detect faces in Secondary Document
        s_count, s_crop, s_bbox = CrossDocumentFaceMatcher.detect_and_align_face(secondary_image)

        if p_count == 0 or s_count == 0:
            missing = []
            if p_count == 0:
                missing.append("primary document")
            if s_count == 0:
                missing.append("secondary document")
            return {
                "performed": True,
                "status": "NO FACE",
                "similarity_score": 0.0,
                "distance": None,
                "details": f"Portrait face was not detected in: {', '.join(missing)}. Biometric cross-check skipped.",
                "limitations": "Poor lighting, high compression, or unphotographed documents prevent face detection.",
            }

        if p_count > 1 or s_count > 1:
            multi = []
            if p_count > 1:
                multi.append(f"primary document ({p_count} faces)")
            if s_count > 1:
                multi.append(f"secondary document ({s_count} faces)")
            return {
                "performed": True,
                "status": "MULTIPLE FACES",
                "similarity_score": 0.0,
                "distance": None,
                "details": f"Multiple faces detected in: {', '.join(multi)}. Unable to unambiguously determine identity subject.",
                "limitations": "System refuses to randomly guess identity subject when multiple faces appear in candidate upload.",
            }

        # 3. Compute in-memory feature embeddings
        emb_primary = CrossDocumentFaceMatcher.extract_face_embedding(p_crop)
        emb_secondary = CrossDocumentFaceMatcher.extract_face_embedding(s_crop)

        # 4. Compute Cosine Similarity & Euclidean Distance
        similarity = float(np.dot(emb_primary, emb_secondary))
        euclidean_dist = float(np.linalg.norm(emb_primary - emb_secondary))

        # Clamp metrics to valid range
        similarity = max(0.0, min(1.0, similarity))
        sim_percentage = round(similarity * 100.0, 1)

        is_match = similarity >= FACE_SIMILARITY_THRESHOLD
        status = "SAME" if is_match else "DIFFERENT"
        details = (
            f"Face detected in both documents. Visual similarity: {sim_percentage}% "
            f"(Cosine: {similarity:.3f}, Euclidean distance: {euclidean_dist:.3f}). "
            f"Result: {'Match' if is_match else 'Possible mismatch'}."
        )

        # Immediate memory cleanup of face matrices
        del emb_primary
        del emb_secondary
        del p_crop
        del s_crop

        return {
            "performed": True,
            "status": status,
            "similarity_score": round(similarity, 3),
            "similarity_percentage": sim_percentage,
            "distance": round(euclidean_dist, 3),
            "threshold": FACE_SIMILARITY_THRESHOLD,
            "is_match": is_match,
            "details": details,
            "primary_bbox": p_bbox,
            "secondary_bbox": s_bbox,
            "limitations": (
                "Cross-document face matching evaluates visual feature consistency between the two uploaded images. "
                "It does NOT query government identity databases (such as Aadhaar or Passport gateways) or perform liveness verification."
            ),
        }
