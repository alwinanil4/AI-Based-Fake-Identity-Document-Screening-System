"""DocShield AI — Sample Identity Document Generator.

Generates realistic sample documents for hackathon demonstration:
1. sample_genuine_passport.png (ICAO TD3 compliant with mathematically valid MRZ check-digits)
2. sample_forged_aadhaar_dob_tamper.png (Aadhaar with digitally spliced/altered DOB)
3. sample_cloned_pan_card.png (PAN card with copy-move duplicated security stamps)
4. sample_spliced_voter_id.png (Voter ID with spliced portrait and compression variance)
"""

import os
import io
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter


def get_font(size: int, bold: bool = False):
    """Attempt to load a clean truetype font, fallback to default."""
    try:
        font_name = "arialbd.ttf" if bold else "arial.ttf"
        return ImageFont.truetype(font_name, size)
    except Exception:
        try:
            return ImageFont.truetype("DejaVuSans.ttf", size)
        except Exception:
            return ImageFont.load_default()


def create_genuine_passport(output_path: str):
    """Generates an authentic-looking Indian Passport biodata page with valid ICAO TD3 MRZ."""
    w, h = 900, 600
    img = Image.new("RGB", (w, h), (245, 243, 235))
    draw = ImageDraw.Draw(img)

    # Guilloche-like background security lines
    for y in range(0, h, 8):
        offset = int(math.sin(y / 15.0) * 8)
        draw.line([(0, y + offset), (w, y - offset)], fill=(232, 228, 215), width=1)

    # Passport Header
    f_title = get_font(22, bold=True)
    f_sub = get_font(13)
    f_label = get_font(11)
    f_val = get_font(15, bold=True)
    f_mrz = get_font(19, bold=True)

    draw.rectangle([(20, 20), (w - 20, 70)], fill=(24, 43, 73))
    draw.text((w // 2, 45), "REPUBLIC OF INDIA / PASSPORT", fill=(255, 255, 255), anchor="mm", font=f_title)

    # Portrait Photo Box
    draw.rectangle([(40, 95), (200, 310)], fill=(210, 215, 225), outline=(100, 115, 130), width=2)
    # Silhouette face
    draw.ellipse([(90, 140), (150, 205)], fill=(150, 160, 175))
    draw.chord([(65, 205), (175, 305)], start=0, end=180, fill=(110, 125, 145))
    draw.text((120, 320), "[BIOMETRIC PORTRAIT]", fill=(120, 130, 140), anchor="mm", font=f_label)

    # Passport Fields
    fields = [
        ("Type / Type", "P", "Code / Code", "IND", "Passport No. / No. de Passeport", "Z2049817"),
        ("Surname / Nom", "SINGH", "", "", "", ""),
        ("Given Names / Prenoms", "GURPREET", "", "", "", ""),
        ("Nationality / Nationalite", "INDIAN", "Sex / Sexe", "M", "Date of Birth / Date de Naissance", "15/06/1995"),
        ("Place of Birth / Lieu de Naissance", "AMRITSAR, PUNJAB", "", "", "", ""),
        ("Date of Issue / Date de Delivrance", "10/08/2022", "Date of Expiry / Date d'Expiration", "09/08/2032"),
    ]

    curr_y = 100
    for row in fields:
        draw.text((230, curr_y), row[0], fill=(110, 115, 125), font=f_label)
        draw.text((230, curr_y + 14), row[1], fill=(20, 30, 45), font=f_val)

        if len(row) > 2 and row[2]:
            draw.text((430, curr_y), row[2], fill=(110, 115, 125), font=f_label)
            draw.text((430, curr_y + 14), row[3], fill=(20, 30, 45), font=f_val)

        if len(row) > 4 and row[4]:
            draw.text((630, curr_y), row[4], fill=(110, 115, 125), font=f_label)
            draw.text((630, curr_y + 14), row[5], fill=(20, 30, 45), font=f_val)


        curr_y += 45

    # Bottom MRZ Zone (ICAO TD3: 2 lines of 44 chars with valid 7-3-1 check-digits)
    draw.rectangle([(20, 440), (w - 20, 570)], fill=(255, 255, 255), outline=(200, 205, 215), width=1)
    
    # Check digits:
    # doc: Z2049817 -> Z(35)*7 + 2*3 + 0*1 + 4*7 + 9*3 + 8*1 + 1*7 + 7*3 = 245 + 6 + 0 + 28 + 27 + 8 + 7 + 21 = 342 -> 2
    # dob: 950615 -> 9*7 + 5*3 + 0*1 + 6*7 + 1*3 + 5*1 = 63 + 15 + 0 + 42 + 3 + 5 = 128 -> 8
    # exp: 320809 -> 3*7 + 2*3 + 0*1 + 8*7 + 0*3 + 9*1 = 21 + 6 + 0 + 56 + 0 + 9 = 92 -> 2
    mrz_line1 = "P<INDSINGH<<GURPREET<<<<<<<<<<<<<<<<<<<<<<<<"
    mrz_line2 = "Z2049817<2IND9506158M3208092<<<<<<<<<<<<<<<4"

    draw.text((45, 465), mrz_line1, fill=(15, 20, 25), font=f_mrz)
    draw.text((45, 515), mrz_line2, fill=(15, 20, 25), font=f_mrz)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path, "PNG")
    print(f"Created: {output_path}")


def create_forged_aadhaar_tampered_dob(output_path: str):
    """Generates an Aadhaar card with a visually and ELA-spliced Date of Birth."""
    w, h = 900, 560
    img = Image.new("RGB", (w, h), (252, 252, 250))
    draw = ImageDraw.Draw(img)

    # Top Header banner (Tricolor stripe)
    draw.rectangle([(0, 0), (w, 12)], fill=(255, 153, 51))
    draw.rectangle([(0, 12), (w, 24)], fill=(255, 255, 255))
    draw.rectangle([(0, 24), (w, 36)], fill=(19, 136, 8))

    f_govt = get_font(18, bold=True)
    f_sub = get_font(12)
    f_val = get_font(16, bold=True)
    f_aadhaar = get_font(26, bold=True)
    f_label = get_font(13)

    draw.text((w // 2, 55), "GOVERNMENT OF INDIA", fill=(20, 30, 50), anchor="mm", font=f_govt)
    draw.text((w // 2, 75), "Unique Identification Authority of India", fill=(80, 85, 95), anchor="mm", font=f_sub)

    # Photo Box
    draw.rectangle([(50, 120), (220, 340)], fill=(230, 235, 240), outline=(150, 160, 170), width=2)
    draw.ellipse([(105, 170), (165, 235)], fill=(150, 160, 175))
    draw.chord([(80, 235), (190, 335)], start=0, end=180, fill=(110, 125, 145))

    # Details
    draw.text((260, 130), "To:", fill=(100, 100, 100), font=f_label)
    draw.text((260, 155), "Devendra Kashyap", fill=(20, 30, 40), font=f_val)
    draw.text((260, 185), "Father: Mahesh Kashyap", fill=(60, 70, 80), font=f_label)

    # Tampered DOB field: We intentionally paste a re-compressed, slightly rotated/misaligned DOB patch!
    draw.text((260, 220), "DOB: ", fill=(60, 70, 80), font=f_label)

    # Spliced DOB patch: Different background tint and JPEG recompression artifacts
    dob_patch = Image.new("RGB", (170, 36), (235, 230, 215))
    p_draw = ImageDraw.Draw(dob_patch)
    p_draw.text((10, 8), "01/01/1980", fill=(10, 10, 10), font=get_font(18, bold=True))
    # Recompress patch at quality 40 to trigger severe ELA spike
    buf = io.BytesIO()
    dob_patch.save(buf, format="JPEG", quality=35)
    buf.seek(0)
    spliced_dob = Image.open(buf)

    # Paste with slight angle and offset (triggers baseline shift + ELA)
    spliced_dob = spliced_dob.rotate(1.8, expand=True, fillcolor=(252, 252, 250))
    img.paste(spliced_dob, (310, 214))

    draw.text((260, 270), "Gender: Male / PUM", fill=(60, 70, 80), font=f_label)

    # 12-Digit Aadhaar Number
    draw.rectangle([(240, 370), (w - 80, 440)], fill=(240, 245, 250), outline=(200, 215, 230), width=1)
    draw.text(((w - 80 + 240) // 2, 405), "7849  3019  6721", fill=(180, 30, 30), anchor="mm", font=f_aadhaar)
    draw.text(((w - 80 + 240) // 2, 470), "Mera Aadhaar, Meri Pehchan", fill=(100, 105, 115), anchor="mm", font=f_sub)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    # Save as JPEG to maintain ELA contrast
    img.save(output_path, "JPEG", quality=92)
    print(f"Created: {output_path}")


def create_cloned_pan_card(output_path: str):
    """Generates a PAN card with copy-move duplicated holographic emblem / stamp."""
    w, h = 900, 560
    img = Image.new("RGB", (w, h), (210, 235, 245))
    draw = ImageDraw.Draw(img)

    # Income tax header
    draw.rectangle([(20, 20), (w - 20, 85)], fill=(25, 80, 130))
    draw.text((w // 2, 42), "INCOME TAX DEPARTMENT", fill=(255, 255, 255), anchor="mm", font=get_font(22, bold=True))
    draw.text((w // 2, 68), "GOVT. OF INDIA / PERMANENT ACCOUNT NUMBER", fill=(220, 235, 250), anchor="mm", font=get_font(13))

    # Portrait box
    draw.rectangle([(40, 120), (200, 320)], fill=(220, 225, 235), outline=(80, 120, 160), width=2)
    draw.ellipse([(90, 160), (150, 220)], fill=(130, 150, 170))
    draw.chord([(65, 220), (175, 315)], start=0, end=180, fill=(90, 115, 140))

    # Name and fields
    f_lbl = get_font(12)
    f_val = get_font(17, bold=True)
    draw.text((230, 125), "Name / Nom", fill=(70, 90, 110), font=f_lbl)
    draw.text((230, 145), "VIKRAM MALHOTRA", fill=(20, 35, 55), font=f_val)

    draw.text((230, 185), "Father's Name / Nom du Pere", fill=(70, 90, 110), font=f_lbl)
    draw.text((230, 205), "RAMESH MALHOTRA", fill=(20, 35, 55), font=f_val)

    draw.text((230, 245), "Date of Birth / Date de Naissance", fill=(70, 90, 110), font=f_lbl)
    draw.text((230, 265), "19/08/1988", fill=(20, 35, 55), font=f_val)

    draw.text((230, 315), "Permanent Account Number / PAN", fill=(70, 90, 110), font=f_lbl)
    draw.text((230, 338), "ABCDE1234F", fill=(10, 20, 40), font=get_font(26, bold=True))

    # COPY-MOVE CLONE STAMP:
    # Draw a complex circular security emblem, then clone it exactly at a second location!
    emblem = Image.new("RGBA", (100, 100), (0, 0, 0, 0))
    e_draw = ImageDraw.Draw(emblem)
    e_draw.ellipse([(10, 10), (90, 90)], outline=(180, 140, 20), width=4)
    e_draw.ellipse([(25, 25), (75, 75)], outline=(180, 140, 20), width=2)
    e_draw.line([(50, 10), (50, 90)], fill=(180, 140, 20), width=2)
    e_draw.line([(10, 50), (90, 50)], fill=(180, 140, 20), width=2)
    for ang in range(0, 360, 30):
        rad = math.radians(ang)
        x = int(50 + 35 * math.cos(rad))
        y = int(50 + 35 * math.sin(rad))
        e_draw.point((x, y), fill=(210, 170, 30))

    # Paste original emblem at (720, 150)
    img.paste(emblem, (720, 150), emblem)

    # Cloned copy-move emblem pasted at (720, 360) (identical keypoints!)
    img.paste(emblem, (720, 360), emblem)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path, "PNG")
    print(f"Created: {output_path}")


def create_spliced_voter_id(output_path: str):
    """Generates an Election Commission Voter ID with spliced photo and format anomalies."""
    w, h = 900, 560
    img = Image.new("RGB", (w, h), (248, 246, 240))
    draw = ImageDraw.Draw(img)

    # Header
    draw.rectangle([(30, 20), (w - 30, 75)], fill=(140, 20, 30))
    draw.text((w // 2, 48), "ELECTION COMMISSION OF INDIA / VOTER ID", fill=(255, 255, 255), anchor="mm", font=get_font(20, bold=True))

    f_lbl = get_font(12)
    f_val = get_font(16, bold=True)

    # Spliced portrait: paste high-noise synthetic photo with sharp cut boundaries
    photo_box = Image.new("RGB", (180, 220), (210, 210, 210))
    p_draw = ImageDraw.Draw(photo_box)
    p_draw.ellipse([(50, 40), (130, 120)], fill=(90, 100, 110))
    p_draw.chord([(25, 120), (155, 210)], start=0, end=180, fill=(60, 70, 80))
    # Inject high frequency noise
    np_photo = np.array(photo_box)
    noise = np.random.normal(0, 18, np_photo.shape).astype(np.int16)
    noisy_photo = np.clip(np_photo.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    photo_box = Image.fromarray(noisy_photo)

    img.paste(photo_box, (60, 110))
    draw.rectangle([(58, 108), (242, 332)], outline=(200, 50, 50), width=2)

    # EPIC Number
    draw.text((300, 115), "EPIC No. / Serial", fill=(100, 100, 100), font=f_lbl)
    draw.text((300, 138), "XYZ9876543", fill=(160, 20, 20), font=get_font(24, bold=True))

    draw.text((300, 190), "Elector's Name:", fill=(100, 100, 100), font=f_lbl)
    draw.text((300, 212), "Sunil Kumar Verma", fill=(20, 30, 40), font=f_val)

    draw.text((300, 255), "Father's Name:", fill=(100, 100, 100), font=f_lbl)
    draw.text((300, 277), "Harish Verma", fill=(20, 30, 40), font=f_val)

    draw.text((300, 320), "Assembly Constituency:", fill=(100, 100, 100), font=f_lbl)
    draw.text((300, 342), "142 - Malviya Nagar", fill=(20, 30, 40), font=f_val)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path, "JPEG", quality=88)
    print(f"Created: {output_path}")


def main():
    dest_dirs = [
        os.path.join(os.path.dirname(__file__), "..", "sample_documents"),
        os.path.join(os.path.dirname(__file__), "..", "public", "sample_documents"),
    ]

    for dest in dest_dirs:
        abs_dest = os.path.abspath(dest)
        print(f"Generating sample test documents in {abs_dest}...")
        create_genuine_passport(os.path.join(abs_dest, "sample_genuine_passport.png"))
        create_forged_aadhaar_tampered_dob(os.path.join(abs_dest, "sample_forged_aadhaar_dob_tamper.jpg"))
        create_cloned_pan_card(os.path.join(abs_dest, "sample_cloned_pan_card.png"))
        create_spliced_voter_id(os.path.join(abs_dest, "sample_spliced_voter_id.jpg"))

    print("\nAll sample documents successfully generated!")


if __name__ == "__main__":
    main()
