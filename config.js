// config.js
window.CONFIG = {
    GOOGLE_SHEET_CSV_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRuTdNc35_TVGa9i8fx7xoWAKdaTjoJqRP6xA5SC2_DY2IJEyPwKnY94ExK0NWRJWKTE_0eYXELOzjP/pub?gid=0&single=true&output=csv",
    GOOGLE_SCRIPT_WEBAPP_URL: "https://script.google.com/macros/s/AKfycbwz2MfTB_oEiwbrfdWWzdZP4td0BuUG2ZbILnvMexVR7a6DQUyEm8QUFGCJPicF248F/exec"
};

window.DEFAULT_PROGRAMS = [
    {
        id: 1,
        areaType: "logic",
        ageGroup: "preschool",
        sr: {
            title: "Мала школа мишљења",
            age: "Предшколски",
            area: "Логика и филозофија",
            status: "Отворене пријаве",
            description: "Програм намјењен развоју критичког мишљења код најмлађих кроз игру, загонетке и отворени дијалог."
        },
        lat: {
            title: "Mala škola mišljenja",
            age: "Predškolski",
            area: "Logika i filozofija",
            status: "Otvorene prijave",
            description: "Program namijenjen razvoju kritičkog mišljenja kod najmlađih kroz igru, zagonetke i otvoreni dijalog."
        },
        en: {
            title: "Little School of Thought",
            age: "Preschool",
            area: "Logic & Philosophy",
            status: "Applications Open",
            description: "A program designed to foster critical thinking and curiosity in young children through play, puzzles, and dialogue."
        }
    },
    {
        id: 2,
        areaType: "stem",
        ageGroup: "primary",
        sr: {
            title: "Млади математичари",
            age: "Основна школа",
            area: "STEM",
            status: "Попуњено",
            description: "Напредна математика и концептуално рјешавање проблема за талентоване основце и такмичаре."
        },
        lat: {
            title: "Mladi matematičari",
            age: "Osnovna škola",
            area: "STEM",
            status: "Popunjeno",
            description: "Napredna matematika i konceptualno rješavanje problema za talentovane osnovce i takmičare."
        },
        en: {
            title: "Young Mathematicians",
            age: "Primary School",
            area: "STEM",
            status: "Full / Closed",
            description: "Advanced mathematics, conceptual problem solving, and competition readiness for gifted school students."
        }
    },
    {
        id: 3,
        areaType: "arts",
        ageGroup: "secondary",
        sr: {
            title: "Креативно писање",
            age: "Средња школа",
            area: "Умјетност",
            status: "Отворене пријаве",
            description: "Инспиративна радионица за будуће писце, новинаре и све који желе маштовито обликовати своје ријечи."
        },
        lat: {
            title: "Kreativno pisanje",
            age: "Srednja škola",
            area: "Umjetnost",
            status: "Otvorene prijave",
            description: "Inspirativna radionica za buduće pisce, novinare i sve koji žele maštovito oblikovati svoje riječi."
        },
        en: {
            title: "Creative Writing",
            age: "High School",
            area: "Arts & Humanities",
            status: "Applications Open",
            description: "An inspiring workshop for aspiring authors, journalists, and anyone eager to articulate imaginative stories."
        }
    },
    {
        id: 4,
        areaType: "stem",
        ageGroup: "primary",
        sr: {
            title: "Роботика и АИ",
            age: "Основна школа",
            area: "STEM",
            status: "Најава",
            description: "Интерактиван увод у свијет вјештачке интелигенције, алгоритама и аутоматизованих система."
        },
        lat: {
            title: "Robotika i AI",
            age: "Osnovna škola",
            area: "STEM",
            status: "Najava",
            description: "Interaktivan uvod u svijet vještačke inteligencije, algoritama i automatizovanih sistema."
        },
        en: {
            title: "Robotics & AI",
            age: "Primary School",
            area: "STEM",
            status: "Upcoming",
            description: "An interactive gateway into the world of artificial intelligence, algorithms, and smart robotics."
        }
    }
];

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