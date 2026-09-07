// app.js
const { useState, useEffect } = React;

// Safe references to global modules
const Icon = window.Icon;
const CONFIG = window.CONFIG;
const DEFAULT_PROGRAMS = window.DEFAULT_PROGRAMS;
const NEWS_DATA = window.NEWS_DATA;

// --- HELPER: FORMAT GOOGLE SHEET CSV ROWS ---
const formatProgramsFromCSV = (rows) => {
    return rows
        .filter(r => (r.title_sr || r.title_lat || r.title_en))
        .map((r, index) => ({
            id: r.id ? parseInt(r.id, 10) : index + 1,
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

// --- SUBMISSION SERVICE (WITH ANTI-BOT HONEYPOT) ---
const submitToGoogleSheet = async (payload) => {
    if (!CONFIG.GOOGLE_SCRIPT_WEBAPP_URL || !CONFIG.GOOGLE_SCRIPT_WEBAPP_URL.trim()) {
        console.warn("GOOGLE_SCRIPT_WEBAPP_URL is not configured yet. Simulating success...");
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
    }

    return (
        <button 
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`px-6 py-3 rounded-full font-bold text-base transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${style} ${className}`}
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

// --- MAIN APP COMPONENT ---
function App() {
    const [lang, setLang] = useState(() => localStorage.getItem('naum_lang') || 'sr');
    const [currentPage, setCurrentPage] = useState('home');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeFilterId, setActiveFilterId] = useState('all');

    const [programs, setPrograms] = useState(DEFAULT_PROGRAMS);
    const [isProgramsLoading, setIsProgramsLoading] = useState(false);

    const t = (window.I18N && window.I18N[lang]) ? window.I18N[lang] : window.I18N['sr'];

    useEffect(() => {
        document.documentElement.lang = lang === 'en' ? 'en' : 'sr';
        localStorage.setItem('naum_lang', lang);
    }, [lang]);

    useEffect(() => {
        if (!CONFIG.GOOGLE_SHEET_CSV_URL || !CONFIG.GOOGLE_SHEET_CSV_URL.trim()) return;

        setIsProgramsLoading(true);
        fetch(CONFIG.GOOGLE_SHEET_CSV_URL)
            .then(response => {
                if (!response.ok) throw new Error("Network response was not ok");
                return response.text();
            })
            .then(csvText => {
                if (window.Papa) {
                    const parsed = window.Papa.parse(csvText, { header: true, skipEmptyLines: true });
                    if (parsed.data && parsed.data.length > 0) {
                        const formatted = formatProgramsFromCSV(parsed.data);
                        if (formatted.length > 0) setPrograms(formatted);
                    }
                }
            })
            .catch(error => {
                console.warn("Could not load Google Sheet, keeping default programs:", error);
            })
            .finally(() => {
                setIsProgramsLoading(false);
            });
    }, []);

    const navItems = [
        { id: 'home', label: t.nav.home },
        { id: 'about', label: t.nav.about },
        { id: 'programs', label: t.nav.programs },
        { id: 'mentors', label: t.nav.mentors },
        { id: 'apply', label: t.nav.apply },
        { id: 'news', label: t.nav.news },
        { id: 'contact', label: t.nav.contact },
    ];

    const navigateTo = (pageId) => {
        setCurrentPage(pageId);
        setIsMenuOpen(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getAreaTagStyle = (type) => {
        if (type === 'stem') return 'bg-teal-50 text-teal-700 border-teal-200';
        if (type === 'arts') return 'bg-pink-50 text-pink-700 border-pink-200';
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    };

    // --- VIEWS ---
    const HomeView = () => (
        <React.Fragment>
            <div className="relative bg-slate-950 text-white overflow-hidden rounded-b-[2.5rem] shadow-xl border-b border-slate-800">
                <div className="absolute -top-24 -left-20 w-80 h-80 bg-emerald-500/25 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute top-1/3 -right-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-24 left-1/3 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative px-6 py-20 md:py-28 flex flex-col items-center text-center max-w-4xl mx-auto z-10">
                    <span className="inline-flex items-center gap-2 bg-white/10 text-slate-200 border border-white/15 px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold mb-6 backdrop-blur-md">
                        <Icon name="sparkles" className="w-4 h-4 text-amber-400" />
                        {t.hero.badge}
                    </span>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
                        {t.hero.title1} <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-amber-300">
                            {t.hero.title2}
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl leading-relaxed">
                        {t.hero.desc}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <Button variant="primary" onClick={() => navigateTo('apply')} className="w-full sm:w-auto">
                            {t.hero.btnApply} <Icon name="arrow-right" className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost-white" onClick={() => navigateTo('mentors')} className="w-full sm:w-auto">
                            {t.hero.btnMentor}
                        </Button>
                    </div>
                </div>
            </div>

            <Section className="text-center pt-16">
                <span className="text-xs font-bold uppercase tracking-widest text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                    {t.missionShort.tag}
                </span>
                <h2 className="text-3xl font-extrabold text-slate-900 mt-4 mb-6">{t.missionShort.title}</h2>
                <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                    {t.missionShort.desc}
                </p>
            </Section>

            <Section className="my-6">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-pink-600 bg-pink-50 px-3 py-1 rounded-full border border-pink-200">
                            {t.featured.tag}
                        </span>
                        <h2 className="text-3xl font-bold text-slate-900 mt-3">{t.featured.title}</h2>
                        <p className="text-slate-500 mt-1">{t.featured.desc}</p>
                    </div>
                    <button onClick={() => navigateTo('programs')} className="text-teal-700 font-bold hidden md:flex items-center gap-1 hover:gap-2 transition-all">
                        {t.featured.allBtn} <Icon name="chevron-right" className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6">
                    {programs.slice(0, 3).map(program => {
                        const p = program[lang] || program['sr'];
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
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                                        p.status.includes('Попуњено') || p.status.includes('Popunjeno') || p.status.includes('Full') 
                                            ? 'bg-rose-50 text-rose-600' 
                                            : 'bg-emerald-50 text-emerald-700'
                                    }`}>
                                        {p.status}
                                    </span>
                                    <button 
                                        onClick={() => navigateTo('apply')}
                                        className="text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all p-1"
                                        title={t.featured.applyBtn}
                                    >
                                        <Icon name="arrow-right" className="w-5 h-5" />
                                    </button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
                <div className="mt-8 text-center md:hidden">
                    <Button variant="secondary" onClick={() => navigateTo('programs')} className="w-full">
                        {t.featured.allBtnMobile}
                    </Button>
                </div>
            </Section>

            <Section>
                <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl text-white overflow-hidden p-8 md:p-12 border border-slate-800 shadow-xl">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="max-w-xl">
                            <span className="text-pink-400 font-bold tracking-wider uppercase text-xs">{t.mentorCta.tag}</span>
                            <h2 className="text-3xl md:text-4xl font-extrabold mt-2 mb-4 leading-tight">
                                {t.mentorCta.title}
                            </h2>
                            <p className="text-slate-300 text-base md:text-lg mb-6 leading-relaxed">
                                {t.mentorCta.desc}
                            </p>
                            <Button variant="accent" onClick={() => navigateTo('mentors')}>
                                {t.mentorCta.btn} <Icon name="arrow-right" className="w-4 h-4" />
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

            <Section className="text-center pt-8 pb-16">
                <h3 className="text-slate-400 font-bold uppercase tracking-widest mb-8 text-xs">
                    {t.partners.title}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
                    {t.partners.items.map((partner, idx) => (
                        <div 
                            key={idx} 
                            className={`h-20 rounded-xl border flex items-center justify-center text-xs md:text-sm font-bold text-center px-4 transition-all hover:scale-102 shadow-sm ${partner.color}`}
                        >
                            {partner.name}
                        </div>
                    ))}
                </div>
            </Section>
        </React.Fragment>
    );

    const AboutView = () => (
        <Section>
            <div className="max-w-4xl mx-auto">
                <span className="text-xs font-bold uppercase tracking-widest text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                    {t.about.tag}
                </span>
                <h1 className="text-4xl font-extrabold text-slate-900 mt-3 mb-6">{t.about.title}</h1>
                
                <p className="text-xl text-slate-600 leading-relaxed mb-10">
                    {t.about.lead}
                </p>

                <div className="grid md:grid-cols-2 gap-6 my-10">
                    <div className="bg-gradient-to-br from-teal-50/70 to-emerald-50/50 p-6 rounded-2xl border-l-4 border-teal-500 shadow-sm">
                        <h3 className="text-2xl font-bold text-teal-950 mb-3">{t.about.missionTitle}</h3>
                        <p className="text-slate-700 leading-relaxed">
                            {t.about.missionText}
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-pink-50/70 to-amber-50/50 p-6 rounded-2xl border-l-4 border-pink-500 shadow-sm">
                        <h3 className="text-2xl font-bold text-pink-950 mb-3">{t.about.visionTitle}</h3>
                        <p className="text-slate-700 leading-relaxed">
                            {t.about.visionText}
                        </p>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mt-8">
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">{t.about.howTitle}</h3>
                    <p className="text-slate-600 leading-relaxed mb-4">
                        {t.about.howP1}
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                        {t.about.howP2}
                    </p>
                </div>
            </div>
        </Section>
    );

    const ProgramsView = () => {
        const filteredPrograms = activeFilterId === 'all'
            ? programs
            : programs.filter(p => p.ageGroup === activeFilterId);

        return (
            <Section>
                <div className="text-center max-w-2xl mx-auto mb-10">
                    <span className="text-xs font-bold uppercase tracking-widest text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                        {t.programsView.tag}
                    </span>
                    <h1 className="text-4xl font-extrabold text-slate-900 mt-3 mb-4">{t.programsView.title}</h1>
                    <p className="text-slate-600">{t.programsView.subtitle}</p>
                </div>

                <div className="flex overflow-x-auto pb-4 gap-2 mb-10 no-scrollbar md:justify-center">
                    {t.programsView.filters.map(filter => (
                        <button
                            key={filter.id}
                            onClick={() => setActiveFilterId(filter.id)}
                            className={`whitespace-nowrap px-5 py-2 rounded-full font-medium text-sm transition-all ${
                                activeFilterId === filter.id 
                                    ? 'bg-gradient-to-r from-teal-500 to-blue-600 text-white shadow-md shadow-teal-500/20' 
                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                            }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>

                {isProgramsLoading && (
                    <div className="text-center py-8 text-teal-600 font-semibold animate-pulse">
                        Учитавање програма...
                    </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                    {filteredPrograms.map(program => {
                        const p = program[lang] || program['sr'];
                        return (
                            <Card key={program.id} className="flex flex-col sm:flex-row gap-6 hover:border-teal-300 transition-colors">
                                <div className="w-full sm:w-1/3 bg-slate-100 rounded-xl h-44 sm:h-auto flex items-center justify-center text-slate-400">
                                    <Icon name="book-open" className="w-10 h-10 text-teal-600/50" />
                                </div>
                                <div className="flex-1 flex flex-col justify-between py-1">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getAreaTagStyle(program.areaType)}`}>
                                                {p.area}
                                            </span>
                                            <span className={`text-xs font-bold ${
                                                p.status.includes('Попуњено') || p.status.includes('Popunjeno') || p.status.includes('Full') 
                                                    ? 'text-rose-600' 
                                                    : 'text-emerald-600'
                                            }`}>
                                                {p.status}
                                            </span>
                                        </div>
                                        <h3 className="text-2xl font-bold text-slate-900 mb-2">{p.title}</h3>
                                        <p className="text-slate-600 text-sm mb-4 leading-relaxed">{p.description}</p>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                                        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                            <Icon name="user" className="w-3.5 h-3.5" /> {p.age}
                                        </span>
                                        <Button variant="primary" onClick={() => navigateTo('apply')} className="text-xs px-4 py-2">
                                            {t.featured.applyBtn}
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
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
                setStatusMessage(t.mentorsView.successMsg);
                setForm({ name: '', field: '', email: '', bio: '', hp_trap: '' });
            } catch (err) {
                alert("Error: " + err.message);
            } finally {
                setIsSubmitting(false);
            }
        };

        return (
            <Section>
                <div className="max-w-3xl mx-auto text-center mb-12">
                    <span className="text-xs font-bold uppercase tracking-widest text-pink-600 bg-pink-50 px-3 py-1 rounded-full border border-pink-200">
                        {t.mentorsView.tag}
                    </span>
                    <h1 className="text-4xl font-extrabold text-slate-900 mt-3 mb-4">{t.mentorsView.title}</h1>
                    <p className="text-lg text-slate-600 leading-relaxed">
                        {t.mentorsView.lead}
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-16">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center">
                        <div className="w-14 h-14 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-pink-100">
                            <Icon name="heart" className="w-7 h-7" />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 mb-2">{t.mentorsView.card1Title}</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">{t.mentorsView.card1Desc}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center">
                        <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-teal-100">
                            <Icon name="map-pin" className="w-7 h-7" />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 mb-2">{t.mentorsView.card2Title}</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">{t.mentorsView.card2Desc}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center">
                        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-100">
                            <Icon name="check-circle" className="w-7 h-7" />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 mb-2">{t.mentorsView.card3Title}</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">{t.mentorsView.card3Desc}</p>
                    </div>
                </div>

                <div className="bg-white p-8 md:p-10 rounded-3xl max-w-2xl mx-auto border border-slate-200 shadow-sm">
                    <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-slate-900">{t.mentorsView.formTitle}</h3>
                        <p className="text-sm text-slate-500 mt-1">{t.mentorsView.formSubtitle}</p>
                    </div>

                    {statusMessage && (
                        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2">
                            <Icon name="check-circle" className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            <span>{statusMessage}</span>
                        </div>
                    )}
                    
                    <form className="space-y-4" onSubmit={handleSubmit}>
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

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">{t.mentorsView.labelName}</label>
                            <input 
                                type="text" 
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm" 
                                placeholder={t.mentorsView.phName} 
                                required 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">{t.mentorsView.labelField}</label>
                            <input 
                                type="text" 
                                value={form.field}
                                onChange={e => setForm({ ...form, field: e.target.value })}
                                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm" 
                                placeholder={t.mentorsView.phField} 
                                required 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">{t.mentorsView.labelEmail}</label>
                            <input 
                                type="email" 
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm" 
                                placeholder="email@address.com" 
                                required 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">{t.mentorsView.labelBio}</label>
                            <textarea 
                                rows="4" 
                                value={form.bio}
                                onChange={e => setForm({ ...form, bio: e.target.value })}
                                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm" 
                                placeholder={t.mentorsView.phBio} 
                                required
                            ></textarea>
                        </div>
                        <Button variant="accent" type="submit" disabled={isSubmitting} className="w-full mt-2">
                            {isSubmitting ? t.submitting : t.mentorsView.submitBtn}
                        </Button>
                    </form>
                </div>
            </Section>
        );
    };

    const ApplyView = () => {
        const [form, setForm] = useState({
            childName: '',
            childSurname: '',
            birthDate: '',
            programTitle: programs[0] ? (programs[0][lang] || programs[0]['sr']).title : '',
            parentName: '',
            parentPhone: '',
            parentEmail: '',
            hp_trap: ''
        });
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [statusMessage, setStatusMessage] = useState('');

        const handleSubmit = async (e) => {
            e.preventDefault();
            setIsSubmitting(true);
            setStatusMessage('');

            try {
                await submitToGoogleSheet({
                    formType: 'enrollment',
                    lang: lang,
                    ...form
                });
                setStatusMessage(t.applyView.successMsg);
                setForm({
                    childName: '',
                    childSurname: '',
                    birthDate: '',
                    programTitle: programs[0] ? (programs[0][lang] || programs[0]['sr']).title : '',
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
                            {t.applyView.tag}
                        </span>
                        <h1 className="text-4xl font-extrabold text-slate-900 mt-3 mb-2">{t.applyView.title}</h1>
                        <p className="text-slate-500 text-sm">{t.applyView.subtitle}</p>
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
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">{t.applyView.childName}</label>
                                    <input 
                                        type="text" 
                                        value={form.childName}
                                        onChange={e => setForm({ ...form, childName: e.target.value })}
                                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm" 
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">{t.applyView.childSurname}</label>
                                    <input 
                                        type="text" 
                                        value={form.childSurname}
                                        onChange={e => setForm({ ...form, childSurname: e.target.value })}
                                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm" 
                                        required 
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">{t.applyView.birthDate}</label>
                                <input 
                                    type="date" 
                                    value={form.birthDate}
                                    onChange={e => setForm({ ...form, birthDate: e.target.value })}
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm bg-white" 
                                    required 
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">{t.applyView.chooseProgram}</label>
                                <select 
                                    value={form.programTitle}
                                    onChange={e => setForm({ ...form, programTitle: e.target.value })}
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm bg-white"
                                >
                                    {programs.map(p => {
                                        const item = p[lang] || p['sr'];
                                        return (
                                            <option key={p.id} value={`${item.title} (${item.age})`}>
                                                {item.title} — ({item.age})
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            <div className="border-t border-slate-100 pt-6">
                                <h4 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">{t.applyView.parentHeader}</h4>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">{t.applyView.parentName}</label>
                                        <input 
                                            type="text" 
                                            value={form.parentName}
                                            onChange={e => setForm({ ...form, parentName: e.target.value })}
                                            className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm" 
                                            required 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">{t.applyView.parentPhone}</label>
                                        <input 
                                            type="tel" 
                                            value={form.parentPhone}
                                            onChange={e => setForm({ ...form, parentPhone: e.target.value })}
                                            className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm" 
                                            placeholder="+387..." 
                                            required 
                                        />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">{t.applyView.parentEmail}</label>
                                    <input 
                                        type="email" 
                                        value={form.parentEmail}
                                        onChange={e => setForm({ ...form, parentEmail: e.target.value })}
                                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm" 
                                        placeholder="parent@email.com" 
                                        required 
                                    />
                                </div>
                            </div>

                            <Button variant="primary" type="submit" disabled={isSubmitting} className="w-full mt-4">
                                {isSubmitting ? t.submitting : t.applyView.submitBtn} <Icon name="arrow-right" className="w-4 h-4" />
                            </Button>
                        </form>
                    </div>

                    <div className="mt-12">
                        <h3 className="text-xl font-bold text-slate-900 mb-4 text-center">{t.applyView.faqTitle}</h3>
                        <div className="space-y-3">
                            <details className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 cursor-pointer">
                                <summary className="font-bold text-slate-800 text-sm">{t.applyView.faq1Q}</summary>
                                <p className="mt-2 text-slate-600 text-sm leading-relaxed">{t.applyView.faq1A}</p>
                            </details>
                            <details className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 cursor-pointer">
                                <summary className="font-bold text-slate-800 text-sm">{t.applyView.faq2Q}</summary>
                                <p className="mt-2 text-slate-600 text-sm leading-relaxed">{t.applyView.faq2A}</p>
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
                        {t.newsView.tag}
                    </span>
                    <h1 className="text-4xl font-extrabold text-slate-900 mt-2">{t.newsView.title}</h1>
                </div>
                
                <div className="grid gap-6">
                    {NEWS_DATA.map(news => {
                        const n = news[lang];
                        return (
                            <Card key={news.id} className="flex flex-col sm:flex-row gap-6 hover:border-teal-200 transition-colors">
                                <div className="bg-gradient-to-br from-teal-50 to-blue-50 w-full sm:w-48 h-40 rounded-xl flex-shrink-0 flex flex-col items-center justify-center text-teal-700 border border-teal-100">
                                    <Icon name="calendar" className="w-8 h-8 mb-1" />
                                    <span className="text-xs font-bold">{n.date}</span>
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <span className="text-xs font-bold uppercase tracking-wider text-pink-600 mb-1">{t.newsView.infoTag}</span>
                                    <h2 className="text-2xl font-bold text-slate-900 mb-2 hover:text-teal-700 cursor-pointer transition-colors">
                                        {n.title}
                                    </h2>
                                    <p className="text-slate-600 text-sm leading-relaxed mb-4">{n.summary}</p>
                                    <button className="text-teal-700 font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all self-start">
                                        {t.newsView.readMore} <Icon name="arrow-right" className="w-4 h-4" />
                                    </button>
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
                setStatusMessage(t.contactView.successMsg);
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
                            {t.contactView.tag}
                        </span>
                        <h1 className="text-4xl font-extrabold text-slate-900 mt-3 mb-4">{t.contactView.title}</h1>
                        <p className="text-slate-600 mb-8 leading-relaxed">{t.contactView.lead}</p>
                        
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="bg-teal-50 text-teal-700 p-3 rounded-xl border border-teal-100">
                                    <Icon name="map-pin" className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm">{t.contactView.addressLabel}</h4>
                                    <p className="text-slate-600 text-sm whitespace-pre-line">{t.contactView.addressVal}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="bg-pink-50 text-pink-700 p-3 rounded-xl border border-pink-100">
                                    <Icon name="mail" className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm">{t.contactView.emailLabel}</h4>
                                    <p className="text-slate-600 text-sm">info@naum-centar.org</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="bg-amber-50 text-amber-700 p-3 rounded-xl border border-amber-100">
                                    <Icon name="phone" className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm">{t.contactView.phoneLabel}</h4>
                                    <p className="text-slate-600 text-sm">+387 51 322 780</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-xl text-slate-900 mb-4">{t.contactView.formTitle}</h3>

                        {statusMessage && (
                            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2">
                                <Icon name="check-circle" className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                <span>{statusMessage}</span>
                            </div>
                        )}

                        <form className="space-y-4" onSubmit={handleSubmit}>
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

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">{t.contactView.nameLabel}</label>
                                <input 
                                    type="text" 
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    placeholder={t.contactView.namePh} 
                                    className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-teal-500" 
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">{t.contactView.emailLabelForm}</label>
                                <input 
                                    type="email" 
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    placeholder="email@address.com" 
                                    className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-teal-500" 
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">{t.contactView.msgLabel}</label>
                                <textarea 
                                    rows="4" 
                                    value={form.message}
                                    onChange={e => setForm({ ...form, message: e.target.value })}
                                    placeholder={t.contactView.msgPh} 
                                    className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-teal-500" 
                                    required
                                ></textarea>
                            </div>
                            <Button variant="primary" type="submit" disabled={isSubmitting} className="w-full">
                                {isSubmitting ? t.submitting : t.contactView.submitBtn}
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

            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div 
                            className="flex items-center gap-3 cursor-pointer group" 
                            onClick={() => navigateTo('home')}
                        >
                            <img 
                                src="logo.jpg" 
                                alt="НАУМ Лого" 
                                className="h-11 md:h-12 w-auto object-contain transition-transform group-hover:scale-105" 
                            />
                            <div className="hidden sm:block leading-tight text-xs font-bold text-slate-700 uppercase tracking-tight border-l pl-3 border-slate-200">
                                {t.brandSub}<br/>
                                <span className="text-teal-700 font-semibold">{t.facultySub}</span>
                            </div>
                        </div>

                        <nav className="hidden lg:flex items-center space-x-1">
                            {navItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => navigateTo(item.id)}
                                    className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                                        currentPage === item.id 
                                            ? 'bg-slate-900 text-white shadow-sm' 
                                            : 'text-slate-600 hover:text-teal-700 hover:bg-slate-100/80'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}

                            <div className="ml-2 mr-2">
                                <LanguageSelector currentLang={lang} onSelectLang={setLang} />
                            </div>

                            <Button variant="accent" onClick={() => navigateTo('apply')} className="text-xs py-2 px-4 ml-1">
                                {t.nav.enrollBtn}
                            </Button>
                        </nav>

                        <div className="flex items-center gap-2 lg:hidden">
                            <LanguageSelector currentLang={lang} onSelectLang={setLang} />
                            
                            <button 
                                className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                aria-label="Toggle menu"
                            >
                                {isMenuOpen ? <Icon name="x" className="w-6 h-6" /> : <Icon name="menu" className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {isMenuOpen && (
                    <div className="lg:hidden bg-white border-b border-slate-200 shadow-xl animate-in slide-in-from-top">
                        <div className="px-4 py-6 space-y-2">
                            {navItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => navigateTo(item.id)}
                                    className={`block w-full text-left px-4 py-3 rounded-xl text-base font-semibold ${
                                        currentPage === item.id 
                                            ? 'bg-slate-900 text-white' 
                                            : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                            <div className="pt-4 border-t border-slate-100">
                                <Button variant="accent" onClick={() => navigateTo('apply')} className="w-full justify-center">
                                    {t.nav.enrollBtn}
                                </Button>
                            </div>
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
                            <span className="text-white font-extrabold text-base tracking-tight">{t.brandSub} НАУМ</span>
                        </div>
                        <p className="max-w-md text-sm text-slate-400 leading-relaxed mb-6">
                            {t.footer.desc}
                        </p>
                        <p className="text-xs text-slate-500">
                            &copy; {new Date().getFullYear()} {t.brandSub} НАУМ. {t.footer.rights}
                        </p>
                    </div>
                    
                    <div>
                        <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-wider">{t.footer.quickLinks}</h4>
                        <ul className="space-y-2.5 text-sm">
                            <li><button onClick={() => navigateTo('programs')} className="hover:text-teal-400 transition-colors">{t.nav.programs}</button></li>
                            <li><button onClick={() => navigateTo('mentors')} className="hover:text-teal-400 transition-colors">{t.nav.mentors}</button></li>
                            <li><button onClick={() => navigateTo('apply')} className="hover:text-teal-400 transition-colors">{t.nav.apply}</button></li>
                            <li><button onClick={() => navigateTo('news')} className="hover:text-teal-400 transition-colors">{t.nav.news}</button></li>
                            <li><button onClick={() => navigateTo('contact')} className="hover:text-teal-400 transition-colors">{t.nav.contact}</button></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-wider">{t.footer.contactInfo}</h4>
                        <ul className="space-y-2.5 text-sm text-slate-400">
                            <li>{t.facultySub}</li>
                            <li>Булевар војводе Петра Бојовића 1А</li>
                            <li>78000 {t.footer.locationLine}</li>
                            <li className="text-teal-400">info@naum-centar.org</li>
                        </ul>
                    </div>
                </div>
            </footer>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);