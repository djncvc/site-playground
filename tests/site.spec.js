// tests/site.spec.js
const { test, expect } = require('@playwright/test');

// --- 1. MOCK PODACI ZA SVE SEKCIJE ---
const MOCK_PROGRAMS_CSV = `id,sectionType,ageGroup,areaType,title_sr,age_sr,area_sr,status_sr,desc_sr,title_lat,age_lat,area_lat,status_lat,desc_lat,title_en,age_en,area_en,status_en,desc_en
1,education,primary,logic,Мала школа мишљења,Предшколски,Логика,Отворене пријаве,Опис,Mala škola mišljenja,Predškolski,Logika,Otvorene prijave,Opis,Little School,Preschool,Logic,Open,Description
2,education,primary,stem,Млади математичари,Основна школа,STEM,Попуњено,Опис,Mladi matematičari,Osnovna škola,STEM,Popunjeno,Opis,Young Mathematicians,Primary School,STEM,Full / Closed,Description
3,workshop,secondary,arts,Креативно писање и новинарство,Средња школа,Умјетност,Отворене пријаве,Опис,Kreativno pisanje,Srednja škola,Umjetnost,Otvorene prijave,Opis,Creative Writing,High School,Arts,Open,Description
4,activity,primary,stem,Љетња научна школа,Основна школа,STEM,У припреми,Опис,Ljetnja naučna škola,Osnovna škola,STEM,U pripremi,Opis,Summer School,Primary School,STEM,In preparation,Description`;

const MOCK_MENTORS_CSV = `id,name_sr,name_lat,name_en,role_sr,role_lat,role_en,field_sr,field_lat,field_en,bio_sr,bio_lat,bio_en,photo_url
1,Проф. др Драгана Петровић,Prof. dr Dragana Petrović,Prof. Dr. Dragana Petrović,Редовни професор,Redovni profesor,Full Professor,Психологија,Psihologija,Psychology,Биографија ментора Драгане.,Biografija mentora Dragane.,Biography of mentor Dragana.,
2,Доц. др Милош Вуковић,Doc. dr Miloš Vuković,Asst. Prof. Dr. Miloš Vuković,Доцент,Docent,Assistant Professor,Математика,Matematika,Mathematics,Биографија ментора Милоша.,Biografija mentora Miloša.,Biography of mentor Milos.,`;

const MOCK_NEWS_CSV = `id,date_sr,date_lat,date_en,title_sr,title_lat,title_en,summary_sr,summary_lat,summary_en,link_url
1,15. Мај 2024,15. Maj 2024,May 15 2024,Одржана прва научна радионица,Održana prva naučna radionica,First Science Workshop Held,У просторијама факултета успјешно је реализована радионица из прошлог периода.,U prostorijama fakulteta uspješno je realizovana radionica iz prošlog perioda.,Past workshop was successfully held at the faculty.,https://instagram.com/naum_centar`;

const MOCK_FAQ_CSV = `id,question_sr,question_lat,question_en,answer_sr,answer_lat,answer_en
1,Како се врши селекција полазника?,Kako se vrši selekcija polaznika?,How is participant selection conducted?,Селекција се врши путем стандардизованих тестова.,Selekcija se vrši putem standardizovanih testova.,Selection is conducted through standardized tests.
2,Да ли су радионице бесплатне?,Da li su radionice besplatne?,Are workshops free?,Већина програма је потпуно бесплатна захваљујући пријатељима Центра.,Većina programa je potpuno besplatna zahvaljujući prijateljima Centra.,Most programs are completely free thanks to Friends of NAUM.`;

test.describe('NAUM Website - Comprehensive E2E Test Suite', () => {

    test.beforeEach(async ({ page }) => {
        // Blokiramo odlazak testnih podataka u Google Analytics
        await page.route('**/*googletagmanager.com*', route => {
            route.fulfill({
                status: 200,
                contentType: 'application/javascript',
                body: 'window.gtag = function() {};'
            });
        });

        // Ubacujemo predvidive rute u config.js tokom testiranja
        await page.route('**/config.js*', async route => {
            const response = await route.fetch();
            let text = await response.text();
            text = text.replace(/GOOGLE_SHEET_CSV_URL:\s*["'][^"']*["']/, 'GOOGLE_SHEET_CSV_URL: "https://mock.sheets/programs?output=csv"');
            text = text.replace(/GOOGLE_SHEET_MENTORS_CSV_URL:\s*["'][^"']*["']/, 'GOOGLE_SHEET_MENTORS_CSV_URL: "https://mock.sheets/mentors?output=csv"');
            text = text.replace(/GOOGLE_SHEET_NEWS_CSV_URL:\s*["'][^"']*["']/, 'GOOGLE_SHEET_NEWS_CSV_URL: "https://mock.sheets/news?output=csv"');
            text = text.replace(/GOOGLE_SHEET_FAQ_CSV_URL:\s*["'][^"']*["']/, 'GOOGLE_SHEET_FAQ_CSV_URL: "https://mock.sheets/faq?output=csv"');
            await route.fulfill({ response, body: text });
        });

        // Presrećemo sve CSV upite i vraćamo tačne podatke za svaku sekciju
        await page.route('**/*output=csv*', route => {
            const url = route.request().url();
            if (url.includes('mentor')) {
                return route.fulfill({ status: 200, contentType: 'text/csv', body: MOCK_MENTORS_CSV });
            }
            if (url.includes('news')) {
                return route.fulfill({ status: 200, contentType: 'text/csv', body: MOCK_NEWS_CSV });
            }
            if (url.includes('faq')) {
                return route.fulfill({ status: 200, contentType: 'text/csv', body: MOCK_FAQ_CSV });
            }
            return route.fulfill({ status: 200, contentType: 'text/csv', body: MOCK_PROGRAMS_CSV });
        });
    });

    // -------------------------------------------------------------
    // 1. CORE STABILITY & RUNTIME ERRORS
    // -------------------------------------------------------------
    test('1. Page loads with zero JavaScript runtime or console errors', async ({ page }) => {
        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') consoleErrors.push(msg.text());
        });
        page.on('pageerror', err => consoleErrors.push(err.message));

        await page.goto('/');
        await page.waitForSelector('#root');

        expect(consoleErrors).toEqual([]);
    });

    // -------------------------------------------------------------
    // 2. BRANDING & HEADER LAYOUT
    // -------------------------------------------------------------
    test('2. Header branding and Hero badge text are properly configured', async ({ page }) => {
        await page.goto('/');

        const headerFacultyTitle = page.locator('header span:has-text("Филозофски факултет")');
        await expect(headerFacultyTitle).toBeVisible();

        const headerUniversitySubtitle = page.locator('header span:has-text("Универзитет у Бањој Луци")');
        await expect(headerUniversitySubtitle).toBeVisible();

        const heroBadge = page.locator('main span:has-text("Центар за надареност НАУМ")');
        await expect(heroBadge.first()).toBeVisible();
    });

    // -------------------------------------------------------------
    // 3. MULTILINGUAL & TRANSLATION COMPLETENESS
    // -------------------------------------------------------------
    test('3. Multilingual switcher translates "O nama" and persists in localStorage', async ({ page }) => {
        await page.goto('/#about');

        const leadText = await page.locator('main p').first().textContent();
        expect(leadText.trim().length).toBeGreaterThan(30);

        const missionText = page.locator('main p:has-text("Системско препознавање")');
        await expect(missionText).toBeVisible();

        // Prebaci na Latinicu (LAT)
        await page.click('button[title="Latinica"]');
        const latLeadText = await page.locator('main p').first().textContent();
        expect(latLeadText).toContain('Centar za nadarenost NAUM');
        expect(latLeadText).toContain('Filozofskom fakultetu');

        // Prebaci na Engleski (ENG)
        await page.click('button[title="English"]');
        const engLeadText = await page.locator('main p').first().textContent();
        expect(engLeadText).toContain('The NAUM Center for Giftedness');
        expect(engLeadText).toContain('Faculty of Philosophy');

        // Provjera čuvanja stanja na reload
        await page.reload();
        const reloadedText = await page.locator('main').textContent();
        expect(reloadedText).toContain('About the Center for Giftedness');

        // Vrati na ćirilicu
        await page.click('button[title="Ћирилица"]');
    });

    // -------------------------------------------------------------
    // 4. BROWSER HISTORY & BACK/FORWARD NAVIGATION
    // -------------------------------------------------------------
    test('4. Browser Back and Forward arrows work smoothly via Hash Routing', async ({ page }) => {
        await page.goto('/#home');

        await page.click('header button:has-text("О нама")');
        await expect(page).toHaveURL(/#about/);

        await page.click('header button:has-text("Програми")');
        await expect(page).toHaveURL(/#programs/);

        await page.click('header button:has-text("Контакт")');
        await expect(page).toHaveURL(/#contact/);

        await page.goBack();
        await expect(page).toHaveURL(/#programs/);

        await page.goBack();
        await expect(page).toHaveURL(/#about/);

        await page.goForward();
        await expect(page).toHaveURL(/#programs/);
    });

    // -------------------------------------------------------------
    // 5. THE 3 OFFERING CATEGORIES (PROGRAMS / WORKSHOPS / ACTIVITIES)
    // -------------------------------------------------------------
    test('5. Home page displays all 3 distinct sections with updated descriptions', async ({ page }) => {
        await page.goto('/#home');

        await expect(page.locator('h2:has-text("Образовни програми")')).toBeVisible();
        await expect(page.locator('h2:has-text("Радионице")')).toBeVisible();
        await expect(page.locator('h2:has-text("Активности")')).toBeVisible();

        const activitiesSection = page.locator('section:has(h2:has-text("Активности"))');
        const activitiesDesc = activitiesSection.locator('p').first();
        await expect(activitiesDesc).toContainText('Научни кампови, стручна предавања, стручна усавршавања, промоције резултата програма');
        await expect(activitiesDesc).not.toContainText('такмичарски сусрети');
        await expect(activitiesDesc).not.toContainText('квизови');
    });

    test('6. Programs page filter tabs filter content accurately', async ({ page }) => {
        await page.goto('/#programs');

        await page.locator('main button:has-text("Радионице")').click();
        await expect(page.locator('h3:has-text("Креативно писање")')).toBeVisible();
        await expect(page.locator('h3:has-text("Млади математичари")')).toBeHidden();

        await page.locator('main button:has-text("Активности")').click();
        await expect(page.locator('h3:has-text("Љетња научна школа")')).toBeVisible();
        await expect(page.locator('h3:has-text("Креативно писање")')).toBeHidden();

        await page.locator('main button:has-text("Сви садржаји")').click();
        await expect(page.locator('h3:has-text("Млади математичари")')).toBeVisible();
        await expect(page.locator('h3:has-text("Креативно писање")')).toBeVisible();
    });

    // -------------------------------------------------------------
    // 6. NAVBAR DROPDOWNS
    // -------------------------------------------------------------
    test('7. Header dropdown menus render and navigate properly', async ({ page }) => {
        await page.goto('/#home');

        // Hover preko dropdowna Programi
        await page.hover('header button:has-text("Програми")');
        const workshopsSubLink = page.locator('header button:has-text("Радионице")');
        await expect(workshopsSubLink).toBeVisible();
        await workshopsSubLink.click();

        await expect(page).toHaveURL(/#programs/);
        await expect(page.locator('h3:has-text("Креативно писање")')).toBeVisible();

        // Hover preko dropdowna Mentori
        await page.hover('header button:has-text("Ментори")');
        const applyMentorSubLink = page.locator('header button:has-text("Пријава за менторе")');
        await expect(applyMentorSubLink).toBeVisible();
        await applyMentorSubLink.click();

        await expect(page).toHaveURL(/#mentors/);
        await expect(page.locator('#mentor-form-section')).toBeVisible();
    });

    // -------------------------------------------------------------
    // 7. OUR MENTORS SHOWCASE SECTION
    // -------------------------------------------------------------
    test('8. Mentors showcase section displays mentor cards with titles and bios', async ({ page }) => {
        await page.goto('/#mentors');

        await expect(page.locator('h1:has-text("Наши ментори")')).toBeVisible();

        const mentorCards = page.locator('#our-mentors-section h3');
        await expect(mentorCards.first()).toBeVisible();

        const count = await mentorCards.count();
        expect(count).toBeGreaterThanOrEqual(2);
    });

    // -------------------------------------------------------------
    // 8. PARTNERS (PRIJATELJI NAUM-A) & SUPPORT FORM
    // -------------------------------------------------------------
    test('9. Partners section displays new intro text and all partners without roles', async ({ page }) => {
        await page.goto('/#home');

        const partnersSection = page.locator('#partners-section');

        await expect(partnersSection.locator('h3')).toContainText('Заједничка мисија. Заједничка подршка. Више прилика за таленте.');
        await expect(partnersSection.locator('p')).toContainText('Пријатељи НАУМ-а су појединци, компаније, институције и организације');

        const partnerBoxes = partnersSection.locator('span.font-extrabold');
        await expect(partnerBoxes).toHaveCount(7);

        // 1. Fondacija "Kaća"
        await expect(partnerBoxes.nth(0)).toContainText('Фондација "Каћа"');
        // 2. Kompanija LANACO
        await expect(partnerBoxes.nth(1)).toContainText('Компанија LANACO');
        // 3. Grad Banja Luka
        await expect(partnerBoxes.nth(2)).toContainText('Град Бања Лука');
    });

    test('10. Support the Center ("Подржи рад Центра") form is operational', async ({ page }) => {
        await page.goto('/#home');

        const supportForm = page.locator('#support-section form');
        await expect(supportForm).toBeVisible();

        await expect(page.locator('#support-section input:visible').first()).toBeVisible();
        await expect(page.locator('#support-section button[type="submit"]')).toHaveText(/Пошаљи/);
    });

    // -------------------------------------------------------------
    // 9. CLOSED PROGRAM SAFEGUARD
    // -------------------------------------------------------------
    test('11. Closed program disables registration and triggers warning notice', async ({ page }) => {
        await page.goto('/#apply');

        const select = page.locator('select');
        const closedOption = select.locator('option', { hasText: /Попуњено/ });
        await expect(closedOption).toBeAttached();
        const value = await closedOption.getAttribute('value');
        await select.selectOption(value);

        const warning = page.locator('text=Хвала на интересовању, пријаве су тренутно затворене.');
        await expect(warning).toBeVisible();

        const submitBtn = page.locator('button[type="submit"]');
        await expect(submitBtn).toBeDisabled();
        await expect(submitBtn).toHaveText(/Пријаве затворене/);
    });

    // -------------------------------------------------------------
    // 10. ANTI-BOT HONEYPOT FIELD
    // -------------------------------------------------------------
    test('12. Anti-bot honeypot fields are hidden from human visitors', async ({ page }) => {
        await page.goto('/#apply');
        const honeypot = page.locator('input[name="hp_trap"]');
        await expect(honeypot.first()).toBeAttached();
        await expect(honeypot.first()).toBeHidden();
    });

    // -------------------------------------------------------------
    // 11. SOCIAL MEDIA & OFFICIAL EMAIL LINKS
    // -------------------------------------------------------------
    test('13. Official email is naum@ff.unibl.org and all 5 social links are present', async ({ page }) => {
        await page.goto('/#contact');

        const emailLink = page.locator('a[href="mailto:naum@ff.unibl.org"]');
        await expect(emailLink.first()).toBeVisible();

        const socials = [
            'https://instagram.com/naum_centar',
            'https://www.facebook.com/profile.php?id=61576248009149',
            'https://www.linkedin.com/company/107620789/',
            'https://www.youtube.com/@NaumCentarzanadarenost',
            'https://invite.viber.com/'
        ];

        for (const url of socials) {
            const socialBtn = page.locator(`a[href*="${url}"]`).first();
            await expect(socialBtn).toBeVisible();
            await expect(socialBtn).toHaveAttribute('target', '_blank');
        }
    });

    // -------------------------------------------------------------
    // 12. FOOTER QUICK LINKS & FAQ ACCORDION
    // -------------------------------------------------------------
    test('14. Footer contains FAQ link that smoothly navigates to FAQ accordion', async ({ page }) => {
        await page.goto('/#home');

        const faqFooterBtn = page.locator('footer button:has-text("Често постављана питања")');
        await expect(faqFooterBtn).toBeVisible();
        await faqFooterBtn.click();

        await expect(page).toHaveURL(/#apply/);
        await expect(page.locator('#faq-section')).toBeVisible();
    });

    // -------------------------------------------------------------
    // 13. "U PRIPREMI" STATUS SAFEGUARD
    // -------------------------------------------------------------
    test('15. Program marked as "U pripremi" disables apply button and shows info banner', async ({ page }) => {
        await page.goto('/#programs');

        const inPrepCard = page.locator('.rounded-2xl', { hasText: 'Љетња научна школа' });
        await expect(inPrepCard.locator('span:has-text("У припреми")').first()).toBeVisible();
        await expect(inPrepCard.locator('button:has-text("Пријави се")')).toHaveCount(0);

        await page.goto('/#apply');
        const select = page.locator('select');

        const inPrepOption = select.locator('option', { hasText: /У припреми/ });
        await expect(inPrepOption).toBeAttached();
        const value = await inPrepOption.getAttribute('value');
        await select.selectOption(value);

        const infoBanner = page.locator('text=Овај садржај је тренутно у припреми. Пријаве ће бити отворене ускоро.');
        await expect(infoBanner).toBeVisible();

        const submitBtn = page.locator('button[type="submit"]');
        await expect(submitBtn).toBeDisabled();
        await expect(submitBtn).toHaveText(/У припреми/);
    });

    // -------------------------------------------------------------
    // 14. FOOTER ADDRESS TRANSLATION
    // -------------------------------------------------------------
    test('16. Footer address translates correctly into Latinica and English', async ({ page }) => {
        await page.goto('/#home');
        const footer = page.locator('footer');

        await expect(footer).toContainText('Булевар војводе Петра Бојовића 1А');
        await expect(footer).toContainText('Република Српска');

        await page.click('button[title="Latinica"]');
        await expect(footer).toContainText('Bulevar vojvode Petra Bojovića 1A');
        await expect(footer).toContainText('Republika Srpska');
        await expect(footer).not.toContainText('Булевар');

        await page.click('button[title="English"]');
        await expect(footer).toContainText('Bulevar vojvode Petra Bojovica 1A');
        await expect(footer).toContainText('Republic of Srpska');

        await page.click('button[title="Ћирилица"]');
        await expect(footer).toContainText('Булевар војводе Петра Бојовића 1А');
    });

    // -------------------------------------------------------------
    // 15. DYNAMIC NEWS WITH CUSTOM PAST DATES & LINKS
    // -------------------------------------------------------------
    test('17. News section loads dynamic items with custom past dates and external links', async ({ page }) => {
        await page.goto('/#news');

        const newsCard = page.locator('div.rounded-2xl', { hasText: 'Одржана прва научна радионица' });
        await expect(newsCard.locator('text=15. Мај 2024')).toBeVisible();

        const detailsLink = newsCard.locator('a[href="https://instagram.com/naum_centar"]');
        await expect(detailsLink).toBeVisible();
        await expect(detailsLink).toHaveAttribute('target', '_blank');

        await page.click('button[title="Latinica"]');
        await expect(page.locator('text=15. Maj 2024')).toBeVisible();
        await expect(page.locator('text=Održana prva naučna radionica')).toBeVisible();

        await page.click('button[title="English"]');
        await expect(page.locator('text=May 15 2024')).toBeVisible();
        await expect(page.locator('text=First Science Workshop Held')).toBeVisible();

        await page.click('button[title="Ћирилица"]');
    });

    // -------------------------------------------------------------
    // 16. DYNAMIC FAQ ACCORDION & TRANSLATIONS
    // -------------------------------------------------------------
    test('18. FAQ section loads dynamic questions from sheet, opens answers, and translates', async ({ page }) => {
        await page.goto('/#apply');
        const faqSection = page.locator('#faq-section');
        await expect(faqSection).toBeVisible();

        const firstQuestion = faqSection.locator('summary', { hasText: 'Како се врши селекција полазника?' });
        await expect(firstQuestion).toBeVisible();

        await firstQuestion.click();
        const answerText = faqSection.locator('text=Селекција се врши путем стандардизованих тестова.');
        await expect(answerText).toBeVisible();

        await page.click('button[title="Latinica"]');
        const latQuestion = faqSection.locator('summary', { hasText: 'Kako se vrši selekcija polaznika?' });
        await expect(latQuestion).toBeVisible();
        await latQuestion.click();
        await expect(faqSection.locator('text=Selekcija se vrši putem standardizovanih testova.')).toBeVisible();

        await page.click('button[title="English"]');
        const engQuestion = faqSection.locator('summary', { hasText: 'How is participant selection conducted?' });
        await expect(engQuestion).toBeVisible();
        await engQuestion.click();
        await expect(faqSection.locator('text=Selection is conducted through standardized tests.')).toBeVisible();

        await page.click('button[title="Ћирилица"]');
    });

});