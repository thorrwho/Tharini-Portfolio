/* THARINI NAVEEN / project data shared by the hero rigs, the work grid and the detail dialog */
window.TN_PROJECTS = [
  {
    id: 'fairmesh', title: 'FairMesh Loyalty', year: '2026', badge: 'FM', c1: '#FF6B2B', c2: '#00E5A3',
    cat: 'FREELANCE / FULL-STACK', metric: 'CLIENT PRODUCTION APP',
    desc: 'A customer-facing grocery store loyalty app, built for a client. Shoppers earn points on every purchase and redeem them for discounts or for free cable, Wi-Fi and broadband from local internet providers.',
    stack: ['React', 'Node.js', 'REST APIs', 'Full-Stack'], repo: null, note: 'CLIENT PROJECT · SOURCE IS PRIVATE'
  },
  {
    id: 'medipredict', title: 'MediPredict AI', year: '2025', badge: 'MP', c1: '#FF2E7E', c2: '#00F0FF',
    cat: 'AI / HEALTHCARE', metric: '75.3% ACC // 0.826 AUC',
    desc: 'An end-to-end diabetes risk prediction app. A Random Forest classifier (75.3% accuracy, 0.826 AUC) sits behind a FastAPI backend, and a context-aware Llama 3.1 assistant explains each result. Containerised with Docker and deployed on Hugging Face Spaces.',
    stack: ['Python', 'Scikit-learn', 'FastAPI', 'Streamlit', 'Docker', 'Groq · Llama 3.1'], repo: 'diabetes-risk-predictor'
  },
  {
    id: 'rag', title: 'RAG Research Assistant', year: '2025', badge: 'RG', c1: '#B26BFF', c2: '#00E5A3',
    cat: 'RAG / LANGCHAIN', metric: 'LLAMA 3.3 70B + CHROMA',
    desc: 'A full-stack retrieval-augmented generation pipeline. Ask questions in plain language about your own PDF collections and get answers with page-level citations. React frontend, FastAPI backend, deployed on Vercel and Render at zero infrastructure cost.',
    stack: ['React', 'FastAPI', 'LangChain', 'ChromaDB', 'Llama 3.3 70B', 'Vercel', 'Render'], repo: 'ML-Research-Assistant--RAG'
  },
  {
    id: 'sahaaya', title: 'Sahaaya (ಸಹಾಯ)', year: '2025', badge: 'SH', c1: '#00E5A3', c2: '#FFB800',
    cat: 'REACT / CIVIC TECH', metric: 'MYSURU CIVIC-TECH',
    desc: 'A civic-tech web app that connects Mysuru residents with nearby helpers and volunteers. Built with a type-safe React 18 frontend and presented at a college ideathon.',
    stack: ['React 18', 'TypeScript', 'Vite', 'Tailwind CSS'], repo: 'sahaaya'
  },
  {
    id: 'lostfound', title: 'College Lost & Found', year: '2025', badge: 'LF', c1: '#00F0FF', c2: '#FF2E7E',
    cat: 'NODE / MONGODB', metric: 'JWT + AUTO-MATCHING',
    desc: 'A campus lost-and-found portal with image uploads, search and filters, JWT role-based access, an automatic item-matching engine and an admin approval dashboard.',
    stack: ['Node.js', 'Express', 'MongoDB', 'JWT Auth'], repo: 'college-lost-found-system'
  },
  {
    id: 'devalaya', title: 'DevAlaya Temple AI', year: '2025', badge: 'DA', c1: '#FF8A2B', c2: '#B26BFF',
    cat: 'AI / HERITAGE', metric: 'MOBILENET V2 + OCR',
    desc: 'A classifier that identifies Indian temple architecture styles across four classes, using MobileNet V2, OCR and NLP, trained on synthetic imagery generated with PIL.',
    stack: ['Python', 'CNN', 'MobileNet V2', 'OCR', 'NLP', 'PIL'], repo: null
  },
  {
    id: 'peppersense', title: 'PepperSense Diagnosis', year: '2025', badge: 'PS', c1: '#7CFF6B', c2: '#00F0FF',
    cat: 'RESEARCH / VISION', metric: 'SPRINGER LNCS + YOLOv12',
    desc: 'Co-authored a Springer LNCS literature survey, written in LaTeX, on black pepper leaf disease classification, and contributed to real-time YOLOv12 lesion detection with bounding boxes.',
    stack: ['Deep Learning', 'YOLOv12', 'LaTeX', 'Springer LNCS'], repo: null
  },
  {
    id: 'safelink', title: 'SafeLink AI', year: '2025', badge: 'SL', c1: '#FF2E7E', c2: '#FFB800',
    cat: 'JAVASCRIPT / SAFETY', metric: 'SCAM & URL DETECTOR',
    desc: 'A scam detection tool that checks text, URLs and uploaded files for risky patterns and shows clear visual risk signals straight away.',
    stack: ['JavaScript', 'Pattern analysis', 'Risk UI'], repo: 'SafeLink-AI'
  },
  {
    id: 'vibe', title: 'Vibe Coded Websites', year: '2026', badge: 'VC', c1: '#FF3D8B', c2: '#7CFF6B',
    cat: 'AI-BUILT / WEB', metric: '3 LIVE SITES',
    desc: 'Three small, opinionated web apps built fast with AI as a pair programmer, each with its own look and a working live demo.',
    stack: ['HTML', 'JavaScript', 'Claude API', 'Vercel'], repo: null,
    sites: [
      { name: 'Mood Picker', repo: 'mood-picker', live: 'https://mood-picker-mauve.vercel.app/',
        desc: 'Tell a deadpan ghost clerk how your week went and get a horror movie, game or series to match, picked from 153 real titles.' },
      { name: 'Resume Roaster', repo: 'resume-roaster', live: 'https://resume-roaster-alpha-ten.vercel.app/',
        desc: 'Paste a resume and get roasted by a baddie roti mascot. One line of the roast is real advice.' },
      { name: 'Scam Hai Kya?', repo: 'scam-hai-kya', live: 'https://scam-hai-kya.vercel.app/',
        desc: 'Paste an internship post and get its red flags, a sus score and a verdict stamp. Runs entirely in the browser.' }
    ]
  }
];
window.TN_GITHUB = 'https://github.com/thorrwho';
