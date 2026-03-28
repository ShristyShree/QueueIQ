"""
Database seed — hospitals + queue profiles + doctors.
Run: flask seed-db
"""
from app import db
from app.models.hospital import Hospital, QueueProfile, Doctor

HOSPITAL_DATA = [
    {"id":"apollo_greams","name":"Apollo Hospitals","short_name":"Apollo",
     "area":"Greams Road, Chennai","lat":13.0569,"lng":80.2495,
     "hospital_type":"Multi-Specialty","beds":560,"rating":4.3,"daily_visits":2840,
     "established":1983,"badge":"Premium","badge_color":"#3B82F6",
     "description":"One of India's largest private hospital chains.",
     "peak_window":"9am–12pm & 5pm–8pm","live_users":14,"total_data_points":12480,
     "doctors":[
         {"id":"dr_sharma_apollo","name":"Dr. Rajesh Sharma","specialty":"Cardiology","avail_start":9,"avail_end":13,"avg_consult_min":15,"popularity_index":92,"wait_multiplier":1.4},
         {"id":"dr_meera_apollo","name":"Dr. Meera Nair","specialty":"Neurology","avail_start":10,"avail_end":16,"avg_consult_min":18,"popularity_index":87,"wait_multiplier":1.2},
         {"id":"dr_kumar_apollo","name":"Dr. Arun Kumar","specialty":"Orthopedics","avail_start":14,"avail_end":19,"avg_consult_min":12,"popularity_index":78,"wait_multiplier":1.1},
         {"id":"dr_priya_apollo","name":"Dr. Priya Menon","specialty":"General OPD","avail_start":9,"avail_end":17,"avg_consult_min":8,"popularity_index":65,"wait_multiplier":0.9},
         {"id":"dr_sinha_apollo","name":"Dr. Vivek Sinha","specialty":"Gastroenterology","avail_start":11,"avail_end":15,"avg_consult_min":20,"popularity_index":82,"wait_multiplier":1.3},
     ],
     "queues":{
         "doctor":{"label":"Doctor Consultation","avg_service_min":12,"weekend_mult":0.72,"model_accuracy":89,"peak_hours":[9,10,11,17,18,19],"base_profile":[2,1,1,1,1,3,8,20,35,42,40,34,38,44,40,36,52,62,50,32,20,12,7,3],"notes":["Wednesdays show 28% higher OPD footfall","Post-lunch (1–3pm) consistently calmer","School holiday seasons spike by 35–40%","Specialist slots fill up by 10am"]},
         "billing":{"label":"Billing Counter","avg_service_min":7,"weekend_mult":0.65,"model_accuracy":92,"peak_hours":[10,11,15,16,17],"base_profile":[0,0,0,0,0,1,3,10,20,26,24,20,26,30,28,24,32,36,30,20,12,6,2,0],"notes":["Discharge billing peaks 10am–12pm","Friday evenings unusually heavy","Token system reduces queue slightly","Cash counters slower than digital"]},
         "pharmacy":{"label":"Pharmacy","avg_service_min":5,"weekend_mult":0.82,"model_accuracy":93,"peak_hours":[10,11,17,18,19],"base_profile":[0,0,0,0,0,1,4,12,22,30,28,22,24,26,24,22,34,40,32,22,14,7,3,0],"notes":["Prescription refills spike Mon & Thu","24-hr pharmacy — rare for Chennai","Night pharmacy near-empty","Import medicines may need ordering"]},
     }},
    {"id":"miot_manapakkam","name":"MIOT International","short_name":"MIOT",
     "area":"Manapakkam, Chennai","lat":13.0111,"lng":80.1765,
     "hospital_type":"Super-Specialty Orthopedic","beds":1000,"rating":4.6,"daily_visits":1980,
     "established":1999,"badge":"Top Rated","badge_color":"#16A34A",
     "description":"Renowned for orthopedics and neurosciences.",
     "peak_window":"9am–11am & 4pm–7pm","live_users":17,"total_data_points":8920,
     "doctors":[
         {"id":"dr_patel_miot","name":"Dr. Suresh Patel","specialty":"Orthopedics","avail_start":9,"avail_end":14,"avg_consult_min":20,"popularity_index":95,"wait_multiplier":1.6},
         {"id":"dr_anand_miot","name":"Dr. Kiran Anand","specialty":"Neurosurgery","avail_start":10,"avail_end":16,"avg_consult_min":25,"popularity_index":90,"wait_multiplier":1.5},
         {"id":"dr_thomas_miot","name":"Dr. John Thomas","specialty":"Spine Surgery","avail_start":8,"avail_end":13,"avg_consult_min":22,"popularity_index":88,"wait_multiplier":1.4},
         {"id":"dr_rajan_miot","name":"Dr. Pradeep Rajan","specialty":"Physiotherapy","avail_start":9,"avail_end":18,"avg_consult_min":30,"popularity_index":72,"wait_multiplier":0.8},
     ],
     "queues":{
         "doctor":{"label":"Doctor Consultation","avg_service_min":18,"weekend_mult":0.48,"model_accuracy":91,"peak_hours":[9,10,11,16,17],"base_profile":[0,0,0,0,0,1,4,14,26,38,36,28,30,34,30,28,44,50,38,22,12,6,2,0],"notes":["Tue & Thu ortho clinics always packed","Walk-ins wait 2× longer","International patients via separate desk","Post-surgery surge Mon mornings"]},
         "billing":{"label":"Billing Counter","avg_service_min":8,"weekend_mult":0.44,"model_accuracy":88,"peak_hours":[10,11,16,17],"base_profile":[0,0,0,0,0,0,2,8,16,24,22,18,20,22,20,18,28,34,26,16,8,4,1,0],"notes":["Insurance pre-auth adds 20–40 mins","Cashless counters faster","Saturday billing closes at 3pm"]},
         "pharmacy":{"label":"Pharmacy","avg_service_min":6,"weekend_mult":0.55,"model_accuracy":90,"peak_hours":[10,11,17,18],"base_profile":[0,0,0,0,0,0,2,10,18,26,24,18,20,22,20,18,28,34,26,16,8,3,1,0],"notes":["Implant prescriptions need longer","Discharge pharmacy rush 12–2pm","Post-op supplies better weekdays"]},
     }},
    {"id":"ggh_park_town","name":"Govt. General Hospital","short_name":"GGH",
     "area":"Park Town, Chennai","lat":13.0836,"lng":80.2762,
     "hospital_type":"Government Tertiary","beds":2632,"rating":3.6,"daily_visits":4200,
     "established":1664,"badge":"Largest","badge_color":"#7C3AED",
     "description":"Oldest and largest public hospital in Tamil Nadu.",
     "peak_window":"7am–11am (acute morning rush)","live_users":31,"total_data_points":18720,
     "doctors":[
         {"id":"dr_venu_ggh","name":"Dr. Venkatesh M","specialty":"General Medicine","avail_start":7,"avail_end":13,"avg_consult_min":6,"popularity_index":70,"wait_multiplier":1.0},
         {"id":"dr_selvi_ggh","name":"Dr. Selvi R","specialty":"Pediatrics","avail_start":8,"avail_end":14,"avg_consult_min":7,"popularity_index":75,"wait_multiplier":1.1},
         {"id":"dr_babu_ggh","name":"Dr. Ramesh Babu","specialty":"Surgery","avail_start":9,"avail_end":15,"avg_consult_min":10,"popularity_index":68,"wait_multiplier":1.0},
         {"id":"dr_lakshmi_ggh","name":"Dr. Lakshmi D","specialty":"Gynecology","avail_start":7,"avail_end":12,"avg_consult_min":8,"popularity_index":80,"wait_multiplier":1.2},
     ],
     "queues":{
         "doctor":{"label":"Doctor Consultation","avg_service_min":8,"weekend_mult":0.55,"model_accuracy":78,"peak_hours":[7,8,9,10,11],"base_profile":[4,3,2,2,2,14,42,68,75,72,62,48,40,35,30,28,34,40,32,20,12,6,3,3],"notes":["OPD opens 7am — arrive by 6:45am","Weekend OPD emergency-only","Load is 3–4× private hospitals","Bring all previous records"]},
         "billing":{"label":"Token & Payment Counter","avg_service_min":5,"weekend_mult":0.4,"model_accuracy":75,"peak_hours":[7,8,9,10],"base_profile":[2,1,1,1,1,10,35,55,60,55,45,34,26,20,18,16,22,28,22,14,8,4,2,2],"notes":["Free treatment — token for registration","Morning 7–10am is critical","Separate BPL counter","Walk-in only"]},
         "pharmacy":{"label":"Govt. Pharmacy","avg_service_min":4,"weekend_mult":0.45,"model_accuracy":80,"peak_hours":[8,9,10,11,16],"base_profile":[0,0,0,0,0,8,28,48,55,50,40,30,20,16,14,18,35,42,30,18,10,5,2,0],"notes":["Free TN medicines — high demand","Specialty drug stock-outs common","Afternoon shift 2–8pm","GGH prescriptions only"]},
     }},
    {"id":"sims_vadapalani","name":"SIMS Hospital","short_name":"SIMS",
     "area":"Vadapalani, Chennai","lat":13.0524,"lng":80.2120,
     "hospital_type":"Multi-Specialty","beds":350,"rating":4.1,"daily_visits":1450,
     "established":2008,"badge":"Mid-Size","badge_color":"#3B82F6",
     "description":"Mid-sized private hospital. Cardiology and neurology focus.",
     "peak_window":"10am–12pm & 6pm–8pm","live_users":9,"total_data_points":6240,
     "doctors":[
         {"id":"dr_sen_sims","name":"Dr. Tanmoy Sen","specialty":"Cardiology","avail_start":10,"avail_end":14,"avg_consult_min":14,"popularity_index":85,"wait_multiplier":1.3},
         {"id":"dr_iyer_sims","name":"Dr. Gayathri Iyer","specialty":"Neurology","avail_start":9,"avail_end":15,"avg_consult_min":16,"popularity_index":80,"wait_multiplier":1.2},
         {"id":"dr_ali_sims","name":"Dr. Imran Ali","specialty":"General OPD","avail_start":18,"avail_end":21,"avg_consult_min":8,"popularity_index":70,"wait_multiplier":1.1},
         {"id":"dr_reddy_sims","name":"Dr. Sunita Reddy","specialty":"Endocrinology","avail_start":11,"avail_end":17,"avg_consult_min":18,"popularity_index":77,"wait_multiplier":1.2},
     ],
     "queues":{
         "doctor":{"label":"Doctor Consultation","avg_service_min":10,"weekend_mult":0.68,"model_accuracy":85,"peak_hours":[10,11,18,19],"base_profile":[0,0,0,0,0,1,3,10,20,30,32,26,22,24,22,20,28,38,44,32,18,10,5,1],"notes":["Evening OPD 6–8pm busiest","Cardiology dominates mornings","~60% appointment-based","Second Saturday high footfall"]},
         "billing":{"label":"Billing Counter","avg_service_min":6,"weekend_mult":0.60,"model_accuracy":87,"peak_hours":[10,11,17,18],"base_profile":[0,0,0,0,0,0,2,7,16,22,24,18,14,16,14,14,20,28,30,22,12,6,2,0],"notes":["TPA is separate counter","Evening billing = discharge rush","Avoid 10–11am if possible"]},
         "pharmacy":{"label":"Pharmacy","avg_service_min":4,"weekend_mult":0.72,"model_accuracy":88,"peak_hours":[10,11,18,19],"base_profile":[0,0,0,0,0,0,2,8,16,20,22,16,14,16,14,14,18,26,32,24,14,7,3,0],"notes":["Generic alternatives available","Evening pharmacy post-discharge","Cardiac medications stocked"]},
     }},
    {"id":"fortis_adyar","name":"Fortis Malar Hospital","short_name":"Fortis",
     "area":"Adyar, Chennai","lat":13.0012,"lng":80.2565,
     "hospital_type":"Multi-Specialty","beds":180,"rating":4.2,"daily_visits":1120,
     "established":1992,"badge":"Cardiac Focus","badge_color":"#DC2626",
     "description":"Cardiac care excellence. Lower overall wait times.",
     "peak_window":"9am–11am & 5pm–7pm","live_users":7,"total_data_points":4820,
     "doctors":[
         {"id":"dr_chopra_fortis","name":"Dr. Deepak Chopra","specialty":"Interventional Cardiology","avail_start":9,"avail_end":13,"avg_consult_min":18,"popularity_index":93,"wait_multiplier":1.5},
         {"id":"dr_nair_fortis","name":"Dr. Anitha Nair","specialty":"Cardiology","avail_start":14,"avail_end":18,"avg_consult_min":14,"popularity_index":82,"wait_multiplier":1.2},
         {"id":"dr_joy_fortis","name":"Dr. Sebastian Joy","specialty":"General Medicine","avail_start":9,"avail_end":17,"avg_consult_min":10,"popularity_index":68,"wait_multiplier":0.9},
     ],
     "queues":{
         "doctor":{"label":"Doctor Consultation","avg_service_min":11,"weekend_mult":0.58,"model_accuracy":87,"peak_hours":[9,10,17,18],"base_profile":[0,0,0,0,0,1,3,12,24,34,30,22,20,22,20,18,30,40,34,20,10,5,2,0],"notes":["Cardiac OPD Mon & Wed fills by 10am","Shorter wait than larger hospitals","App booking reduces wait ~30%"]},
         "billing":{"label":"Billing Counter","avg_service_min":5,"weekend_mult":0.50,"model_accuracy":90,"peak_hours":[9,10,16,17],"base_profile":[0,0,0,0,0,0,2,8,18,24,20,14,12,14,12,12,18,26,22,14,7,3,1,0],"notes":["Cashless insurance fast","Single counter on Sundays"]},
         "pharmacy":{"label":"Pharmacy","avg_service_min":4,"weekend_mult":0.60,"model_accuracy":91,"peak_hours":[9,10,17,18],"base_profile":[0,0,0,0,0,0,2,8,16,20,18,12,12,14,12,12,16,24,20,12,6,3,1,0],"notes":["Cardiac drugs always stocked","Closes at 10pm","Home delivery for repeats"]},
     }},
    {"id":"kmch_coimbatore","name":"KMC Hospital","short_name":"KMC",
     "area":"R.S. Puram, Coimbatore","lat":11.0017,"lng":76.9630,
     "hospital_type":"Multi-Specialty","beds":450,"rating":4.4,"daily_visits":1680,
     "established":1986,"badge":"Coimbatore","badge_color":"#0D9488",
     "description":"Leading hospital in Coimbatore.",
     "peak_window":"9am–12pm & 5pm–7pm","live_users":11,"total_data_points":7320,
     "doctors":[
         {"id":"dr_krishnan_kmc","name":"Dr. V. Krishnan","specialty":"Diabetology","avail_start":9,"avail_end":13,"avg_consult_min":12,"popularity_index":88,"wait_multiplier":1.3},
         {"id":"dr_kavitha_kmc","name":"Dr. Kavitha R","specialty":"Thyroid & Endocrine","avail_start":10,"avail_end":15,"avg_consult_min":14,"popularity_index":82,"wait_multiplier":1.2},
         {"id":"dr_mani_kmc","name":"Dr. Senthil Mani","specialty":"General Surgery","avail_start":9,"avail_end":17,"avg_consult_min":10,"popularity_index":72,"wait_multiplier":1.0},
         {"id":"dr_devi_kmc","name":"Dr. Saranya Devi","specialty":"Obstetrics","avail_start":8,"avail_end":14,"avg_consult_min":15,"popularity_index":78,"wait_multiplier":1.1},
     ],
     "queues":{
         "doctor":{"label":"Doctor Consultation","avg_service_min":9,"weekend_mult":0.62,"model_accuracy":86,"peak_hours":[9,10,11,17,18],"base_profile":[0,0,0,0,0,1,5,16,28,36,34,26,24,26,24,22,34,42,36,22,12,6,2,0],"notes":["Walk-in fills Mon/Wed/Fri","Diabetic clinics spike Tue mornings","Govt referrals swell mid-week"]},
         "billing":{"label":"Billing Counter","avg_service_min":6,"weekend_mult":0.55,"model_accuracy":84,"peak_hours":[10,11,16,17],"base_profile":[0,0,0,0,0,0,2,8,16,22,22,16,14,16,14,12,20,28,24,14,7,3,1,0],"notes":["UPI reduces cash queue","Billing closes 8pm"]},
         "pharmacy":{"label":"Pharmacy","avg_service_min":4,"weekend_mult":0.65,"model_accuracy":89,"peak_hours":[9,10,17,18],"base_profile":[0,0,0,0,0,0,3,10,18,22,20,14,14,16,14,12,18,26,22,14,7,3,1,0],"notes":["Generic drug store attached","Standard drugs ready in 10 mins"]},
     }},
]


def seed_hospitals(app):
    with app.app_context():
        for hdata in HOSPITAL_DATA:
            queues  = hdata.pop("queues")
            doctors = hdata.pop("doctors")

            hospital = Hospital.query.get(hdata["id"]) or Hospital(id=hdata["id"])
            for k, v in hdata.items():
                setattr(hospital, k, v)
            db.session.merge(hospital)
            db.session.flush()

            # Upsert queue profiles
            for qk, qd in queues.items():
                qp = (QueueProfile.query
                      .filter_by(hospital_id=hdata["id"], queue_key=qk).first()
                      or QueueProfile(hospital_id=hdata["id"], queue_key=qk))
                qp.label          = qd["label"]
                qp.avg_service_min= qd["avg_service_min"]
                qp.weekend_mult   = qd["weekend_mult"]
                qp.model_accuracy = qd["model_accuracy"]
                qp.base_profile   = qd["base_profile"]
                qp.peak_hours     = qd["peak_hours"]
                qp.notes          = qd["notes"]
                db.session.merge(qp)

            # Upsert doctors
            for dd in doctors:
                doc = (Doctor.query.get(dd["id"])
                       or Doctor(id=dd["id"], hospital_id=hdata["id"]))
                doc.hospital_id      = hdata["id"]
                doc.name             = dd["name"]
                doc.specialty        = dd["specialty"]
                doc.avail_start      = dd["avail_start"]
                doc.avail_end        = dd["avail_end"]
                doc.avg_consult_min  = dd["avg_consult_min"]
                doc.popularity_index = dd["popularity_index"]
                doc.wait_multiplier  = dd["wait_multiplier"]
                db.session.merge(doc)

        db.session.commit()
        print(f"✅ Seeded {len(HOSPITAL_DATA)} hospitals with queue profiles and doctors.")
