// config.js
window.CONFIG = {
    GOOGLE_SHEET_CSV_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRuTdNc35_TVGa9i8fx7xoWAKdaTjoJqRP6xA5SC2_DY2IJEyPwKnY94ExK0NWRJWKTE_0eYXELOzjP/pub?gid=0&single=true&output=csv",
    GOOGLE_SHEET_MENTORS_CSV_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRuTdNc35_TVGa9i8fx7xoWAKdaTjoJqRP6xA5SC2_DY2IJEyPwKnY94ExK0NWRJWKTE_0eYXELOzjP/pub?gid=1950315993&single=true&output=csv", 
    GOOGLE_SCRIPT_WEBAPP_URL: "https://script.google.com/macros/s/AKfycbwz2MfTB_oEiwbrfdWWzdZP4td0BuUG2ZbILnvMexVR7a6DQUyEm8QUFGCJPicF248F/exec"
    
};
// 1. PROGRAMS, WORKSHOPS & ACTIVITIES (Separated by sectionType)
window.DEFAULT_PROGRAMS = [
    // --- Образовни програми ---
    {
        id: 1,
        sectionType: "education",
        areaType: "logic",
        ageGroup: "preschool",
        sr: {
            title: "Мала школа мишљења",
            age: "Предшколски",
            area: "Логика и филозофија",
            status: "Отворене пријаве",
            description: "Развој критичког мишљења, логичког закључивања и радозналости кроз сократски дијалог и игре."
        },
        lat: {
            title: "Mala škola mišljenja",
            age: "Predškolski",
            area: "Logika i filozofija",
            status: "Otvorene prijave",
            description: "Razvoj kritičkog mišljenja, logičkog zaključivanja i radoznalosti kroz sokratski dijalog i igre."
        },
        en: {
            title: "Little School of Thought",
            age: "Preschool",
            area: "Logic & Philosophy",
            status: "Applications Open",
            description: "Fostering critical thinking, reasoning, and dialogue in young children through playful inquiry."
        }
    },
    {
        id: 2,
        sectionType: "education",
        areaType: "stem",
        ageGroup: "primary",
        sr: {
            title: "Млади математичари",
            age: "Основна школа",
            area: "STEM",
            status: "Попуњено",
            description: "Напредна математика, теорија бројева и нестандардни такмичарски задаци за талентоване основце."
        },
        lat: {
            title: "Mladi matematičari",
            age: "Osnovna škola",
            area: "STEM",
            status: "Popunjeno",
            description: "Napredna matematika, teorija brojeva i nestandardni takmičarski zadaci za talentovane osnovce."
        },
        en: {
            title: "Young Mathematicians",
            age: "Primary School",
            area: "STEM",
            status: "Full / Closed",
            description: "Advanced conceptual mathematics, number theory, and olympiad problem-solving."
        }
    },
    {
        id: 3,
        sectionType: "education",
        areaType: "stem",
        ageGroup: "primary",
        sr: {
            title: "Роботика и вештачка интелигенција",
            age: "Основна школа",
            area: "STEM",
            status: "Отворене пријаве",
            description: "Програмирање паметних система, сензора и микроконтролера уз упознавање са концептима АИ."
        },
        lat: {
            title: "Robotika i veštačka inteligencija",
            age: "Osnovna škola",
            area: "STEM",
            status: "Otvorene prijave",
            description: "Programiranje pametnih sistema, senzora i mikrokontrolera uz upoznavanje sa konceptima AI."
        },
        en: {
            title: "Robotics & Artificial Intelligence",
            age: "Primary School",
            area: "STEM",
            status: "Applications Open",
            description: "Coding smart systems, microcontrollers, robotics, and learning foundational AI concepts."
        }
    },

    // --- Радионице ---
    {
        id: 4,
        sectionType: "workshop",
        areaType: "arts",
        ageGroup: "secondary",
        sr: {
            title: "Креативно писање и новинарство",
            age: "Средња школа",
            area: "Умјетност",
            status: "Отворене пријаве",
            description: "Интензивна радионица наратива, стилистике, есејистике и истраживачког новинарства."
        },
        lat: {
            title: "Kreativno pisanje i novinarstvo",
            age: "Srednja škola",
            area: "Umjetnost",
            status: "Otvorene prijave",
            description: "Intenzivna radionica narativa, stilistike, esejistike i istraživačkog novinarstva."
        },
        en: {
            title: "Creative Writing & Journalism",
            age: "High School",
            area: "Arts & Humanities",
            status: "Applications Open",
            description: "Intensive workshop exploring narrative craft, essay writing, rhetoric, and investigative journalism."
        }
    },
    {
        id: 5,
        sectionType: "workshop",
        areaType: "stem",
        ageGroup: "primary",
        sr: {
            title: "Мали научни експерименти",
            age: "Основна школа",
            area: "STEM",
            status: "Отворене пријаве",
            description: "Практични лабораторијски експерименти из хемије и физике прилагођени млађим узрастима."
        },
        lat: {
            title: "Mali naučni eksperimenti",
            age: "Osnovna škola",
            area: "STEM",
            status: "Otvorene prijave",
            description: "Praktični laboratorijski eksperimenti iz hemije i fizike prilagođeni mlađim uzrastima."
        },
        en: {
            title: "Young Science Lab Experiments",
            age: "Primary School",
            area: "STEM",
            status: "Applications Open",
            description: "Hands-on laboratory experiments in chemistry and physics designed for young curious minds."
        }
    },

    // --- Активности ---
    {
        id: 6,
        sectionType: "activity",
        areaType: "stem",
        ageGroup: "primary",
        sr: {
            title: "Љетња научна школа и камп",
            age: "Основна и средња школа",
            area: "STEM и друштво",
            status: "Најава",
            description: "Вишедневни истраживачки боравак у природи уз предавања ментора, теренски рад и тимске пројекте."
        },
        lat: {
            title: "Ljetnja naučna škola i kamp",
            age: "Osnovna i srednja škola",
            area: "STEM i društvo",
            status: "Najava",
            description: "Višednevni istraživački boravak u prirodi uz predavanja mentora, terenski rad i timske projekte."
        },
        en: {
            title: "Summer Science Camp",
            age: "Primary & High School",
            area: "STEM & Nature",
            status: "Upcoming",
            description: "Multi-day science camp featuring outdoor research, mentor talks, and collaborative projects."
        }
    },
    {
        id: 7,
        sectionType: "activity",
        areaType: "logic",
        ageGroup: "secondary",
        sr: {
            title: "Квиз знања и дебатни турнир",
            age: "Средња школа",
            area: "Логика и реторика",
            status: "Отворене пријаве",
            description: "Такмичење у аргументованој дебати, брзини размишљања и општој ерудицији за омладинске тимове."
        },
        lat: {
            title: "Kviz znanja i debatni turnir",
            age: "Srednja škola",
            area: "Logika i retorika",
            status: "Otvorene prijave",
            description: "Takmičenje u argumentovanoj debati, brzini razmišljanja i opštoj erudiciji za omladinske timove."
        },
        en: {
            title: "Debate Tournament & Knowledge Quiz",
            age: "High School",
            area: "Logic & Rhetoric",
            status: "Applications Open",
            description: "Competitive academic debate tournament fostering public speaking, critical reasoning, and team collaboration."
        }
    }
];

// 2. MENTORS DATA (Biographies, Fields & Avatars)
window.MENTORS_DATA = [
    {
        id: 1,
        name: "Проф. др Драгана Петровић",
        field: "Психологија и развојна даровитост",
        role: "Редовни професор, Филозофски факултет",
        bio: "Преко 15 година посвећена идентификацији и подстицању даровите дјеце. Аутор бројних научних радова о когнитивном развоју.",
        avatarBg: "from-teal-500 to-emerald-600",
        initials: "ДП"
    },
    {
        id: 2,
        name: "Доц. др Милош Вуковић",
        field: "Математика и теоријско рачунарство",
        role: "Доцент, ПМФ Универзитета у Бањој Луци",
        bio: "Вођа тима за математичке олимпијаде, истраживач у области дискретне математике и напредних алгоритама.",
        avatarBg: "from-blue-600 to-indigo-600",
        initials: "МВ"
    },
    {
        id: 3,
        name: "Мр Јелена Станић",
        field: "Креативно писање и компаративна књижевност",
        role: "Ментор за хуманистичке науке",
        bio: "Писац и уредник, водила бројне радионице нарације за средњошколце и припремала младе ауторе за међународне конкурсе.",
        avatarBg: "from-pink-500 to-rose-600",
        initials: "ЈС"
    }
];

// 3. UPDATED PARTNERS (Fondacija "Kaća" first, City of Banja Luka, City of Bijeljina)
window.PARTNERS_DATA = [
    { 
        name: "Фондација \"Каћа\"", 
        role: "Главни покровитељ и партнер",
        color: "border-pink-300 text-pink-900 bg-pink-50/80 shadow-sm ring-2 ring-pink-400/20" 
    },
    { 
        name: "Град Бања Лука", 
        role: "Институционална подршка",
        color: "border-blue-200 text-blue-900 bg-blue-50/70" 
    },
    { 
        name: "Град Бијељина", 
        role: "Партнерски град",
        color: "border-teal-200 text-teal-900 bg-teal-50/70" 
    }
];

// 4. NEWS DATA
window.NEWS_DATA = [
    {
        id: 1,
        sr: {
            date: "25. Дец 2024",
            title: "Отворен конкурс за нове менторе",
            summary: "НАУМ позива стручњаке, истраживаче и професоре да се придруже нашем растућем менторском тиму."
        },
        lat: {
            date: "25. Dec 2024",
            title: "Otvoren konkurs za nove mentore",
            summary: "NAUM poziva stručnjake, istraživače i profesore da se pridruže našem rastućem mentorskom timu."
        },
        en: {
            date: "Dec 25, 2024",
            title: "Open Call for New Mentors",
            summary: "NAUM welcomes educators, university researchers, and domain experts to join our expanding mentorship network."
        }
    },
    {
        id: 2,
        sr: {
            date: "20. Дец 2024",
            title: "Успјешно завршен зимски камп",
            summary: "Преко 50 полазника из цијеле регије уживало је у интерактивним научним радионицама на Козари."
        },
        lat: {
            date: "20. Dec 2024",
            title: "Uspješno završen zimski kamp",
            summary: "Preko 50 polaznika iz cijele regije uživalo je u interaktivnim naučnim radionicama na Kozari."
        },
        en: {
            date: "Dec 20, 2024",
            title: "Winter Science Camp Successfully Concluded",
            summary: "Over 50 young participants from across the region enjoyed hands-on science and logic workshops on Kozara."
        }
    }
];