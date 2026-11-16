import type { Symptom } from "@/types";

export const SYMPTOMS: Symptom[] = [
  // MIND
  { id: "sym-001", code: "MIND-ANX", name: "Anxiety and fearfulness", category: "mind", description: "Intense anxiety, restlessness, fearful state of mind" },
  { id: "sym-002", code: "MIND-FEAR-DEATH", name: "Fear of death", category: "mind", description: "Intense fear of dying, predicts own death" },
  { id: "sym-003", code: "MIND-IRR", name: "Irritability and peevishness", category: "mind", description: "Easily angered, cannot be pleased, snaps at others" },
  { id: "sym-004", code: "MIND-GRIEF", name: "Grief and sadness", category: "mind", description: "Deep sadness from loss, disappointment, bereavement" },
  { id: "sym-005", code: "MIND-REST", name: "Restlessness", category: "mind", description: "Cannot sit still, must keep moving, anxious restlessness" },
  { id: "sym-006", code: "MIND-IND", name: "Indifference to loved ones", category: "mind", description: "Apathy and indifference to family and friends" },
  { id: "sym-007", code: "MIND-LOQU", name: "Loquacity", category: "mind", description: "Talks excessively, jumps from subject to subject" },
  { id: "sym-008", code: "MIND-DULL", name: "Dullness and confusion", category: "mind", description: "Mental dullness, difficulty thinking, confusion" },
  { id: "sym-009", code: "MIND-SIGH", name: "Sighing and sobbing", category: "mind", description: "Involuntary sighing, sobbing from emotional distress" },
  { id: "sym-010", code: "MIND-ANXI-NIGHT", name: "Anxiety worse at night", category: "mind", description: "Anxiety peaks at night, particularly after midnight" },
  { id: "sym-011", code: "MIND-ANTI", name: "Anticipatory anxiety", category: "mind", description: "Anxiety before events, stage fright, exam nerves" },
  { id: "sym-012", code: "MIND-FASTID", name: "Fastidiousness", category: "mind", description: "Meticulous, wants everything in perfect order" },
  { id: "sym-013", code: "MIND-JEALOUS", name: "Jealousy", category: "mind", description: "Intense jealousy, suspicious of partner" },
  { id: "sym-014", code: "MIND-CONF-SELF", name: "Lack of self-confidence", category: "mind", description: "Timid, hesitant, lacks self-confidence in public" },
  { id: "sym-015", code: "MIND-SYMPATHY", name: "Sympathetic to others", category: "mind", description: "Great sympathy for suffering of others" },

  // HEAD
  { id: "sym-016", code: "HEAD-THROB", name: "Throbbing headache", category: "head", description: "Pulsating, throbbing pain in head" },
  { id: "sym-017", code: "HEAD-HAMMER", name: "Hammering headache", category: "head", description: "Sensation as if hammers beating inside head" },
  { id: "sym-018", code: "HEAD-VERT", name: "Vertigo and dizziness", category: "head", description: "Dizziness, spinning sensation, lightheadedness" },
  { id: "sym-019", code: "HEAD-MIGR", name: "Migraine headache", category: "head", description: "Severe one-sided headache with visual disturbances" },
  { id: "sym-020", code: "HEAD-SWEAT", name: "Profuse sweating of head", category: "head", description: "Head sweats profusely especially at night or during sleep" },

  // EYE
  { id: "sym-021", code: "EYE-PAIN", name: "Eye pain and soreness", category: "eye", description: "Pain in and around eyes, soreness of eyeballs" },
  { id: "sym-022", code: "EYE-STRAIN", name: "Eye strain from fine work", category: "eye", description: "Eye fatigue from reading, screen work, fine detail" },
  { id: "sym-023", code: "EYE-RED", name: "Redness of eyes", category: "eye", description: "Congestion and redness of conjunctiva" },
  { id: "sym-024", code: "EYE-DROOP", name: "Heavy drooping eyelids", category: "eye", description: "Eyelids feel heavy, ptosis, difficult to keep eyes open" },
  { id: "sym-025", code: "EYE-DISC", name: "Eye discharge", category: "eye", description: "Discharge from eyes, matter in corners" },

  // EAR
  { id: "sym-026", code: "EAR-PAIN", name: "Earache", category: "ear", description: "Pain in ear, otalgia, shooting or throbbing pain" },
  { id: "sym-027", code: "EAR-RING", name: "Ringing in ears", category: "ear", description: "Tinnitus, buzzing, ringing or roaring in ears" },
  { id: "sym-028", code: "EAR-DISC", name: "Ear discharge", category: "ear", description: "Discharge from ear, otorrhea" },

  // NOSE
  { id: "sym-029", code: "NOSE-RUNNY", name: "Runny nose", category: "nose", description: "Profuse watery or thick nasal discharge" },
  { id: "sym-030", code: "NOSE-CONG", name: "Nasal congestion", category: "nose", description: "Stuffed nose, blocked nasal passages" },
  { id: "sym-031", code: "NOSE-SNEEZE", name: "Sneezing", category: "nose", description: "Frequent sneezing, violent sneezing fits" },
  { id: "sym-032", code: "NOSE-LOSS", name: "Loss of smell", category: "nose", description: "Anosmia, inability to smell" },

  // MOUTH
  { id: "sym-033", code: "MOUTH-DRY", name: "Dryness of mouth", category: "mouth", description: "Dry mouth and lips, intense thirst" },
  { id: "sym-034", code: "MOUTH-SALIVA", name: "Increased salivation", category: "mouth", description: "Profuse saliva, drooling, moist mouth" },
  { id: "sym-035", code: "MOUTH-ULCER", name: "Mouth ulcers", category: "mouth", description: "Aphthous ulcers, sores in mouth and on tongue" },
  { id: "sym-036", code: "MOUTH-TOOTH", name: "Toothache", category: "mouth", description: "Pain in teeth, dental neuralgia" },

  // THROAT
  { id: "sym-037", code: "THRT-SORE", name: "Sore throat", category: "throat", description: "Pain in throat, difficulty swallowing" },
  { id: "sym-038", code: "THRT-HOARSE", name: "Hoarseness", category: "throat", description: "Hoarse voice, loss of voice, roughness" },
  { id: "sym-039", code: "THRT-LUMP", name: "Lump in throat sensation", category: "throat", description: "Globus sensation, feeling of lump in throat" },
  { id: "sym-040", code: "THRT-TIGHT", name: "Cannot bear tight collar", category: "throat", description: "Intolerance of anything tight around neck or throat" },
  { id: "sym-041", code: "THRT-RAW", name: "Rawness in throat", category: "throat", description: "Raw, excoriated feeling in throat" },

  // CHEST
  { id: "sym-042", code: "CHEST-COUGH", name: "Dry cough", category: "chest", description: "Dry, irritating, non-productive cough" },
  { id: "sym-043", code: "CHEST-COUGH-WET", name: "Productive cough", category: "chest", description: "Cough with expectoration, phlegm" },
  { id: "sym-044", code: "CHEST-CROUP", name: "Croupy cough", category: "chest", description: "Barking, croupy cough worse at night" },
  { id: "sym-045", code: "CHEST-BREATH", name: "Breathlessness", category: "chest", description: "Difficulty breathing, dyspnea" },
  { id: "sym-046", code: "CHEST-PALP", name: "Palpitations", category: "chest", description: "Awareness of heart beating, palpitations" },
  { id: "sym-047", code: "CHEST-PAIN", name: "Chest pain", category: "chest", description: "Pain in chest, may be stitching or pressing" },

  // STOMACH
  { id: "sym-048", code: "STOM-NAUSEA", name: "Nausea and vomiting", category: "stomach", description: "Nausea with or without vomiting" },
  { id: "sym-049", code: "STOM-VOMIT", name: "Violent vomiting", category: "stomach", description: "Forceful, persistent vomiting" },
  { id: "sym-050", code: "STOM-HEARTBURN", name: "Heartburn and acidity", category: "stomach", description: "Burning in stomach, acid regurgitation" },
  { id: "sym-051", code: "STOM-BLOAT", name: "Bloating after eating", category: "stomach", description: "Abdominal distension immediately after eating" },
  { id: "sym-052", code: "STOM-HUNGRY-11", name: "Hungry at 11 AM", category: "stomach", description: "Faint, sinking sensation at 11 AM with hunger" },
  { id: "sym-053", code: "STOM-THIRST-LARGE", name: "Thirst for large quantities", category: "stomach", description: "Drinks large amounts of water at long intervals" },
  { id: "sym-054", code: "STOM-THIRST-SMALL", name: "Thirst for small sips", category: "stomach", description: "Drinks little and often, small sips" },
  { id: "sym-055", code: "STOM-NO-THIRST", name: "Absence of thirst", category: "stomach", description: "No desire to drink even with fever" },
  { id: "sym-056", code: "STOM-CRAVING-SWEET", name: "Craving for sweets", category: "stomach", description: "Strong desire for sweets, chocolates, candy" },
  { id: "sym-057", code: "STOM-CRAVING-SALT", name: "Craving for salt", category: "stomach", description: "Strong desire for salt, salty foods" },
  { id: "sym-058", code: "STOM-CRAVING-COLD", name: "Craving for cold drinks", category: "stomach", description: "Desire for icy cold drinks and food" },

  // ABDOMEN
  { id: "sym-059", code: "ABD-COLIC", name: "Abdominal colic", category: "abdomen", description: "Cramping, spasmodic pains in abdomen" },
  { id: "sym-060", code: "ABD-DIARR", name: "Diarrhea", category: "abdomen", description: "Loose, frequent stools" },
  { id: "sym-061", code: "ABD-CONST", name: "Constipation", category: "abdomen", description: "Hard, difficult stools, infrequent bowel movements" },
  { id: "sym-062", code: "ABD-DIST", name: "Abdominal distension", category: "abdomen", description: "Bloated abdomen, gas and flatulence" },

  // RECTUM
  { id: "sym-063", code: "RECT-HEMM", name: "Hemorrhoids", category: "rectum", description: "Piles, hemorrhoidal complaints" },
  { id: "sym-064", code: "RECT-BURN", name: "Burning in rectum", category: "rectum", description: "Burning pain in rectum and anus" },

  // URINARY
  { id: "sym-065", code: "URIN-BURN", name: "Burning urination", category: "urinary", description: "Burning pain during and after urination" },
  { id: "sym-066", code: "URIN-FREQ", name: "Frequent urination", category: "urinary", description: "Urge to urinate frequently, urgency" },
  { id: "sym-067", code: "URIN-RET", name: "Retention of urine", category: "urinary", description: "Inability to pass urine, retention" },
  { id: "sym-068", code: "URIN-UTI", name: "Urinary tract infection", category: "urinary", description: "Burning, stinging UTI symptoms" },

  // BACK
  { id: "sym-069", code: "BACK-PAIN", name: "Back pain", category: "back", description: "Pain in back, lumbar or thoracic region" },
  { id: "sym-070", code: "BACK-STIFF", name: "Back stiffness", category: "back", description: "Stiffness and rigidity of back, worse on first motion" },

  // EXTREMITIES
  { id: "sym-071", code: "EXT-JOINT", name: "Joint pain", category: "extremities", description: "Arthritic pain in joints, swelling" },
  { id: "sym-072", code: "EXT-CRAMP", name: "Muscle cramps", category: "extremities", description: "Spasmodic cramping of muscles" },
  { id: "sym-073", code: "EXT-WEAK", name: "Weakness of extremities", category: "extremities", description: "Paralytic weakness, heavy limbs" },
  { id: "sym-074", code: "EXT-REST", name: "Restless legs", category: "extremities", description: "Must keep legs moving, restless legs syndrome" },
  { id: "sym-075", code: "EXT-BURN-SOLE", name: "Burning soles of feet", category: "extremities", description: "Burning heat in soles, must uncover feet" },
  { id: "sym-076", code: "EXT-SWEAT-FEET", name: "Foot sweat", category: "extremities", description: "Profuse, offensive perspiration of feet" },

  // SKIN
  { id: "sym-077", code: "SKIN-ITCH", name: "Intense itching", category: "skin", description: "Itching of skin, worse from warmth" },
  { id: "sym-078", code: "SKIN-ECZEMA", name: "Eczema", category: "skin", description: "Chronic skin eruptions, eczema" },
  { id: "sym-079", code: "SKIN-WARTS", name: "Warts", category: "skin", description: "Warts on skin, especially hands and genitals" },
  { id: "sym-080", code: "SKIN-ERUPT", name: "Skin eruptions", category: "skin", description: "Various eruptions, rashes, vesicles" },
  { id: "sym-081", code: "SKIN-BURN", name: "Burning skin", category: "skin", description: "Burning sensations in skin" },
  { id: "sym-082", code: "SKIN-HONEY-DISC", name: "Honey-like skin discharge", category: "skin", description: "Thick, sticky, honey-colored discharge from skin" },

  // FEVER
  { id: "sym-083", code: "FEV-HIGH", name: "High fever", category: "fever", description: "High temperature, pyrexia" },
  { id: "sym-084", code: "FEV-SUDDEN", name: "Sudden onset fever", category: "fever", description: "Fever that comes on suddenly and violently" },
  { id: "sym-085", code: "FEV-CHILL", name: "Chills and shivering", category: "fever", description: "Chilliness, shivering, rigors" },
  { id: "sym-086", code: "FEV-SWEAT", name: "Night sweats", category: "fever", description: "Profuse perspiration at night" },
  { id: "sym-087", code: "FEV-INTER", name: "Intermittent fever", category: "fever", description: "Fever recurring at regular intervals, periodic" },
  { id: "sym-088", code: "FEV-COLD-SWEAT", name: "Cold sweat on forehead", category: "fever", description: "Cold, clammy perspiration on forehead" },

  // SLEEP
  { id: "sym-089", code: "SLP-INSOMNIA", name: "Insomnia", category: "sleep", description: "Difficulty falling or staying asleep" },
  { id: "sym-090", code: "SLP-REST", name: "Restless sleep", category: "sleep", description: "Tosses and turns, unrefreshing sleep" },
  { id: "sym-091", code: "SLP-DROWSY", name: "Drowsiness and lethargy", category: "sleep", description: "Excessive sleepiness during day" },
  { id: "sym-092", code: "SLP-WORSE-SLEEP", name: "Worse after sleep", category: "sleep", description: "Symptoms worse on waking from sleep" },

  // GENERALS
  { id: "sym-093", code: "GEN-FATIGUE", name: "Fatigue and exhaustion", category: "generals", description: "General weakness, lassitude, exhaustion" },
  { id: "sym-094", code: "GEN-CHILLY", name: "Chilliness", category: "generals", description: "Sensitive to cold, always feels cold" },
  { id: "sym-095", code: "GEN-HEAT", name: "Sensitivity to heat", category: "generals", description: "Cannot tolerate heat, better in cool air" },
  { id: "sym-096", code: "GEN-BURN", name: "Burning pains", category: "generals", description: "Burning pains throughout the body" },
  { id: "sym-097", code: "GEN-BETTER-MOT", name: "Better from motion", category: "generals", description: "Pains and stiffness relieved by continued motion" },
  { id: "sym-098", code: "GEN-WORSE-MOT", name: "Worse from motion", category: "generals", description: "Any motion aggravates symptoms" },
  { id: "sym-099", code: "GEN-BETTER-WARM", name: "Better from warmth", category: "generals", description: "Symptoms relieved by warmth and warm applications" },
  { id: "sym-100", code: "GEN-WORSE-NIGHT", name: "Worse at night", category: "generals", description: "All symptoms aggravate during nighttime hours" },
  { id: "sym-101", code: "GEN-HEMORRHAGE", name: "Hemorrhagic tendency", category: "generals", description: "Easy bleeding from any orifice" },
  { id: "sym-102", code: "GEN-EDEMA", name: "Edema and swelling", category: "generals", description: "Fluid retention, puffiness, edema" },
  { id: "sym-103", code: "GEN-STIFF-FIRST", name: "Stiffness on first motion", category: "generals", description: "Stiff and painful on first movement, better continued motion" },
  { id: "sym-104", code: "GEN-BRUISED", name: "Bruised feeling all over", category: "generals", description: "As if beaten, bruised sensation throughout body" },
  { id: "sym-105", code: "GEN-COLLAPSE", name: "Collapse and faintness", category: "generals", description: "Sudden collapse, faintness, prostration" },
];
