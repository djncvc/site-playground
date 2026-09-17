// app.js
const { useState, useEffect } = React;

const Icon = window.Icon;
const CONFIG = window.CONFIG || {};
const DEFAULT_PROGRAMS = window.DEFAULT_PROGRAMS || [];
const DEFAULT_MENTORS = window.MENTORS_DATA || [];
const PARTNERS_DATA = window.PARTNERS_DATA || [];
const NEWS_DATA = window.NEWS_DATA || [];
const SOCIAL_LINKS = window.SOCIAL_LINKS || [];

// --- HELPER: FORMAT GOOGLE SHEET CSV ROWS (PROGRAMS) ---
// --- HELPER: FORMAT GOOGLE SHEET CSV ROWS (PROGRAMS) ---
const formatProgramsFromCSV = (rows) => {
    // Pametno prepoznavanje cjeline (i na srpskom i na engleskom)
    const resolveSectionType = (val) => {
        if (!val) return 'education';
        const s = val.toLowerCase().trim();
        if (s.includes('radionic') || s.includes('workshop')) return 'workshop';
        if (s.includes('aktivnost') || s.includes('activity')) return 'activity';
        return 'education';
    };

    return rows
        .filter(r => (r.title_sr || r.title_lat || r.title_en))
        .map((r, index) => ({
            id: r.id ? parseInt(r.id, 10) : index + 1,
            sectionType: resolveSectionType(r.sectionType || r.kategorija || r.category),
            areaType: (r.areaType || 'logic').toLowerCase().trim(),
            ageGroup: (r.ageGroup || 'primary').toLowerCase().trim(),
            sr: {
                title: r.title_sr || r.title_lat || '',
                age: r.age_sr || r.age_lat || '',
                area: r.area_sr || r.area_lat || '',
                status: r.status_sr || 'Отворене пријаве',
                description: r.desc_sr || r.desc_lat || ''
            },
            lat: {
                title: r.title_lat || r.title_sr || '',
                age: r.age_lat || r.age_sr || '',
                area: r.area_lat || r.area_sr || '',
                status: r.status_lat || 'Otvorene prijave',
                description: r.desc_lat || r.desc_sr || ''
            },
            en: {
                title: r.title_en || r.title_lat || '',
                age: r.age_en || r.age_lat || '',
                area: r.area_en || r.area_lat || '',
                status: r.status_en || 'Open',
                description: r.desc_en || r.desc_lat || ''
            }
        }));
};

// --- HELPER: FORMAT GOOGLE SHEET CSV ROWS (MENTORS) ---
const formatMentorsFromCSV = (rows) => {
    const gradients = [
        "from-teal-500 to-emerald-600",
        "from-blue-600 to-indigo-600",
        "from-pink-500 to-rose-600",
        "from-amber-500 to-orange-600"
    ];

    return rows
        .filter(r => r.name && r.name.trim() !== "")
        .map((r, index) => {
            const initials = r.name.split(" ").filter(w => !w.includes(".")).map(w => w[0]).slice(0, 2).join("") || "М";
            return {
                id: r.id ? parseInt(r.id, 10) : index + 1,
                name: r.name,
                photoUrl: r.photo_url ? r.photo_url.trim() : null,
                avatarBg: gradients[index % gradients.length],
                initials: initials,
                sr: {
                    role: r.role_sr || r.role_lat || '',
                    field: r.field_sr || r.field_lat || '',
                    bio: r.bio_sr || r.bio_lat || ''
                },
                lat: {
                    role: r.role_lat || r.role_sr || '',
                    field: r.field_lat || r.field_sr || '',
                    bio: r.bio_lat || r.bio_sr || ''
                },
                en: {
                    role: r.role_en || r.role_sr || '',
                    field: r.field_en || r.field_sr || '',
                    bio: r.bio_en || r.bio_sr || ''
                }
            };
        });
};

const formatNewsFromCSV = (rows) => {
    return rows
        .filter(r => (r.title_sr || r.title_lat || r.title_en))
        .map((r, index) => ({
            id: r.id ? parseInt(r.id, 10) : index + 1,
            linkUrl: r.link_url ? r.link_url.trim() : null,
            sr: {
                date: r.date_sr || r.date_lat || '',
                title: r.title_sr || r.title_lat || '',
                summary: r.summary_sr || r.summary_lat || ''
            },
            lat: {
                date: r.date_lat || r.date_sr || '',
                title: r.title_lat || r.title_sr || '',
                summary: r.summary_lat || r.summary_sr || ''
            },
            en: {
                date: r.date_en || r.date_sr || '',
                title: r.title_en || r.title_lat || '',
                summary: r.summary_en || r.summary_lat || ''
            }
        }));
};

// --- SUBMISSION SERVICE ---
const submitToGoogleSheet = async (payload) => {
    if (!CONFIG.GOOGLE_SCRIPT_WEBAPP_URL || !CONFIG.GOOGLE_SCRIPT_WEBAPP_URL.trim()) {
        console.warn("GOOGLE_SCRIPT_WEBAPP_URL is not configured. Simulating success...");
        await new Promise(resolve => setTimeout(resolve, 800));
        return { status: 'success' };
    }

    if (payload.hp_trap && payload.hp_trap.trim() !== "") {
        return { status: 'success' };
    }

    await fetch(CONFIG.GOOGLE_SCRIPT_WEBAPP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
    });

    return { status: 'success' };
};

// --- REUSABLE UI COMPONENTS ---
const Section = ({ children, className = "", id = "" }) => (
    <section id={id} className={`py-12 px-4 md:px-8 max-w-7xl mx-auto ${className}`}>
        {children}
    </section>
);

const Button = ({ children, variant = "primary", onClick, className = "", type = "button", disabled = false }) => {
    let style = "";
    if (variant === "primary") {
        style = "bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white shadow-lg shadow-teal-500/20";
    } else if (variant === "accent") {
        style = "bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 text-white shadow-lg shadow-pink-500/20";
    } else if (variant === "secondary") {
        style = "bg-white text-slate-800 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50";
    } else if (variant === "ghost-white") {
        style = "bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur-sm";
    } else if (variant === "disabled") {
        style = "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none";
    }

    return (
        <button 
            type={type}
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            className={`px-6 py-3 rounded-full font-bold text-base transition-all transform ${!disabled ? 'hover:-translate-y-0.5 active:translate-y-0' : ''} flex items-center justify-center gap-2 ${style} ${className}`}
        >
            {children}
        </button>
    );
};

const Card = ({ children, className = "" }) => (
    <div className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 p-6 ${className}`}>
        {children}
    </div>
);

const LanguageSelector = ({ currentLang, onSelectLang }) => {
    const langs = [
        { id: 'sr', label: 'ЋИР', title: 'Ћирилица' },
        { id: 'lat', label: 'LAT', title: 'Latinica' },
        { id: 'en', label: 'ENG', title: 'English' }
    ];

    return (
        <div className="flex items-center bg-slate-100 p-0.5 rounded-full border border-slate-200">
            {langs.map(l => (
                <button
                    key={l.id}
                    onClick={() => onSelectLang(l.id)}
                    title={l.title}
                    className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all ${
                        currentLang === l.id 
                            ? 'bg-white text-teal-700 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-900'
                    }`}
                >
                    {l.label}
                </button>
            ))}
        </div>
    );
};

const getPageFromHash = () => {
    const hash = window.location.hash.replace('#', '').trim();
    const validPages = ['home', 'about', 'programs', 'mentors', 'apply', 'news', 'contact'];
    return validPages.includes(hash) ? hash : 'home';
};

// --- MAIN APP COMPONENT ---
function App() {
    const [lang, setLang] = useState(() => localStorage.getItem('naum_lang') || 'sr');
    
    // Čita stranicu iz URL-a (npr. ako neko otvori sajt sa #programs ili klikne Back)
    const [currentPage, setCurrentPage] = useState(getPageFromHash);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeSectionType, setActiveSectionType] = useState('all');
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [selectedProgramForApply, setSelectedProgramForApply] = useState(null);

    const [programs, setPrograms] = useState(DEFAULT_PROGRAMS);
    const [isProgramsLoading, setIsProgramsLoading] = useState(false);
    const [mentors, setMentors] = useState(DEFAULT_MENTORS);

    const t = (window.I18N && window.I18N[lang]) ? window.I18N[lang] : (window.I18N ? window.I18N['sr'] : {});

    // 🔄 Osluškivanje strelica pretraživača ("Back" i "Forward")
    useEffect(() => {
        const handleBrowserNavigation = () => {
            const page = getPageFromHash();
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        window.addEventListener('popstate', handleBrowserNavigation);
        window.addEventListener('hashchange', handleBrowserNavigation);

        return () => {
            window.removeEventListener('popstate', handleBrowserNavigation);
            window.removeEventListener('hashchange', handleBrowserNavigation);
        };
    }, []);

    const [news, setNews] = useState(NEWS_DATA);

    // Fetch live news from Google Sheet
    useEffect(() => {
        if (!CONFIG.GOOGLE_SHEET_NEWS_CSV_URL || !CONFIG.GOOGLE_SHEET_NEWS_CSV_URL.trim()) return;

        fetch(CONFIG.GOOGLE_SHEET_NEWS_CSV_URL)
            .then(res => res.ok ? res.text() : Promise.reject())
            .then(csvText => {
                if (window.Papa) {
                    const parsed = window.Papa.parse(csvText, { header: true, skipEmptyLines: true });
                    if (parsed.data && parsed.data.length > 0) {
                        const formatted = formatNewsFromCSV(parsed.data);
                        if (formatted.length > 0) setNews(formatted);
                    }
                }
            })
            .catch(err => console.warn("Using default news:", err));
    }, []);

    useEffect(() => {
        document.documentElement.lang = lang === 'en' ? 'en' : 'sr';
        localStorage.setItem('naum_lang', lang);
    }, [lang]);

    // 1. Fetch live programs
    useEffect(() => {
        if (!CONFIG.GOOGLE_SHEET_CSV_URL || !CONFIG.GOOGLE_SHEET_CSV_URL.trim()) return;

        setIsProgramsLoading(true);
        fetch(CONFIG.GOOGLE_SHEET_CSV_URL)
            .then(res => res.ok ? res.text() : Promise.reject())
            .then(csvText => {
                if (window.Papa) {
                    const parsed = window.Papa.parse(csvText, { header: true, skipEmptyLines: true });
                    if (parsed.data && parsed.data.length > 0) {
                        const formatted = formatProgramsFromCSV(parsed.data);
                        if (formatted.length > 0) setPrograms(formatted);
                    }
                }
            })
            .catch(err => console.warn("Using default programs:", err))
            .finally(() => setIsProgramsLoading(false));
    }, []);

    // 2. Fetch live mentors from Nasi_Mentori sheet tab
    useEffect(() => {
        if (!CONFIG.GOOGLE_SHEET_MENTORS_CSV_URL || !CONFIG.GOOGLE_SHEET_MENTORS_CSV_URL.trim()) return;

        fetch(CONFIG.GOOGLE_SHEET_MENTORS_CSV_URL)
            .then(res => res.ok ? res.text() : Promise.reject())
            .then(csvText => {
                if (window.Papa) {
                    const parsed = window.Papa.parse(csvText, { header: true, skipEmptyLines: true });
                    if (parsed.data && parsed.data.length > 0) {
                        const formatted = formatMentorsFromCSV(parsed.data);
                        if (formatted.length > 0) setMentors(formatted);
                    }
                }
            })
            .catch(err => console.warn("Using default mentors:", err));
    }, []);

    const isClosedStatus = (statusStr) => {
            if (!statusStr) return false;
            const s = statusStr.toLowerCase();
            return s.includes('попуњено') || s.includes('popunjeno') || s.includes('затворено') || s.includes('zatvoreno') || s.includes('closed') || s.includes('full');
        };

        const isInPrepStatus = (statusStr) => {
            if (!statusStr) return false;
            const s = statusStr.toLowerCase();
            return s.includes('припрем') || s.includes('priprem') || s.includes('најав') || s.includes('najav') || s.includes('preparation') || s.includes('upcoming') || s.includes('soon');
        };

        const getStatusBadgeStyle = (statusStr) => {
            if (isClosedStatus(statusStr)) {
                return 'bg-rose-50 text-rose-600 border border-rose-200';
            }
            if (isInPrepStatus(statusStr)) {
                return 'bg-amber-50 text-amber-700 border border-amber-200';
            }
            return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
        };

    const handleApplyClick = (program) => {
            const pLang = program[lang] || program['sr'];
            if (isClosedStatus(pLang.status)) {
                alert(t?.closedNotice || "Пријаве су тренутно затворене.");
                return;
            }
            if (isInPrepStatus(pLang.status)) {
                alert(t?.inPrepNotice || "Овај садржај је тренутно у припреми. Пријаве ће бити отворене ускоро.");
                return;
            }
            setSelectedProgramForApply(`${pLang.title} (${pLang.age})`);
            navigateTo('apply');
        };

    const navigateTo = (pageId) => {
        setActiveDropdown(null);
        setIsMenuOpen(false);

        // Podkategorije u programima
        if (pageId === 'programs-education') {
            window.location.hash = 'programs';
            setCurrentPage('programs');
            setActiveSectionType('education');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        if (pageId === 'programs-workshop') {
            window.location.hash = 'programs';
            setCurrentPage('programs');
            setActiveSectionType('workshop');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        if (pageId === 'programs-activity') {
            window.location.hash = 'programs';
            setCurrentPage('programs');
            setActiveSectionType('activity');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        // Sekcije kod mentora
        if (pageId === 'mentors-our') {
            window.location.hash = 'mentors';
            setCurrentPage('mentors');
            setTimeout(() => {
                const el = document.getElementById('our-mentors-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 100);
            return;
        }
        if (pageId === 'mentors-apply') {
            window.location.hash = 'mentors';
            setCurrentPage('mentors');
            setTimeout(() => {
                const el = document.getElementById('mentor-form-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 100);
            return;
        }

        // Prijatelji i podrška
        if (pageId === 'friends-list') {
            window.location.hash = 'home';
            setCurrentPage('home');
            setTimeout(() => {
                const el = document.getElementById('partners-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 100);
            return;
        }
        if (pageId === 'friends-support') {
            window.location.hash = 'home';
            setCurrentPage('home');
            setTimeout(() => {
                const el = document.getElementById('support-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 100);
            return;
        }

        // FAQ sekcija
        if (pageId === 'faq') {
            window.location.hash = 'apply';
            setCurrentPage('apply');
            setTimeout(() => {
                const el = document.getElementById('faq-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 100);
            return;
        }

        // Standardna navigacija kroz stranice
        if (window.location.hash !== '#' + pageId) {
            window.location.hash = pageId;
        }
        setCurrentPage(pageId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getAreaTagStyle = (type) => {
        if (type === 'stem') return 'bg-teal-50 text-teal-700 border-teal-200';
        if (type === 'arts') return 'bg-pink-50 text-pink-700 border-pink-200';
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    };

    const ProgramCardsGrid = ({ items }) => (
        <div className="grid md:grid-cols-3 gap-6">
            {items.map(program => {
                const p = program[lang] || program['sr'];
                const closed = isClosedStatus(p.status);
                const inPrep = isInPrepStatus(p.status);
                return (
                    <Card key={program.id} className="flex flex-col h-full hover:border-teal-300 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <span className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1 rounded-full">
                                {p.age}
                            </span>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getAreaTagStyle(program.areaType)}`}>
                                {p.area}
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-teal-700 transition-colors">
                            {p.title}
                        </h3>
                        <p className="text-slate-600 mb-6 flex-grow text-sm leading-relaxed">
                            {p.description}
                        </p>
                        <div className="flex justify-between items-center mt-auto border-t border-slate-100 pt-4">
                            <span className={`text-xs font-bold px-2 py-1 rounded ${getStatusBadgeStyle(p.status)}`}>
                                {p.status}
                            </span>
                            
                            {closed ? (
                                <span className="text-xs text-slate-400 font-semibold italic cursor-not-allowed">
                                    {t?.sections?.closedBtn || "Пријаве затворене"}
                                </span>
                            ) : inPrep ? (
                                <span className="text-xs text-amber-700 font-semibold italic cursor-not-allowed">
                                    {t?.sections?.inPrepBtn || "У припреми"}
                                </span>
                            ) : (
                                <button 
                                    onClick={() => handleApplyClick(program)}
                                    className="text-teal-700 hover:text-teal-900 font-bold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-all"
                                >
                                    {t?.sections?.applyBtn || "Пријави се"} <Icon name="arrow-right" className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </Card>
                );
            })}
        </div>
    );

    const SupportForm = () => {
        const [form, setForm] = useState({ orgName: '', supportType: '', email: '', message: '', hp_trap: '' });
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [success, setSuccess] = useState(false);

        const handleSubmit = async (e) => {
            e.preventDefault();
            setIsSubmitting(true);
            try {
                await submitToGoogleSheet({
                    formType: 'support',
                    lang: lang,
                    ...form
                });
                setSuccess(true);
                setForm({ orgName: '', supportType: '', email: '', message: '', hp_trap: '' });
            } catch (err) {
                alert("Error: " + err.message);
            } finally {
                setIsSubmitting(false);
            }
        };

        return (
            <Card className="max-w-2xl mx-auto border-t-4 border-pink-500 shadow-md">
                <div className="text-center mb-6">
                    <span className="text-xs font-bold uppercase tracking-widest text-pink-600 bg-pink-50 px-3 py-1 rounded-full border border-pink-200">
                        {t?.supportSection?.tag || "Сарадња и донације"}
                    </span>
                    <h3 className="text-2xl font-bold text-slate-900 mt-3">{t?.supportSection?.title || "Подржи рад Центра НАУМ"}</h3>
                    <p className="text-sm text-slate-600 mt-2">{t?.supportSection?.desc || "Уколико желите подржати наш рад, јавите нам се."}</p>
                </div>

                {success && (
                    <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2">
                        <Icon name="check-circle" className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        <span>{t?.supportSection?.successMsg || "Хвала на подршци!"}</span>
                    </div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div style={{ display: 'none' }} aria-hidden="true">
                        <input type="text" name="hp_trap" value={form.hp_trap} onChange={e => setForm({ ...form, hp_trap: e.target.value })} tabIndex="-1" autoComplete="off" />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">{t?.supportSection?.orgLabel || "Назив организације / Име"}</label>
                        <input type="text" value={form.orgName} onChange={e => setForm({ ...form, orgName: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-pink-500" required />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">{t?.supportSection?.typeLabel || "Вид подршке"}</label>
                        <input type="text" value={form.supportType} onChange={e => setForm({ ...form, supportType: e.target.value })} placeholder={t?.supportSection?.typePh || "нпр. Донација, опрема, простор..."} className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-pink-500" required />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">{t?.supportSection?.emailLabel || "Контакт е-маил"}</label>
                        <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="kontakt@organizacija.org" className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-pink-500" required />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">{t?.supportSection?.noteLabel || "Порука / Приједлог"}</label>
                        <textarea rows="3" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-pink-500" required></textarea>
                    </div>
                    <Button variant="accent" type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? (t?.submitting || "Слање...") : (t?.supportSection?.submitBtn || "Пошаљи")}
                    </Button>
                </form>
            </Card>
        );
    };

    // --- VIEWS ---
    const HomeView = () => {
        const educationItems = programs.filter(p => p.sectionType === 'education');
        const workshopItems = programs.filter(p => p.sectionType === 'workshop');
        const activityItems = programs.filter(p => p.sectionType === 'activity');

        return (
            <React.Fragment>
                <div className="relative bg-slate-950 text-white overflow-hidden rounded-b-[2.5rem] shadow-xl border-b border-slate-800">
                    <div className="absolute -top-24 -left-20 w-80 h-80 bg-emerald-500/25 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute top-1/3 -right-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute -bottom-24 left-1/3 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative px-6 py-20 md:py-28 flex flex-col items-center text-center max-w-4xl mx-auto z-10">
                        <span className="inline-flex items-center gap-2 bg-white/10 text-slate-200 border border-white/15 px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold mb-6 backdrop-blur-md">
                            <Icon name="sparkles" className="w-4 h-4 text-amber-400" />
                            {t?.hero?.badge || "Центар за надареност НАУМ"}
                        </span>

                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
                            {t?.hero?.title1 || "Откривамо и развијамо"} <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-amber-300">
                                {t?.hero?.title2 || "таленте будућности"}
                            </span>
                        </h1>

                        <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl leading-relaxed">
                            {t?.hero?.desc || "НАУМ је мјесто гдје радозналост сусреће знање."}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                            <Button variant="primary" onClick={() => navigateTo('apply')} className="w-full sm:w-auto">
                                {t?.hero?.btnApply || "Пријави дијете"} <Icon name="arrow-right" className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost-white" onClick={() => navigateTo('mentors-apply')} className="w-full sm:w-auto">
                                {t?.hero?.btnMentor || "Постани ментор"}
                            </Button>
                        </div>
                    </div>
                </div>

                <Section className="text-center pt-16">
                    <span className="text-xs font-bold uppercase tracking-widest text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                        {t?.missionShort?.tag || "Ко смо ми"}
                    </span>
                    <h2 className="text-3xl font-extrabold text-slate-900 mt-4 mb-6">{t?.missionShort?.title || "Наша Мисија"}</h2>
                    <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                        {t?.missionShort?.desc || "Центар за надареност НАУМ..."}
                    </p>
                </Section>

                {/* 1. Образовни програми */}
                <Section className="my-6">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                                НАУМ курикулум
                            </span>
                            <h2 className="text-3xl font-bold text-slate-900 mt-3">{t?.sections?.educationTitle || "Образовни програми"}</h2>
                            <p className="text-slate-500 mt-1">{t?.sections?.educationDesc || "Континуирани семестрални програми"}</p>
                        </div>
                        <button onClick={() => navigateTo('programs-education')} className="text-teal-700 font-bold hidden md:flex items-center gap-1 hover:gap-2 transition-all">
                            {t?.sections?.allBtn || "Види све"} <Icon name="chevron-right" className="w-5 h-5" />
                        </button>
                    </div>
                    <ProgramCardsGrid items={educationItems} />
                </Section>

                {/* 2. Радионице */}
                <Section className="my-6">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-pink-600 bg-pink-50 px-3 py-1 rounded-full border border-pink-200">
                                Практичан рад
                            </span>
                            <h2 className="text-3xl font-bold text-slate-900 mt-3">{t?.sections?.workshopsTitle || "Радионице"}</h2>
                            <p className="text-slate-500 mt-1">{t?.sections?.workshopsDesc || "Тематске радионице"}</p>
                        </div>
                        <button onClick={() => navigateTo('programs-workshop')} className="text-teal-700 font-bold hidden md:flex items-center gap-1 hover:gap-2 transition-all">
                            {t?.sections?.allBtn || "Види све"} <Icon name="chevron-right" className="w-5 h-5" />
                        </button>
                    </div>
                    <ProgramCardsGrid items={workshopItems} />
                </Section>

                {/* 3. Активности */}
                <Section className="my-6">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                                Догађаји и сусрети
                            </span>
                            <h2 className="text-3xl font-bold text-slate-900 mt-3">{t?.sections?.activitiesTitle || "Активности"}</h2>
                            <p className="text-slate-500 mt-1">{t?.sections?.activitiesDesc || "Научни кампови, стручна предавања, стручна усавршавања, промоције резултата програма"}</p>
                        </div>
                        <button onClick={() => navigateTo('programs-activity')} className="text-teal-700 font-bold hidden md:flex items-center gap-1 hover:gap-2 transition-all">
                            {t?.sections?.allBtn || "Види све"} <Icon name="chevron-right" className="w-5 h-5" />
                        </button>
                    </div>
                    <ProgramCardsGrid items={activityItems} />
                </Section>

                {/* Call for Mentors Banner */}
                <Section>
                    <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl text-white overflow-hidden p-8 md:p-12 border border-slate-800 shadow-xl">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl pointer-events-none"></div>
                        
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="max-w-xl">
                                <span className="text-pink-400 font-bold tracking-wider uppercase text-xs">{t?.mentorCta?.tag || "Заједница стручњака"}</span>
                                <h2 className="text-3xl md:text-4xl font-extrabold mt-2 mb-4 leading-tight">
                                    {t?.mentorCta?.title || "Подијели знање, инспириши будућност"}
                                </h2>
                                <p className="text-slate-300 text-base md:text-lg mb-6 leading-relaxed">
                                    {t?.mentorCta?.desc || "Тражимо стручњаке за рад са младима."}
                                </p>
                                <Button variant="accent" onClick={() => navigateTo('mentors-apply')}>
                                    {t?.mentorCta?.btn || "Пријави се као ментор"} <Icon name="arrow-right" className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="flex-shrink-0">
                                <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-tr from-pink-500/30 to-amber-500/20 border border-white/20 backdrop-blur-md flex items-center justify-center text-amber-300">
                                    <Icon name="user" className="w-14 h-14 md:w-16 md:h-16" />
                                </div>
                            </div>
                        </div>
                    </div>
                </Section>

                {/* Partners Section (Prijatelji NAUM-a) */}
                <Section id="partners-section" className="text-center pt-12 pb-6 scroll-mt-24">
                    <span className="text-xs font-bold uppercase tracking-widest text-pink-600 bg-pink-50 px-3 py-1 rounded-full border border-pink-200">
                        {t?.partners?.title || "Пријатељи НАУМ-а"}
                    </span>
                    
                    {/* Motivacioni uvodni tekst */}
                    <div className="max-w-3xl mx-auto mt-4 mb-10">
                        <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 mb-3 leading-snug">
                            {t?.partners?.tagline || "Заједничка мисија. Заједничка подршка. Више прилика за таленте."}
                        </h3>
                        <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                            {t?.partners?.desc || "Пријатељи НАУМ-а су појединци, компаније, институције и организације који препознају значај улагања у потенцијал надарене и талентоване дјеце и младих и са нама дијеле мисију стварања подстицајног окружења за њихов развој."}
                        </p>
                    </div>

                    {/* Čiste kartice partnera (samo nazivi, bez uloga) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
                        {PARTNERS_DATA.map((partner, idx) => {
                            const partnerName = (lang === 'lat' ? partner.lat : lang === 'en' ? partner.en : partner.name) || partner.name;
                            return (
                                <div 
                                    key={idx} 
                                    className={`min-h-[88px] rounded-2xl border flex items-center justify-center text-center p-5 transition-all hover:scale-105 shadow-sm ${partner.color}`}
                                >
                                    <span className="font-extrabold text-base md:text-lg leading-snug">
                                        {partnerName}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </Section>

                {/* Support Form Section */}
                <Section id="support-section" className="pt-6 pb-16 scroll-mt-24">
                    <SupportForm />
                </Section>
            </React.Fragment>
        );
    };

    const AboutView = () => (
        <Section>
            <div className="max-w-4xl mx-auto">
                <span className="text-xs font-bold uppercase tracking-widest text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                    {t?.about?.tag || "Упознајте НАУМ"}
                </span>
                <h1 className="text-4xl font-extrabold text-slate-900 mt-3 mb-6">{t?.about?.title || "О Центру за надареност"}</h1>
                
                <p className="text-xl text-slate-600 leading-relaxed mb-10">
                    {t?.about?.lead}
                </p>

                <div className="grid md:grid-cols-2 gap-6 my-10">
                    <div className="bg-gradient-to-br from-teal-50/70 to-emerald-50/50 p-6 rounded-2xl border-l-4 border-teal-500 shadow-sm">
                        <h3 className="text-2xl font-bold text-teal-950 mb-3">{t?.about?.missionTitle || "Наша Мисија"}</h3>
                        <p className="text-slate-700 leading-relaxed">
                            {t?.about?.missionText}
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-pink-50/70 to-amber-50/50 p-6 rounded-2xl border-l-4 border-pink-500 shadow-sm">
                        <h3 className="text-2xl font-bold text-pink-950 mb-3">{t?.about?.visionTitle || "Наша Визија"}</h3>
                        <p className="text-slate-700 leading-relaxed">
                            {t?.about?.visionText}
                        </p>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mt-8">
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">{t?.about?.howTitle || "Како радимо?"}</h3>
                    <p className="text-slate-600 leading-relaxed mb-4">
                        {t?.about?.howP1}
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                        {t?.about?.howP2}
                    </p>
                </div>
            </div>
        </Section>
    );

    const ProgramsView = () => {
        const typeFilters = [
            { id: 'all', label: t?.nav?.programsSub?.all || "Сви садржаји" },
            { id: 'education', label: t?.nav?.programsSub?.education || "Образовни програми" },
            { id: 'workshop', label: t?.nav?.programsSub?.workshops || "Радионице" },
            { id: 'activity', label: t?.nav?.programsSub?.activities || "Активности" }
        ];

        const filtered = programs.filter(p => {
            return (activeSectionType === 'all') || (p.sectionType === activeSectionType);
        });

        return (
            <Section>
                <div className="text-center max-w-2xl mx-auto mb-10">
                    <span className="text-xs font-bold uppercase tracking-widest text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                        {t?.programsView?.tag || "Наша понуда"}
                    </span>
                    <h1 className="text-4xl font-extrabold text-slate-900 mt-3 mb-4">{t?.programsView?.title || "Наши Програми"}</h1>
                    <p className="text-slate-600">{t?.programsView?.subtitle || "Одаберите садржај"}</p>
                </div>

                <div className="flex overflow-x-auto pb-4 gap-2 mb-10 no-scrollbar justify-center">
                    {typeFilters.map(filter => (
                        <button
                            key={filter.id}
                            onClick={() => setActiveSectionType(filter.id)}
                            className={`whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm transition-all ${
                                activeSectionType === filter.id 
                                    ? 'bg-gradient-to-r from-teal-500 to-blue-600 text-white shadow-md shadow-teal-500/20' 
                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                            }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>

                {isProgramsLoading ? (
                    <div className="text-center py-8 text-teal-600 font-semibold animate-pulse">
                        Учитавање...
                    </div>
                ) : (
                    <ProgramCardsGrid items={filtered} />
                )}
            </Section>
        );
    };

    const MentorsView = () => {
        const [form, setForm] = useState({ name: '', field: '', email: '', bio: '', hp_trap: '' });
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [statusMessage, setStatusMessage] = useState('');

        const handleSubmit = async (e) => {
            e.preventDefault();
            setIsSubmitting(true);
            setStatusMessage('');

            try {
                await submitToGoogleSheet({
                    formType: 'mentor',
                    lang: lang,
                    ...form
                });
                setStatusMessage(t?.mentorsView?.successMsg || "Хвала на пријави!");
                setForm({ name: '', field: '', email: '', bio: '', hp_trap: '' });
            } catch (err) {
                alert("Error: " + err.message);
            } finally {
                setIsSubmitting(false);
            }
        };

        return (
            <Section>
                {/* 1. Наши ментори (Mentors Showcase) */}
                <div id="our-mentors-section" className="scroll-mt-24 mb-20">
                    <div className="max-w-3xl mx-auto text-center mb-12">
                        <span className="text-xs font-bold uppercase tracking-widest text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                            Академски тим
                        </span>
                        <h1 className="text-4xl font-extrabold text-slate-900 mt-3 mb-4">{t?.mentorsSection?.title || "Наши ментори"}</h1>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            {t?.mentorsSection?.subtitle || "Истакнути професори и стручњаци"}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {mentors.map(mentor => {
                            const mLang = mentor[lang] || mentor['sr'] || {};
                            return (
                                <Card key={mentor.id} className="flex flex-col text-center items-center hover:border-teal-300 transition-all p-8">
                                    {mentor.photoUrl ? (
                                        <img 
                                            src={mentor.photoUrl} 
                                            alt={mentor.name} 
                                            className="w-24 h-24 rounded-full object-cover shadow-md mb-4 border-2 border-teal-500" 
                                        />
                                    ) : (
                                        <div className={`w-24 h-24 rounded-full bg-gradient-to-tr ${mentor.avatarBg || "from-teal-500 to-emerald-600"} text-white flex items-center justify-center text-2xl font-extrabold shadow-lg mb-4`}>
                                            {mentor.initials || "М"}
                                        </div>
                                    )}

                                    <h3 className="text-xl font-bold text-slate-900 mb-1">{mentor.name}</h3>
                                    <span className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-2">
                                        {mLang.field || mentor.field}
                                    </span>
                                    <span className="text-xs text-slate-400 font-medium mb-4">{mLang.role || mentor.role}</span>
                                    <p className="text-slate-600 text-sm leading-relaxed mt-auto border-t border-slate-100 pt-4">
                                        {mLang.bio || mentor.bio}
                                    </p>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Пријава за нове менторе */}
                <div id="mentor-form-section" className="bg-white p-8 md:p-10 rounded-3xl max-w-2xl mx-auto border border-slate-200 shadow-sm scroll-mt-24">
                    <div className="text-center mb-6">
                        <span className="text-xs font-bold uppercase tracking-widest text-pink-600 bg-pink-50 px-3 py-1 rounded-full border border-pink-200">
                            {t?.mentorsView?.tag || "Конкурс"}
                        </span>
                        <h3 className="text-2xl font-bold text-slate-900 mt-2">{t?.mentorsSection?.applyHeading || "Пријава за нове менторе"}</h3>
                        <p className="text-sm text-slate-500 mt-1">{t?.mentorsSection?.applySub || "Попуните формулар испод."}</p>
                    </div>

                    {statusMessage && (
                        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2">
                            <Icon name="check-circle" className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            <span>{statusMessage}</span>
                        </div>
                    )}
                    
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div style={{ display: 'none' }} aria-hidden="true">
                            <input type="text" name="hp_trap" value={form.hp_trap} onChange={e => setForm({ ...form, hp_trap: e.target.value })} tabIndex="-1" autoComplete="off" />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">{t?.mentorsView?.labelName || "Име и Презиме"}</label>
                            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 text-sm outline-none" placeholder={t?.mentorsView?.phName} required />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">{t?.mentorsView?.labelField || "Област стручности"}</label>
                            <input type="text" value={form.field} onChange={e => setForm({ ...form, field: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 text-sm outline-none" placeholder={t?.mentorsView?.phField} required />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">{t?.mentorsView?.labelEmail || "Е-маил адреса"}</label>
                            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 text-sm outline-none" placeholder="email@address.com" required />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">{t?.mentorsView?.labelBio || "Кратка биографија"}</label>
                            <textarea rows="4" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 text-sm outline-none" placeholder={t?.mentorsView?.phBio} required></textarea>
                        </div>
                        <Button variant="accent" type="submit" disabled={isSubmitting} className="w-full mt-2">
                            {isSubmitting ? (t?.submitting || "Слање...") : (t?.mentorsView?.submitBtn || "Пошаљи пријаву")}
                        </Button>
                    </form>
                </div>
            </Section>
        );
    };

    
    const ApplyView = () => {
        const defaultSelected = selectedProgramForApply || (programs[0] ? `${(programs[0][lang] || programs[0]['sr']).title} (${(programs[0][lang] || programs[0]['sr']).age})` : '');
        
        const [form, setForm] = useState({
            childName: '',
            childSurname: '',
            birthDate: '',
            programTitle: defaultSelected,
            parentName: '',
            parentPhone: '',
            parentEmail: '',
            hp_trap: ''
        });
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [statusMessage, setStatusMessage] = useState('');

        const currentlySelectedProgramObj = programs.find(p => {
            const pLang = p[lang] || p['sr'];
            return `${pLang.title} (${pLang.age})` === form.programTitle;
        });
        const currentStatus = (currentlySelectedProgramObj && (currentlySelectedProgramObj[lang] || currentlySelectedProgramObj['sr']).status) || '';
        const isCurrentSelectionClosed = isClosedStatus(currentStatus);
        const isCurrentSelectionInPrep = isInPrepStatus(currentStatus);
        const cannotApply = isCurrentSelectionClosed || isCurrentSelectionInPrep;

        const handleSubmit = async (e) => {
            e.preventDefault();
            if (isCurrentSelectionClosed) {
                alert(t?.closedNotice || "Пријаве су тренутно затворене.");
                return;
            }
            if (isCurrentSelectionInPrep) {
                alert(t?.inPrepNotice || "Овај садржај је тренутно у припреми. Пријаве ће бити отворене ускоро.");
                return;
            }

            setIsSubmitting(true);
            setStatusMessage('');

            try {
                await submitToGoogleSheet({
                    formType: 'enrollment',
                    lang: lang,
                    ...form
                });
                setStatusMessage(t?.applyView?.successMsg || "Пријава је евидентирана!");
                setForm({
                    childName: '',
                    childSurname: '',
                    birthDate: '',
                    programTitle: defaultSelected,
                    parentName: '',
                    parentPhone: '',
                    parentEmail: '',
                    hp_trap: ''
                });
            } catch (err) {
                alert("Error: " + err.message);
            } finally {
                setIsSubmitting(false);
            }
        };

        return (
            <Section>
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                        <span className="text-xs font-bold uppercase tracking-widest text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                            {t?.applyView?.tag || "Упис"}
                        </span>
                        <h1 className="text-4xl font-extrabold text-slate-900 mt-3 mb-2">{t?.applyView?.title || "Пријавни формулар"}</h1>
                        <p className="text-slate-500 text-sm">{t?.applyView?.subtitle}</p>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="h-2 w-full bg-gradient-to-r from-emerald-400 via-cyan-400 via-pink-500 to-amber-400"></div>

                        {statusMessage && (
                            <div className="m-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2">
                                <Icon name="check-circle" className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                <span>{statusMessage}</span>
                            </div>
                        )}
                        
                        <form className="p-6 md:p-8 space-y-5" onSubmit={handleSubmit}>
                            {/* 🛡️ Skriveno Honeypot polje za botove (Test 12) */}
                            <div style={{ display: 'none' }} aria-hidden="true">
                                <input 
                                    type="text" 
                                    name="hp_trap" 
                                    value={form.hp_trap} 
                                    onChange={e => setForm({ ...form, hp_trap: e.target.value })} 
                                    tabIndex="-1" 
                                    autoComplete="off" 
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">{t?.applyView?.childName || "Име"}</label>
                                    <input 
                                        type="text" 
                                        value={form.childName} 
                                        onChange={e => setForm({ ...form, childName: e.target.value })} 
                                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none text-sm" 
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">{t?.applyView?.childSurname || "Презиме"}</label>
                                    <input 
                                        type="text" 
                                        value={form.childSurname} 
                                        onChange={e => setForm({ ...form, childSurname: e.target.value })} 
                                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none text-sm" 
                                        required 
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">{t?.applyView?.birthDate || "Датум рођења"}</label>
                                <input 
                                    type="date" 
                                    value={form.birthDate} 
                                    onChange={e => setForm({ ...form, birthDate: e.target.value })} 
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none text-sm bg-white" 
                                    required 
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">{t?.applyView?.chooseProgram || "Програм"}</label>
                                <select 
                                    value={form.programTitle}
                                    onChange={e => setForm({ ...form, programTitle: e.target.value })}
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none text-sm bg-white"
                                >
                                    {programs.map(p => {
                                        const item = p[lang] || p['sr'];
                                        const closed = isClosedStatus(item.status);
                                        const inPrep = isInPrepStatus(item.status);
                                        const tag = closed ? ` [${item.status}]` : inPrep ? ` [${item.status}]` : '';
                                        return (
                                            <option key={p.id} value={`${item.title} (${item.age})`}>
                                                {item.title} — ({item.age}){tag}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {/* Upozorenje ako je zatvoreno */}
                            {isCurrentSelectionClosed && (
                                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2">
                                    <span>⚠️</span> {t?.closedNotice || "Пријаве за овај програм су тренутно затворене."}
                                </div>
                            )}

                            {/* Obavještenje ako je u pripremi */}
                            {isCurrentSelectionInPrep && (
                                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold flex items-center gap-2">
                                    <span>ℹ️</span> {t?.inPrepNotice || "Овај садржај је тренутно у припреми. Пријаве ће бити отворене ускоро."}
                                </div>
                            )}

                            <div className="border-t border-slate-100 pt-6">
                                <h4 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">{t?.applyView?.parentHeader || "Контакт родитеља"}</h4>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">{t?.applyView?.parentName || "Име и Презиме"}</label>
                                        <input 
                                            type="text" 
                                            value={form.parentName} 
                                            onChange={e => setForm({ ...form, parentName: e.target.value })} 
                                            className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none text-sm" 
                                            required 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">{t?.applyView?.parentPhone || "Телефон"}</label>
                                        <input 
                                            type="tel" 
                                            value={form.parentPhone} 
                                            onChange={e => setForm({ ...form, parentPhone: e.target.value })} 
                                            className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none text-sm" 
                                            placeholder="+387..." 
                                            required 
                                        />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">{t?.applyView?.parentEmail || "Е-маил"}</label>
                                    <input 
                                        type="email" 
                                        value={form.parentEmail} 
                                        onChange={e => setForm({ ...form, parentEmail: e.target.value })} 
                                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none text-sm" 
                                        placeholder="parent@email.com" 
                                        required 
                                    />
                                </div>
                            </div>

                            <Button 
                                variant={cannotApply ? "disabled" : "primary"} 
                                type="submit" 
                                disabled={isSubmitting || cannotApply} 
                                className="w-full mt-4"
                            >
                                {isCurrentSelectionClosed 
                                    ? (t?.sections?.closedBtn || "Пријаве затворене")
                                    : isCurrentSelectionInPrep
                                        ? (t?.sections?.inPrepBtn || "У припреми")
                                        : (isSubmitting ? (t?.submitting || "Слање...") : (t?.applyView?.submitBtn || "Пошаљи пријаву"))}
                                {!cannotApply && <Icon name="arrow-right" className="w-4 h-4" />}
                            </Button>
                        </form>
                    </div>

                    {/* FAQ sekcija sa ID-jem za navigaciju (Test 14) */}
                    <div id="faq-section" className="mt-12 scroll-mt-24">
                        <h3 className="text-xl font-bold text-slate-900 mb-4 text-center">{t?.applyView?.faqTitle || "Често постављана питања"}</h3>
                        <div className="space-y-3">
                            <details className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 cursor-pointer">
                                <summary className="font-bold text-slate-800 text-sm">{t?.applyView?.faq1Q}</summary>
                                <p className="mt-2 text-slate-600 text-sm leading-relaxed">{t?.applyView?.faq1A}</p>
                            </details>
                            <details className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 cursor-pointer">
                                <summary className="font-bold text-slate-800 text-sm">{t?.applyView?.faq2Q}</summary>
                                <p className="mt-2 text-slate-600 text-sm leading-relaxed">{t?.applyView?.faq2A}</p>
                            </details>
                        </div>
                    </div>
                </div>
            </Section>
        );
    };

    const NewsView = () => (
        <Section>
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <span className="text-xs font-bold uppercase tracking-widest text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                        {t?.newsView?.tag || "Актуелности"}
                    </span>
                    <h1 className="text-4xl font-extrabold text-slate-900 mt-2">{t?.newsView?.title || "Вијести и Догађаји"}</h1>
                </div>
                
                <div className="grid gap-6">
                    {news.map(item => {
                        const n = item[lang] || item['sr'];
                        return (
                            <Card key={item.id} className="flex flex-col sm:flex-row gap-6 hover:border-teal-200 transition-colors">
                                <div className="bg-gradient-to-br from-teal-50 to-blue-50 w-full sm:w-48 h-40 rounded-xl flex-shrink-0 flex flex-col items-center justify-center text-teal-700 border border-teal-100">
                                    <Icon name="calendar" className="w-8 h-8 mb-1" />
                                    <span className="text-xs font-bold text-center px-2">{n.date}</span>
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <span className="text-xs font-bold uppercase tracking-wider text-pink-600 mb-1">{t?.newsView?.infoTag || "Информација"}</span>
                                    <h2 className="text-2xl font-bold text-slate-900 mb-2 hover:text-teal-700 cursor-pointer transition-colors">
                                        {n.title}
                                    </h2>
                                    <p className="text-slate-600 text-sm leading-relaxed mb-4">{n.summary}</p>
                                    {item.linkUrl ? (
                                        <a 
                                            href={item.linkUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-teal-700 hover:text-teal-900 font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all self-start"
                                        >
                                            {t?.newsView?.readMore || "Детаљније"} <Icon name="arrow-right" className="w-4 h-4" />
                                        </a>
                                    ) : (
                                        <span className="text-teal-700 font-bold text-sm flex items-center gap-1 self-start opacity-50 cursor-default">
                                            {t?.newsView?.readMore || "Детаљније"} <Icon name="arrow-right" className="w-4 h-4" />
                                        </span>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </Section>
    );

    const ContactView = () => {
        const [form, setForm] = useState({ name: '', email: '', message: '', hp_trap: '' });
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [statusMessage, setStatusMessage] = useState('');

        const handleSubmit = async (e) => {
            e.preventDefault();
            setIsSubmitting(true);
            setStatusMessage('');

            try {
                await submitToGoogleSheet({
                    formType: 'contact',
                    lang: lang,
                    ...form
                });
                setStatusMessage(t?.contactView?.successMsg || "Хвала на поруци!");
                setForm({ name: '', email: '', message: '', hp_trap: '' });
            } catch (err) {
                alert("Error: " + err.message);
            } finally {
                setIsSubmitting(false);
            }
        };

        return (
            <Section>
                <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                            {t?.contactView?.tag || "Контакт"}
                        </span>
                        <h1 className="text-4xl font-extrabold text-slate-900 mt-3 mb-4">{t?.contactView?.title || "Пишите нам"}</h1>
                        <p className="text-slate-600 mb-8 leading-relaxed">{t?.contactView?.lead}</p>
                        
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="bg-teal-50 text-teal-700 p-3 rounded-xl border border-teal-100">
                                    <Icon name="map-pin" className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm">{t?.contactView?.addressLabel || "Локација"}</h4>
                                    <p className="text-slate-600 text-sm whitespace-pre-line">{t?.contactView?.addressVal}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="bg-pink-50 text-pink-700 p-3 rounded-xl border border-pink-100">
                                    <Icon name="mail" className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm">{t?.contactView?.emailLabel || "Е-маил"}</h4>
                                    <a href="mailto:naum@ff.unibl.org" className="text-slate-600 hover:text-teal-700 text-sm transition-colors">
                                        naum@ff.unibl.org
                                    </a>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="bg-amber-50 text-amber-700 p-3 rounded-xl border border-amber-100">
                                    <Icon name="phone" className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm">{t?.contactView?.phoneLabel || "Телефон"}</h4>
                                    <p className="text-slate-600 text-sm">+387 51 322 780</p>
                                </div>
                            </div>
                            {/* Social Media Links */}
                            <div className="pt-6 border-t border-slate-200">
                                <h4 className="font-bold text-slate-900 text-sm mb-3">
                                    {t?.contactView?.socialTitle || "Пратите нас на друштвеним мрежама"}
                                </h4>
                                <div className="flex flex-wrap gap-2.5">
                                    {SOCIAL_LINKS.map(item => (
                                        <a 
                                            key={item.id}
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all shadow-sm ${item.color}`}
                                        >
                                            <Icon name={item.icon} className="w-4 h-4" />
                                            <span>{item.name}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-xl text-slate-900 mb-4">{t?.contactView?.formTitle || "Пошаљите упит"}</h3>

                        {statusMessage && (
                            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2">
                                <Icon name="check-circle" className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                <span>{statusMessage}</span>
                            </div>
                        )}

                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div style={{ display: 'none' }} aria-hidden="true">
                                <input type="text" name="hp_trap" value={form.hp_trap} onChange={e => setForm({ ...form, hp_trap: e.target.value })} tabIndex="-1" autoComplete="off" />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">{t?.contactView?.nameLabel || "Ваше Име"}</label>
                                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={t?.contactView?.namePh} className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-teal-500" required />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">{t?.contactView?.emailLabelForm || "Е-маил"}</label>
                                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@address.com" className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-teal-500" required />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">{t?.contactView?.msgLabel || "Порука"}</label>
                                <textarea rows="4" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder={t?.contactView?.msgPh} className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-teal-500" required></textarea>
                            </div>
                            <Button variant="primary" type="submit" disabled={isSubmitting} className="w-full">
                                {isSubmitting ? (t?.submitting || "Слање...") : (t?.contactView?.submitBtn || "Пошаљи поруку")}
                            </Button>
                        </form>
                    </div>
                </div>
            </Section>
        );
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-cyan-400 via-pink-500 to-amber-400"></div>

            {/* --- HEADER --- */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Added gap-4 lg:gap-8 to prevent squeezing */}
                    <div className="flex justify-between items-center h-20 gap-4 lg:gap-8">
                        
                        {/* Brand Logo & Title — Added mr-4 lg:mr-8 for guaranteed breathing room */}
                        <div 
                            className="flex items-center gap-3 cursor-pointer group flex-shrink-0 mr-4 lg:mr-8" 
                            onClick={() => navigateTo('home')}
                        >
                            <img 
                                src="logo.jpg" 
                                alt="НАУМ Лого" 
                                className="h-11 md:h-12 w-auto object-contain transition-transform group-hover:scale-105" 
                            />
                            <div className="hidden sm:flex flex-col justify-center border-l pl-3 border-slate-200 text-left">
                                <span className="text-xs md:text-sm font-bold text-slate-800 uppercase tracking-tight leading-tight whitespace-nowrap">
                                    {t?.facultyLine1 || "Филозофски факултет"}
                                </span>
                                <span className="text-[11px] md:text-xs font-semibold text-teal-700 leading-tight whitespace-nowrap">
                                    {t?.facultyLine2 || "Универзитет у Бањој Луци"}
                                </span>
                            </div>
                        </div>

                        {/* Desktop Navigation with Dropdowns — Optimized padding so it never crowds the logo */}
                        <nav className="hidden lg:flex items-center space-x-0.5 xl:space-x-1 ml-auto">
                            <button 
                                onClick={() => navigateTo('home')} 
                                className={`px-2.5 xl:px-3 py-1.5 xl:py-2 rounded-full text-xs xl:text-sm font-medium transition-all ${
                                    currentPage === 'home' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-teal-700'
                                }`}
                            >
                                {t?.nav?.home || "Почетна"}
                            </button>
                            <button 
                                onClick={() => navigateTo('about')} 
                                className={`px-2.5 xl:px-3 py-1.5 xl:py-2 rounded-full text-xs xl:text-sm font-medium transition-all ${
                                    currentPage === 'about' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-teal-700'
                                }`}
                            >
                                {t?.nav?.about || "О нама"}
                            </button>

                            {/* Dropdown 1: Програми */}
                            <div className="relative" onMouseEnter={() => setActiveDropdown('programs')} onMouseLeave={() => setActiveDropdown(null)}>
                                <button 
                                    onClick={() => navigateTo('programs')} 
                                    className={`px-2.5 xl:px-3 py-1.5 xl:py-2 rounded-full text-xs xl:text-sm font-medium transition-all flex items-center gap-1 ${
                                        currentPage === 'programs' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-teal-700'
                                    }`}
                                >
                                    {t?.nav?.programs || "Програми"} <Icon name="chevron-down" className="w-3.5 h-3.5 opacity-70" />
                                </button>
                                {activeDropdown === 'programs' && (
                                    <div className="absolute left-0 mt-1 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in duration-150">
                                        <button onClick={() => navigateTo('programs-education')} className="block w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-700">
                                            {t?.nav?.programsSub?.education || "Образовни програми"}
                                        </button>
                                        <button onClick={() => navigateTo('programs-workshop')} className="block w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-pink-50 hover:text-pink-700">
                                            {t?.nav?.programsSub?.workshops || "Радионице"}
                                        </button>
                                        <button onClick={() => navigateTo('programs-activity')} className="block w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-700">
                                            {t?.nav?.programsSub?.activities || "Активности"}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Dropdown 2: Ментори */}
                            <div className="relative" onMouseEnter={() => setActiveDropdown('mentors')} onMouseLeave={() => setActiveDropdown(null)}>
                                <button 
                                    onClick={() => navigateTo('mentors')} 
                                    className={`px-2.5 xl:px-3 py-1.5 xl:py-2 rounded-full text-xs xl:text-sm font-medium transition-all flex items-center gap-1 ${
                                        currentPage === 'mentors' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-teal-700'
                                    }`}
                                >
                                    {t?.nav?.mentors || "Ментори"} <Icon name="chevron-down" className="w-3.5 h-3.5 opacity-70" />
                                </button>
                                {activeDropdown === 'mentors' && (
                                    <div className="absolute left-0 mt-1 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in duration-150">
                                        <button onClick={() => navigateTo('mentors-our')} className="block w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-700">
                                            {t?.nav?.mentorsSub?.ourMentors || "Наши ментори"}
                                        </button>
                                        <button onClick={() => navigateTo('mentors-apply')} className="block w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-pink-50 hover:text-pink-700">
                                            {t?.nav?.mentorsSub?.applyMentor || "Пријава за менторе"}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Dropdown 3: Пријатељи НАУМ-а */}
                            <div className="relative" onMouseEnter={() => setActiveDropdown('friends')} onMouseLeave={() => setActiveDropdown(null)}>
                                <button 
                                    onClick={() => navigateTo('friends-list')} 
                                    className="px-2.5 xl:px-3 py-1.5 xl:py-2 rounded-full text-xs xl:text-sm font-medium transition-all flex items-center gap-1 text-slate-600 hover:text-teal-700"
                                >
                                    {t?.nav?.friends || "Пријатељи НАУМ-а"} <Icon name="chevron-down" className="w-3.5 h-3.5 opacity-70" />
                                </button>
                                {activeDropdown === 'friends' && (
                                    <div className="absolute left-0 mt-1 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in duration-150">
                                        <button onClick={() => navigateTo('friends-list')} className="block w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-700">
                                            {t?.nav?.friendsSub?.list || "Пријатељи Центра"}
                                        </button>
                                        <button onClick={() => navigateTo('friends-support')} className="block w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-pink-50 hover:text-pink-700">
                                            {t?.nav?.friendsSub?.support || "Подржи рад Центра"}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={() => navigateTo('apply')} 
                                className={`px-2.5 xl:px-3 py-1.5 xl:py-2 rounded-full text-xs xl:text-sm font-medium transition-all ${
                                    currentPage === 'apply' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-teal-700'
                                }`}
                            >
                                {t?.nav?.apply || "Пријаве"}
                            </button>
                            <button 
                                onClick={() => navigateTo('news')} 
                                className={`px-2.5 xl:px-3 py-1.5 xl:py-2 rounded-full text-xs xl:text-sm font-medium transition-all ${
                                    currentPage === 'news' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-teal-700'
                                }`}
                            >
                                {t?.nav?.news || "Вијести"}
                            </button>
                            <button 
                                onClick={() => navigateTo('contact')} 
                                className={`px-2.5 xl:px-3 py-1.5 xl:py-2 rounded-full text-xs xl:text-sm font-medium transition-all ${
                                    currentPage === 'contact' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-teal-700'
                                }`}
                            >
                                {t?.nav?.contact || "Контакт"}
                            </button>

                            <div className="ml-1 xl:ml-2 mr-1 xl:mr-2">
                                <LanguageSelector currentLang={lang} onSelectLang={setLang} />
                            </div>

                            <Button variant="accent" onClick={() => navigateTo('apply')} className="text-xs py-1.5 xl:py-2 px-3.5 xl:px-4 ml-1">
                                {t?.nav?.enrollBtn || "Упис полазника"}
                            </Button>
                        </nav>

                        {/* Mobile Controls */}
                        <div className="flex items-center gap-2 lg:hidden">
                            <LanguageSelector currentLang={lang} onSelectLang={setLang} />
                            <button 
                                className="p-2 rounded-xl text-slate-700 hover:bg-slate-100"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                            >
                                {isMenuOpen ? <Icon name="x" className="w-6 h-6" /> : <Icon name="menu" className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Dropdown Drawer */}
                {isMenuOpen && (
                    <div className="lg:hidden bg-white border-b border-slate-200 shadow-xl px-4 py-6 space-y-2 max-h-[80vh] overflow-y-auto">
                        <button onClick={() => navigateTo('home')} className="block w-full text-left px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50">{t?.nav?.home || "Почетна"}</button>
                        <button onClick={() => navigateTo('about')} className="block w-full text-left px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50">{t?.nav?.about || "О нама"}</button>
                        
                        <div className="border-l-2 border-teal-500 pl-3 py-1 space-y-1 my-2">
                            <span className="text-xs font-bold uppercase text-teal-700">{t?.nav?.programs || "Програми"}</span>
                            <button onClick={() => navigateTo('programs-education')} className="block w-full text-left py-1 text-sm text-slate-600">{t?.nav?.programsSub?.education || "Образовни програми"}</button>
                            <button onClick={() => navigateTo('programs-workshop')} className="block w-full text-left py-1 text-sm text-slate-600">{t?.nav?.programsSub?.workshops || "Радионице"}</button>
                            <button onClick={() => navigateTo('programs-activity')} className="block w-full text-left py-1 text-sm text-slate-600">{t?.nav?.programsSub?.activities || "Активности"}</button>
                        </div>

                        <div className="border-l-2 border-pink-500 pl-3 py-1 space-y-1 my-2">
                            <span className="text-xs font-bold uppercase text-pink-700">{t?.nav?.mentors || "Ментори"}</span>
                            <button onClick={() => navigateTo('mentors-our')} className="block w-full text-left py-1 text-sm text-slate-600">{t?.nav?.mentorsSub?.ourMentors || "Наши ментори"}</button>
                            <button onClick={() => navigateTo('mentors-apply')} className="block w-full text-left py-1 text-sm text-slate-600">{t?.nav?.mentorsSub?.applyMentor || "Пријава за менторе"}</button>
                        </div>

                        <div className="border-l-2 border-amber-500 pl-3 py-1 space-y-1 my-2">
                            <span className="text-xs font-bold uppercase text-amber-700">{t?.nav?.friends || "Пријатељи НАУМ-а"}</span>
                            <button onClick={() => navigateTo('friends-list')} className="block w-full text-left py-1 text-sm text-slate-600">{t?.nav?.friendsSub?.list || "Пријатељи Центра"}</button>
                            <button onClick={() => navigateTo('friends-support')} className="block w-full text-left py-1 text-sm text-slate-600">{t?.nav?.friendsSub?.support || "Подржи рад Центра"}</button>
                        </div>

                        <button onClick={() => navigateTo('apply')} className="block w-full text-left px-4 py-2 font-semibold text-slate-700">{t?.nav?.apply || "Пријаве"}</button>
                        <button onClick={() => navigateTo('news')} className="block w-full text-left px-4 py-2 font-semibold text-slate-700">{t?.nav?.news || "Вијести"}</button>
                        <button onClick={() => navigateTo('contact')} className="block w-full text-left px-4 py-2 font-semibold text-slate-700">{t?.nav?.contact || "Контакт"}</button>

                        <div className="pt-4 border-t border-slate-100">
                            <Button variant="accent" onClick={() => navigateTo('apply')} className="w-full justify-center">
                                {t?.nav?.enrollBtn || "Упис полазника"}
                            </Button>
                        </div>
                    </div>
                )}
            </header>

            <main className="flex-grow">
                {currentPage === 'home' && <HomeView />}
                {currentPage === 'about' && <AboutView />}
                {currentPage === 'programs' && <ProgramsView />}
                {currentPage === 'mentors' && <MentorsView />}
                {currentPage === 'apply' && <ApplyView />}
                {currentPage === 'news' && <NewsView />}
                {currentPage === 'contact' && <ContactView />}
            </main>

            <footer className="bg-slate-950 text-slate-400 py-12 md:py-16 border-t border-slate-900 mt-16">
                <div className="max-w-7xl mx-auto px-4 md:px-8 grid md:grid-cols-4 gap-10">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-3 mb-4">
                            <img src="logo.jpg" alt="НАУМ Лого" className="h-9 w-auto bg-white rounded-md p-1" />
                            <span className="text-white font-extrabold text-base tracking-tight">{t?.brandSub || "Центар за надареност НАУМ"}</span>
                        </div>
                        <p className="max-w-md text-sm text-slate-400 leading-relaxed mb-6">
                            {t?.footer?.desc || "Институционални оквир за подршку и развој надарене и талентоване дјеце и младих..."}
                        </p>
                                    <div className="flex gap-3 mb-6">
                                        {SOCIAL_LINKS.map(item => (
                                            <a 
                                                key={item.id}
                                                href={item.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title={item.name}
                                                className="w-9 h-9 bg-slate-800 text-slate-300 hover:text-white rounded-full hover:bg-teal-600 transition-all flex items-center justify-center"
                                            >
                                                <Icon name={item.icon} className="w-4 h-4" />
                                            </a>
                                        ))}
                                    </div>
                        <p className="text-xs text-slate-500">
                            &copy; {new Date().getFullYear()} {t?.brandSub || "Центар за надареност НАУМ"}. {t?.footer?.rights || "Сва права задржана."}
                        </p>
                    </div>
                    
                    <div>
                        <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-wider">{t?.footer?.quickLinks || "Брзи линкови"}</h4>
                        <ul className="space-y-2.5 text-sm">
                            <li><button onClick={() => navigateTo('programs')} className="hover:text-teal-400">{t?.nav?.programs || "Програми"}</button></li>
                            <li><button onClick={() => navigateTo('mentors-our')} className="hover:text-teal-400">{t?.nav?.mentorsSub?.ourMentors || "Наши ментори"}</button></li>
                            <li><button onClick={() => navigateTo('friends-list')} className="hover:text-teal-400">{t?.nav?.friends || "Пријатељи НАУМ-а"}</button></li>
                            <li><button onClick={() => navigateTo('friends-support')} className="hover:text-teal-400">{t?.nav?.friendsSub?.support || "Подржи рад Центра"}</button></li>
                            <li><button onClick={() => navigateTo('apply')} className="hover:text-teal-400">{t?.nav?.apply || "Пријаве"}</button></li>
                            <li><button onClick={() => navigateTo('faq')} className="hover:text-teal-400">{t?.footer?.faq || "Често постављана питања"}</button></li>
                            <li><button onClick={() => navigateTo('news')} className="hover:text-teal-400">{t?.nav?.news || "Вијести"}</button></li>
                            <li><button onClick={() => navigateTo('contact')} className="hover:text-teal-400">{t?.nav?.contact || "Контакт"}</button></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-wider">{t?.footer?.contactInfo || "Контакт инфо"}</h4>
                        <ul className="space-y-2.5 text-sm text-slate-400">
                            <li>{t?.facultySub || "Филозофски факултет Универзитета у Бањој Луци"}</li>
                            <li>{t?.footer?.addressLine || "Булевар војводе Петра Бојовића 1А"}</li>
                            <li>78000 {t?.footer?.locationLine || "Бања Лука, Република Српска"}</li>
                            <li>
                                <a href="mailto:naum@ff.unibl.org" className="text-teal-400 hover:underline">
                                    naum@ff.unibl.org
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </footer>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);