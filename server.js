require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3001;

// --- CONFIGURATION ---
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY';
const JWT_SECRET = process.env.JWT_SECRET || 'pharmai_secret_key_2026';

// Startup Diagnostic
console.log(`🔑 API Key Status: ${GEMINI_API_KEY ? `Loaded (${GEMINI_API_KEY.substring(0, 10)}...)` : 'MISSING'}`);

// --- DATA: INVENTORY & SALES ---
const localInventory = [
    { name: "Aspirin", qty: 450, price: 12, expiry: "2026-12-01", category: "Analgesic" },
    { name: "Metformin", qty: 25, price: 55, expiry: "2025-05-15", category: "Antidiabetic" },
    { name: "Lisinopril", qty: 150, price: 85, expiry: "2026-08-20", category: "Antihypertensive" },
    { name: "Atorvastatin", qty: 10, price: 120, expiry: "2025-03-10", category: "Cholesterol" },
    { name: "Amoxicillin", qty: 300, price: 45, expiry: "2026-01-05", category: "Antibiotic" },
    { name: "Sildenafil", qty: 85, price: 250, expiry: "2027-02-14", category: "Men's Health" },
    { name: "Warfarin", qty: 200, price: 40, expiry: "2026-06-30", category: "Anticoagulant" },
    { name: "Digoxin", qty: 120, price: 110, expiry: "2025-09-12", category: "Heart Failure" },
    { name: "Paracetamol", qty: 500, price: 20, expiry: "2027-01-01", category: "Analgesic" },
    { name: "Cetirizine", qty: 100, price: 35, expiry: "2026-05-20", category: "Antihistamine" },
    { name: "Azithromycin", qty: 40, price: 90, expiry: "2025-11-15", category: "Antibiotic" },
    { name: "Pantoprazole", qty: 200, price: 80, expiry: "2026-10-10", category: "Antacid" }
];

let localSales = [];
let localHistory = [
    { patient: "Rahul Sharma", details: "Prescribed Amoxicillin 500mg for throat infection.", totalAmount: 450, timestamp: new Date(Date.now() - 86400000) },
    { patient: "Priya Patel", details: "Routine refill for Metformin 500mg.", totalAmount: 1100, timestamp: new Date(Date.now() - 172800000) }
];

// --- USER AUTHENTICATION ---
let users = [
    // Demo users (password: "demo123" for all)
    { id: 1, name: "Dr. Amit Shah", email: "doctor@pharmai.com", phone: "9876543210", password: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy", role: "doctor" },
    { id: 2, name: "Rahul Sharma", email: "patient@pharmai.com", phone: "9876543211", password: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy", role: "patient" },
    { id: 3, name: "MedSupply Co", email: "supplier@pharmai.com", phone: "9876543212", password: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy", role: "supplier" }
];

// --- AUTHENTICATION ROUTES ---

// Login
app.post('/api/login', async (req, res) => {
    const { username, password, role } = req.body;

    try {
        // Find user by email or phone
        const user = users.find(u =>
            (u.email === username || u.phone === username) && u.role === role
        );

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials or role' });
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Login failed' });
    }
});

// Signup
app.post('/api/signup', async (req, res) => {
    const { name, email, phone, password, role } = req.body;

    try {
        // Check if user exists
        const exists = users.find(u => u.email === email || u.phone === phone);

        if (exists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = {
            id: users.length + 1,
            name,
            email,
            phone,
            password: hashedPassword,
            role
        };

        users.push(newUser);

        res.json({ message: 'Account created successfully' });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ message: 'Signup failed' });
    }
});

// Verify token middleware
function verifyToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
}


// --- ADVANCED INTERACTION ENGINE (HASHMAP + BIG DATA) ---
const interactionMap = new Map();
const rawInteractions = [
    // --- CARDIOLOGY ---
    { drugs: ["aspirin", "warfarin"], severity: "Major", risk: "Critical", effects: "Severe hemorrhage.", mechanism: "Additive antiplatelet + anticoagulant.", rec: "Contraindicated." },
    { drugs: ["clopidogrel", "omeprazole"], severity: "Major", risk: "High", effects: "Clot failure.", mechanism: "CYP2C19 inhibition blocks clopidogrel.", rec: "Use Pantoprazole." },
    { drugs: ["digoxin", "amiodarone"], severity: "Major", risk: "High", effects: "Digoxin toxicity.", mechanism: "P-gp inhibition.", rec: "Reduce Digoxin 50%." },
    { drugs: ["sildenafil", "nitroglycerin"], severity: "Major", risk: "Fatal", effects: "Hypotensive shock.", mechanism: "Synergistic vasodilation.", rec: "STRICT CONTRAINDICATION." },
    { drugs: ["spironolactone", "lisinopril"], severity: "Major", risk: "High", effects: "Hyperkalemia.", mechanism: "Additive potassium retention.", rec: "Monitor K+ levels." },
    { drugs: ["amiodarone", "warfarin"], severity: "Major", risk: "High", effects: "Severe bleeding.", mechanism: "CYP2C9 inhibition.", rec: "Monitor INR closely." },
    { drugs: ["verapamil", "atenolol"], severity: "Moderate", risk: "Medium", effects: "Bradycardia.", mechanism: "Additive AV node suppression.", rec: "Monitor heart rate." },

    // --- CNS & PSYCH ---
    { drugs: ["tramadol", "fluoxetine"], severity: "Major", risk: "High", effects: "Seizures, Serotonin Syndrome.", mechanism: "CYP2D6 inhibition.", rec: "Monitor close." },
    { drugs: ["sertraline", "phenelzine"], severity: "Major", risk: "Fatal", effects: "Serotonin Storm.", mechanism: "MAOI + SSRI.", rec: "Contraindicated (14 day washout)." },
    { drugs: ["lithium", "ibuprofen"], severity: "Major", risk: "High", effects: "Lithium Toxicity.", mechanism: "Reduced renal excretion.", rec: "Avoid NSAIDs." },
    { drugs: ["diazepam", "alcohol"], severity: "Major", risk: "High", effects: "Respiratory depression.", mechanism: "Additive CNS depression.", rec: "Avoid combination." },
    { drugs: ["amitriptyline", "tramadol"], severity: "Major", risk: "High", effects: "Serotonin Syndrome.", mechanism: "Additive serotoninergic effect.", rec: "Avoid combination." },
    { drugs: ["clozapine", "carbamazepine"], severity: "Major", risk: "Critical", effects: "Agranulocytosis.", mechanism: "Additive bone marrow suppression.", rec: "Contraindicated." },

    // --- ANTIBIOTICS & ANTIVIRALS ---
    { drugs: ["ciprofloxacin", "theophylline"], severity: "Major", risk: "High", effects: "Seizures.", mechanism: "CYP1A2 inhibition.", rec: "Monitor levels." },
    { drugs: ["doxycycline", "calcium"], severity: "Moderate", risk: "Medium", effects: "Antibiotic failure.", mechanism: "Chelation complex.", rec: "Separate by 2 hours." },
    { drugs: ["metronidazole", "alcohol"], severity: "Major", risk: "High", effects: "Violent vomiting.", mechanism: "Disulfiram-like reaction.", rec: "No alcohol for 48h." },
    { drugs: ["erythromycin", "simvastatin"], severity: "Major", risk: "High", effects: "Rhabdomyolysis.", mechanism: "CYP3A4 inhibition.", rec: "Contraindicated." },
    { drugs: ["ritonavir", "simvastatin"], severity: "Major", risk: "Fatal", effects: "Rhabdomyolysis.", mechanism: "Potent CYP3A4 inhibition.", rec: "Contraindicated." },
    { drugs: ["clarithromycin", "colchicine"], severity: "Major", risk: "Fatal", effects: "Colchicine toxicity.", mechanism: "P-gp and CYP3A4 inhibition.", rec: "Contraindicated in renal/hepatic impairment." },

    // --- NSAIDS & ANALGESICS ---
    { drugs: ["warfarin", "ibuprofen"], severity: "Major", risk: "High", effects: "GI Bleeding.", mechanism: "Mucosal injury + Anticoagulation.", rec: "Use Acetaminophen." },
    { drugs: ["methotrexate", "naproxen"], severity: "Major", risk: "High", effects: "Methotrexate toxicity.", mechanism: "Reduced renal clearance.", rec: "Monitor blood counts." },
    { drugs: ["aspirin", "methotrexate"], severity: "Major", risk: "High", effects: "Pancytopenia.", mechanism: "Renal clearance competition.", rec: "Avoid combination." },

    // --- 100+ ADDITIONAL RISKY PAIRS ---
    { drugs: ["simvastatin", "gemfibrozil"], severity: "Major", risk: "High", effects: "Muscle breakdown.", mechanism: "Glucuronidation interference.", rec: "Avoid combination." },
    { drugs: ["atorvastatin", "clarithromycin"], severity: "Major", risk: "High", effects: "Statin toxicity.", mechanism: "CYP3A4 inhibition.", rec: "Hold statin during treatment." },
    { drugs: ["levofloxacin", "amiodarone"], severity: "Major", risk: "Critical", effects: "QT prolongation.", mechanism: "Additive cardiac effect.", rec: "Avoid if possible." },
    { drugs: ["fluconazole", "haloperidol"], severity: "Major", risk: "High", effects: "Fatal arrhythmia.", mechanism: "QT prolongation + CYP inhibition.", rec: "Contraindicated." },
    { drugs: ["phenytoin", "voriconazole"], severity: "Major", risk: "High", effects: "Treatment failure.", mechanism: "CYP induction.", rec: "Avoid combination." },
    { drugs: ["rifampin", "oral_contraceptives"], severity: "Major", risk: "High", effects: "Unplanned pregnancy.", mechanism: "CYP3A4 induction.", rec: "Use backup method." },
    { drugs: ["rifampin", "warfarin"], severity: "Major", risk: "Medium", effects: "Clot risk.", mechanism: "Increased metabolism of Warfarin.", rec: "Increase Warfarin dose." },
    { drugs: ["st_johns_wort", "cyclosporine"], severity: "Major", risk: "Fatal", effects: "Organ rejection.", mechanism: "Potent CYP induction.", rec: "Contraindicated." },
    { drugs: ["grapefruit_juice", "felodipine"], severity: "Major", risk: "High", effects: "Toxicity.", mechanism: "CYP3A4 inhibition in gut.", rec: "Avoid juice." },
    { drugs: ["tamsulosin", "sildenafil"], severity: "Moderate", risk: "Medium", effects: "Orthostatic hypotension.", mechanism: "Additive vasodilation.", rec: "Use caution." },
    { drugs: ["lisinopril", "potassium"], severity: "Major", risk: "High", effects: "Cardiac arrest.", mechanism: "Severe hyperkalemia.", rec: "Monitor K+ levels." },
    { drugs: ["furosemide", "gentamicin"], severity: "Major", risk: "High", effects: "Permanent deafness.", mechanism: "Additive ototoxicity.", rec: "Monitor hearing." },
    { drugs: ["allopurinol", "amoxicillin"], severity: "Moderate", risk: "Medium", effects: "Severe rash.", mechanism: "Unknown mechanism.", rec: "Monitor skin." },
    { drugs: ["methotrexate", "trimethoprim"], severity: "Major", risk: "Fatal", effects: "Bone marrow failure.", mechanism: "Folate antagonism.", rec: "Contraindicated." },
    { drugs: ["digoxin", "spironolactone"], severity: "Moderate", risk: "Low", effects: "Elevated Digoxin.", mechanism: "Reduced renal clearance.", rec: "Monitor levels." },
    { drugs: ["warfarin", "vitamin_k"], severity: "Major", risk: "High", effects: "Anticoagulant failure.", mechanism: "Direct antagonism.", rec: "Maintain stable intake." },
    { drugs: ["citalopram", "ondansetron"], severity: "Major", risk: "High", effects: "QT Prolongation.", mechanism: "Synergistic cardiac effect.", rec: "Avoid combination." },
    { drugs: ["venlafaxine", "tramadol"], severity: "Major", risk: "High", effects: "Serotonin Syndrome.", mechanism: "Additive reuptake inhibition.", rec: "Monitor." },
    { drugs: ["ibuprofen", "lisinopril"], severity: "Moderate", risk: "Medium", effects: "Kidney failure.", mechanism: "Reduced renal blood flow.", rec: "Use Paracetamol." },
    { drugs: ["metformin", "contrast_dye"], severity: "Major", risk: "Fatal", effects: "Lactic Acidosis.", mechanism: "Renal failure trigger.", rec: "Hold Metformin for 48h." },
    { drugs: ["insulin", "alcohol"], severity: "Major", risk: "High", effects: "Severe hypoglycemia.", mechanism: "Liver glucose inhibition.", rec: "Avoid heavy drinking." },
    { drugs: ["paracetamol", "alcohol"], severity: "Major", risk: "High", effects: "Liver failure.", mechanism: "Toxic metabolite induction.", rec: "Limit intake." },
    { drugs: ["levothyroxine", "iron"], severity: "Moderate", risk: "Low", effects: "Hypothyroidism.", mechanism: "Absorption inhibition.", rec: "Separate by 4 hours." },
    { drugs: ["alendronate", "calcium"], severity: "Moderate", risk: "Low", effects: "Treatment failure.", mechanism: "Bond interference.", rec: "Separate by 2 hours." },
    { drugs: ["phenytoin", "fluoxetine"], severity: "Major", risk: "High", effects: "Phenytoin toxicity.", mechanism: "CYP inhibition.", rec: "Monitor levels." },
    { drugs: ["valproic_acid", "lamotrigine"], severity: "Major", risk: "High", effects: "SJS/Toxic necrolysis.", mechanism: "Metabolism inhibition.", rec: "Slow titrations." },
    { drugs: ["carbamazepine", "erythromycin"], severity: "Major", risk: "High", effects: "Toxicity.", mechanism: "CYP3A4 inhibition.", rec: "Monitor levels." },
    { drugs: ["theophylline", "propranolol"], severity: "Major", risk: "High", effects: "Bronchospasm.", mechanism: "Antagonistic beta-effects.", rec: "Avoid in asthma." },
    { drugs: ["omeprazole", "vitamin_b12"], severity: "Moderate", risk: "Low", effects: "Anemia.", mechanism: "Reduced acid absorption.", rec: "Supplement B12." },
    { drugs: ["prednisone", "ibuprofen"], severity: "Major", risk: "High", effects: "GI Perforation.", mechanism: "Additive mucosal injury.", rec: "Use PPI protection." },
    { drugs: ["methadone", "diazepam"], severity: "Major", risk: "Fatal", effects: "Death.", mechanism: "Synergistic respiratory failure.", rec: "Avoid combination." },
    { drugs: ["lithium", "hydrochlorothiazide"], severity: "Major", risk: "High", effects: "Toxicity.", mechanism: "Reduced sodium increases Lithium.", rec: "Monitor levels." },
    { drugs: ["digoxin", "glycyrrhiza"], severity: "Major", risk: "High", effects: "Arrhythmia.", mechanism: "Hypokalemia synergy.", rec: "Avoid licorice." },
    { drugs: ["warfarin", "garlic"], severity: "Moderate", risk: "Medium", effects: "Bleeding.", mechanism: "Additive antiplatelet.", rec: "Use caution." },
    { drugs: ["clopidogrel", "aspirin"], severity: "Moderate", risk: "Medium", effects: "GI Bleeding.", mechanism: "Dual antiplatelet therapy.", rec: "Monitor." },
    { drugs: ["enoxaparin", "aspirin"], severity: "Major", risk: "High", effects: "Hematoma.", mechanism: "Additive anticoagulation.", rec: "Monitor." },
    { drugs: ["rivaroxaban", "ketoconazole"], severity: "Major", risk: "High", effects: "Bleeding.", mechanism: "CYP3A4 + P-gp inhibition.", rec: "Avoid combination." },
    { drugs: ["apixaban", "rifampin"], severity: "Major", risk: "High", effects: "Stroke.", mechanism: "Induced metabolism.", rec: "Avoid combination." },
    { drugs: ["gabapentin", "morphine"], severity: "Major", risk: "High", effects: "CNS depression.", mechanism: "Additive drowsiness.", rec: "Lower dose." },
    { drugs: ["baclofen", "alcohol"], severity: "Major", risk: "High", effects: "Coma.", mechanism: "Synergistic CNS suppression.", rec: "No alcohol." },
    { drugs: ["carvedilol", "insulin"], severity: "Moderate", risk: "Medium", effects: "Masked hypoglycemia.", mechanism: "Beta-blockade masking tachycardia.", rec: "Monitor sugars." },
    { drugs: ["glimepiride", "alcohol"], severity: "Major", risk: "High", effects: "Disulfiram-like reaction.", mechanism: "Acetaldehyde buildup.", rec: "No alcohol." },
    { drugs: ["metoclopramide", "haloperidol"], severity: "Major", risk: "High", effects: "Parkinsonism.", mechanism: "Additive dopamine blockade.", rec: "Avoid combination." },
    { drugs: ["sumatriptan", "sertraline"], severity: "Moderate", risk: "Medium", effects: "Serotonin Syndrome.", mechanism: "Requisition of serotonin.", rec: "Monitor." },
    { drugs: ["tramadol", "carbamazepine"], severity: "Major", risk: "Medium", effects: "Analgesic failure.", mechanism: "Induced metabolism of tramadol.", rec: "Avoid." },
    { drugs: ["levodopa", "vitamin_b6"], severity: "Moderate", risk: "Low", effects: "Reduced effect.", mechanism: "Increased peripheral metabolism.", rec: "Avoid high B6 diets." },
    { drugs: ["caffeine", "clozapine"], severity: "Moderate", risk: "Medium", effects: "Agitation.", mechanism: "CYP1A2 inhibition of caffeine.", rec: "Limit caffeine." },
    { drugs: ["tobacco", "clozapine"], severity: "Major", risk: "High", effects: "Reduced efficacy.", mechanism: "CYP1A2 induction by smoke.", rec: "Monitor dose if quitting." },
    { drugs: ["azathioprine", "allopurinol"], severity: "Major", risk: "Fatal", effects: "Bone marrow failure.", mechanism: "Xanthine oxidase inhibition.", rec: "Reduce Aza dose by 75%." },
    { drugs: ["cyclophosphamide", "allopurinol"], severity: "Moderate", risk: "Medium", effects: "Increased toxicity.", mechanism: "Reduced renal clearance.", rec: "Monitor CBC." },
    { drugs: ["tacrolimus", "clarithromycin"], severity: "Major", risk: "High", effects: "Kidney failure.", mechanism: "Potent CYP3A4 inhibition.", rec: "Monitor levels." },
    { drugs: ["cyclosporine", "atorvastatin"], severity: "Major", risk: "High", effects: "Muscle death.", mechanism: "CYP3A4 inhibition.", rec: "Lower statin dose." },
    { drugs: ["tadalafil", "doxazosin"], severity: "Moderate", risk: "Medium", effects: "Hypotension.", mechanism: "Additive vasodilation.", rec: "Monitor BP." },
    { drugs: ["clonidine", "propranolol"], severity: "Major", risk: "High", effects: "Rebound hypertension.", mechanism: "Sympathetic overactivity.", rec: "Do not stop suddenly." },
    { drugs: ["hydrochlorothiazide", "digoxin"], severity: "Major", risk: "High", effects: "Toxicity.", mechanism: "Hypokalemia induced sensitivity.", rec: "Monitor K+." },
    { drugs: ["amlodipine", "simvastatin"], severity: "Moderate", risk: "Medium", effects: "Muscle pain.", mechanism: "CYP3A4 competition.", rec: "Max Simva 20mg." },
    { drugs: ["diltiazem", "midazolam"], severity: "Major", risk: "High", effects: "Prolonged sedation.", mechanism: "CYP3A4 inhibition.", rec: "Avoid combination." },
    { drugs: ["voriconazole", "midazolam"], severity: "Major", risk: "High", effects: "Deep coma.", mechanism: "Potent CYP3A4 inhibition.", rec: "Avoid combination." },
    { drugs: ["st_johns_wort", "oral_contraceptives"], severity: "Major", risk: "High", effects: "Failure.", mechanism: "Induced metabolism.", rec: "Avoid combination." },
    { drugs: ["cimetidine", "warfarin"], severity: "Major", risk: "High", effects: "Bleeding.", mechanism: "CYP inhibition.", rec: "Use Famotidine." },
    { drugs: ["phenobarbital", "warfarin"], severity: "Major", risk: "High", effects: "Blood clots.", mechanism: "Potent CYP induction.", rec: "Avoid." },
    { drugs: ["amiodarone", "digoxin"], severity: "Major", risk: "High", effects: "Digoxin toxicity.", mechanism: "P-gp inhibition.", rec: "Half Digoxin dose." },
    { drugs: ["colesevelam", "levothyroxine"], severity: "Moderate", risk: "Low", effects: "Hypothyroidism.", mechanism: "Binding in gut.", rec: "Separate by 4 hours." },
    { drugs: ["magnesium_hydroxide", "ciprofloxacin"], severity: "Major", risk: "High", effects: "Sepsis/Failure.", mechanism: "Chelation.", rec: "Separate by 2 hours." },
    { drugs: ["ketoconazole", "alcohol"], severity: "Moderate", risk: "Medium", effects: "Vomiting.", mechanism: "Disulfiram-like.", rec: "No alcohol." },
    { drugs: ["bisoprolol", "diltiazem"], severity: "Major", risk: "High", effects: "Heart block.", mechanism: "AV node suppression.", rec: "Avoid combination." },
    { drugs: ["atenolol", "insulin"], severity: "Moderate", risk: "Medium", effects: "Hypoglycemia.", mechanism: "Sympathetic masking.", rec: "Check sugar." },
    { drugs: ["spironolactone", "potassium_chloride"], severity: "Major", risk: "Fatal", effects: "Cardiac arrest.", mechanism: "Severe hyperkalemia.", rec: "Contraindicated." },
    { drugs: ["valsartan", "aliskiren"], severity: "Major", risk: "High", effects: "Renal failure.", mechanism: "RAS blockade synergy.", rec: "Avoid in Diabetes." },
    { drugs: ["enalapril", "lithium"], severity: "Major", risk: "High", effects: "Lithium toxicity.", mechanism: "Reduced renal clearance.", rec: "Monitor levels." },
    { drugs: ["celecoxib", "warfarin"], severity: "Major", risk: "High", effects: "Internal bleed.", mechanism: "Antiplatelet synergy.", rec: "Avoid." },
    { drugs: ["ketorolac", "aspirin"], severity: "Major", risk: "High", effects: "Kidney failure.", mechanism: "Prostaglandin inhibition.", rec: "Contraindicated." },
    { drugs: ["clozapine", "risperidone"], severity: "Moderate", risk: "Medium", effects: "QT prolongation.", mechanism: "Additive cardiac effect.", rec: "Monitor EKG." },
    { drugs: ["quetiapine", "fluconazole"], severity: "Major", risk: "High", effects: "Sedation.", mechanism: "CYP3A4 inhibition.", rec: "Monitor." },
    { drugs: ["bupropion", "selegiline"], severity: "Major", risk: "Fatal", effects: "Hypertensive crisis.", mechanism: "Dopamine surge.", rec: "Contraindicated." },
    { drugs: ["paroxetine", "moclobemide"], severity: "Major", risk: "Fatal", effects: "Death.", mechanism: "Serotonin Syndrome.", rec: "Contraindicated." },
    { drugs: ["linezolid", "sertraline"], severity: "Major", risk: "High", effects: "Serotonin Storm.", mechanism: "MAOI effect of Linezolid.", rec: "Avoid combination." },
    { drugs: ["phenylephrine", "isocarboxazid"], severity: "Major", risk: "Fatal", effects: "Stroke.", mechanism: "Adrenergic surge.", rec: "Contraindicated." },
    { drugs: ["pseudoephedrine", "phenelzine"], severity: "Major", risk: "Fatal", effects: "Crisis.", mechanism: "MAOI interaction.", rec: "Contraindicated." },
    { drugs: ["mirtazapine", "tramadol"], severity: "Moderate", risk: "Medium", effects: "Serotonin Syndrome.", mechanism: "Additive effect.", rec: "Monitor." },
    { drugs: ["haloperidol", "lithium"], severity: "Major", risk: "High", effects: "Encephalopathy.", mechanism: "Neural toxicity.", rec: "Monitor mental status." },
    { drugs: ["valproic_acid", "aspirin"], severity: "Moderate", risk: "Medium", effects: "VPA toxicity.", mechanism: "Protein binding displacement.", rec: "Monitor levels." },
    { drugs: ["topiramate", "acetazolamide"], severity: "Moderate", risk: "Medium", effects: "Kidney stones.", mechanism: "Carbonic anhydrase inhibition.", rec: "Drink water." },
    { drugs: ["phenytoin", "sucralfate"], severity: "Moderate", risk: "Low", effects: "Seizures.", mechanism: "Absorption inhibition.", rec: "Separate by 2 hours." },
    { drugs: ["levofloxacin", "multivitamins"], severity: "Moderate", risk: "Low", effects: "Failure.", mechanism: "Metal chelation.", rec: "Separate by 2 hours." },
    { drugs: ["doxycycline", "iron"], severity: "Moderate", risk: "Low", effects: "Failure.", mechanism: "Binding.", rec: "Separate." },
    { drugs: ["azithromycin", "amiodarone"], severity: "Major", risk: "High", effects: "Arrhythmia.", mechanism: "QT synergy.", rec: "Monitor." },
    { drugs: ["telithromycin", "simvastatin"], severity: "Major", risk: "High", effects: "Muscle breakdown.", mechanism: "CYP inhibition.", rec: "Avoid." },
    { drugs: ["itraconazole", "quinidine"], severity: "Major", risk: "Fatal", effects: "Death.", mechanism: "CYP + P-gp inhibition.", rec: "Contraindicated." },
    { drugs: ["saquinavir", "rifampin"], severity: "Major", risk: "High", effects: "Efficacy loss.", mechanism: "CYP induction.", rec: "Avoid." },
    { drugs: ["efavirenz", "methadone"], severity: "Moderate", risk: "Medium", effects: "Withdrawal.", mechanism: "Metabolism induction.", rec: "Increase methadone." },
    { drugs: ["tenofovir", "didanosine"], severity: "Major", risk: "High", effects: "Toxicity.", mechanism: "Metabolism interference.", rec: "Avoid combination." },
    { drugs: ["zidovudine", "ganciclovir"], severity: "Major", risk: "High", effects: "Anemia.", mechanism: "Additive cytotoxicity.", rec: "Monitor CBC." },
    { drugs: ["cyclosporine", "nsaids"], severity: "Major", risk: "High", effects: "Kidney death.", mechanism: "Renal ischemia synergy.", rec: "Avoid NSAIDs." },
    { drugs: ["tacrolimus", "grapefruit"], severity: "Major", risk: "High", effects: "Toxicity.", mechanism: "CYP inhibition.", rec: "Avoid grapefruit." },
    { drugs: ["sirolimus", "ketoconazole"], severity: "Major", risk: "High", effects: "Toxicity.", mechanism: "Potent CYP inhibition.", rec: "Avoid." },
    { drugs: ["tamoxifen", "fluoxetine"], severity: "Major", risk: "High", effects: "Cancer recurrence.", mechanism: "CYP2D6 inhibition blocks activation.", rec: "Avoid combination." },
    { drugs: ["anastrozole", "estrogen"], severity: "Major", risk: "High", effects: "Failure.", mechanism: "Direct antagonism.", rec: "Avoid." },
    { drugs: ["methotrexate", "ppi"], severity: "Moderate", risk: "Medium", effects: "Toxicity.", mechanism: "Reduced renal excretion.", rec: "Monitor levels." },
    { drugs: ["sildenafil", "isosorbide_mononitrate"], severity: "Major", risk: "Fatal", effects: "Death.", mechanism: "Nitric oxide surge.", rec: "STRICT CONTRAINDICATION." }
];

// Build Map
rawInteractions.forEach(i => {
    const key = i.drugs.sort().join('|').toLowerCase();
    interactionMap.set(key, i);
});

// --- API ENDPOINTS ---

// 1. INVENTORY
app.get('/api/inventory', (req, res) => res.json(localInventory));

// 2. CHAT (PERSONA v4.0 - ROLE-BASED + GROUNDED)
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

app.post('/api/chat', async (req, res) => {
    const { message, context, role } = req.body;
    try {
        // SYSTEM INSTRUCTIONS BY ROLE
        const roleInstructions = {
            'patient': `You are the "Health Concierge AI". Your goal is to simplify medical info for patients. 
                        Use friendly tone. Tell them about their loyalty points and current orders. 
                        GROUNDING: Use Google Search if they ask about wellness trends or latest health news.`,
            'doctor': `You are the "Clinical Intelligence Agent". Your goal is to assist Doctors with evidence-based data.
                        Use professional medical terminology. provide interactions and dosing renal adjustments.
                        GROUNDING: Use Google Search for the latest FDA approvals, clinical trials (2024-2025), and Lancet/NEJM papers.`,
            'supplier': `You are the "Supply Chain Strategist". Your goal is to optimize pharmacy operations.
                        Focus on ROI, demand spikes, and stock forecasting.
                        GROUNDING: Use Google Search to check current global active pharmaceutical ingredient (API) prices, logistics news, and competitor stock levels.`
        };

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash", // Using 1.5 for better tool use
            tools: [
                {
                    googleSearchRetrieval: { dynamicRetrievalConfig: { mode: "DYNAMIC", dynamicThreshold: 0.3 } }
                }
            ],
            systemInstruction: `You are Dr. PharmAI v4.0. ROLE: ${roleInstructions[role || 'patient']}.

            **CONTEXT:**
            - Inventory: ${JSON.stringify(localInventory)}
            - Patient History: ${JSON.stringify(localHistory)}
            
            **BEHAVIOR:**
            - If user asks about web data (news, prices, research), TRIGGER Google Search.
            - Respond in the user's language (English/Marathi/Hindi).
            - Add "Real-Time Scan Complete ✅" tag if you used search grounding.
            - Keep responses premium and structured.`
        });

        const result = await model.generateContent(message);
        res.json({
            reply: result.response.text(),
            grounding: !!result.response.candidates[0].groundingMetadata
        });
    } catch (e) {
        console.error("❌ Gemini API Error:", e.message);
        res.json({ reply: "⚠️ Agent Offline. Please check your network or API quota. 🧡" });
    }
});

// 3. INTERACTION CHECKER (OPTIMIZED)
app.post('/api/check-interaction', async (req, res) => {
    const { drug1, drug2 } = req.body;
    if (!drug1 || !drug2) return res.status(400).json({ error: "Missing input" });

    const key = [drug1.trim().toLowerCase(), drug2.trim().toLowerCase()].sort().join('|');

    // A. Map Lookup
    if (interactionMap.has(key)) {
        const f = interactionMap.get(key);
        return res.json({ interaction: true, risk: f.risk, title: f.severity + " Interaction", mech: f.mechanism, rec: f.rec, source: "Database (Instant)" });
    }

    // B. AI Fallback
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(`Analyze interaction: ${drug1} + ${drug2}. JSON: { "interaction": bool, "risk": "string", "mechanism": "string", "recommendation": "string" }`);
        const text = result.response.text().replace(/```json|```/g, '').trim();
        res.json(JSON.parse(text));
    } catch (e) {
        res.json({ interaction: false, risk: "Low", title: "No Interaction Found", mech: "None reported.", rec: "Observe.", source: "Scan Failed" });
    }
});

// 4. SALES & ANALYTICS
app.post('/api/sales', (req, res) => {
    const { patient, items, totalAmount } = req.body;
    const sale = { patient, items, totalAmount, timestamp: new Date(), id: Math.random().toString(36).substr(2, 5) };

    items.forEach(i => {
        const product = localInventory.find(p => p.name === i.name);
        if (product) product.qty -= i.qty;
    });

    localSales.push(sale);
    localHistory.unshift({ patient, details: `Purchased: ${items.map(i => i.name).join(', ')}`, totalAmount, timestamp: new Date() });
    if (localHistory.length > 50) localHistory.pop();

    res.json(sale);
});

app.get('/api/analytics', (req, res) => {
    const today = new Date().setHours(0, 0, 0, 0);
    const todaySales = localSales.filter(s => new Date(s.timestamp) >= today);
    const revenue = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);
    res.json({ todayRevenue: revenue, orderCount: todaySales.length, totalPatients: 2840 + localHistory.length });
});

app.get('/api/patient-history', (req, res) => res.json(localHistory));

// 5. PREDICTIONS & ALERTS
app.get('/api/predictions', (req, res) => {
    const days = [];
    const data = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(); d.setDate(d.getDate() + i);
        days.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
        data.push(Math.floor(Math.random() * 150) + 50);
    }
    res.json({ labels: days, datasets: [{ label: 'Predicted Demand', data, borderColor: '#6366f1', fill: true }] });
});

app.get('/api/expiry-alerts', (req, res) => {
    const alerts = localInventory.filter(i => {
        const days = (new Date(i.expiry) - new Date()) / (86400000);
        return days < 90;
    }).map(i => ({ name: i.name, expiry: i.expiry, status: "Warning" }));
    res.json(alerts);
});

app.get('/api/drugs', (req, res) => {
    const keys = Array.from(interactionMap.values()).flatMap(i => i.drugs);
    const all = [...new Set([...localInventory.map(i => i.name), ...keys])].sort();
    res.json(all);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 PHARMAI SYSTEM v4.0 [FULL SUITE]`);
    console.log(`🌐 Server: http://localhost:${PORT}`);
    console.log(`🧠 Map: ${interactionMap.size} High-Risk Pairs`);
});
