
// Регистрируем плагин в начале файла
gsap.registerPlugin(Observer);

// Устанавливаем стартовое состояние (вместо CSS !important)
gsap.set(".wrapper-envelope", {
    rotationX: 12,
    rotationZ: -5,
    transformPerspective: 1200,
    transformStyle: "preserve-3d"
});

// Создаем бесконечный цикл покачивания
const idleTl = gsap.timeline({ repeat: -1, yoyo: true });


idleTl.to(".wrapper-envelope", {
    y: -20,             // Прыжок вверх
    rotationX: 0,       // Немного выравнивается в прыжке
    rotationZ: 0,       // Немного выравнивается в прыжке
    duration: 0.8,
    ease: "power1.inOut"
})
    .to(".shadow", {
        scale: 0.7,         // Тень уменьшается, когда конверт далеко
        opacity: 0.1,       // И становится бледнее
        duration: 0.8,
        ease: "power1.inOut"
    }, 0); // Запускаем одновременно с прыжком

//по клику на конверт 
// Флаг, чтобы нельзя было кликнуть дважды
let isOpening = false;
const envelope = document.querySelector('.wrapper-envelope');
const openTl = gsap.timeline(); //------
const letterFocusDocZoomTL = gsap.timeline();

const cardTimelines = []; // массив таймлайнов 


envelope.addEventListener('click', () => {

    if (isOpening) return;
    isOpening = true;

    // выравнивание конверта
    openTl.to(".wrapper-envelope", {
        rotationX: 0,
        rotationZ: 0,
        duration: 0.6,
        ease: "expo.out" // Замедляется в конце очень плавно
    });

    // дрожание ппечати
    gsap.to(".env-seal", {
        x: 1.5,
        yoyo: true,
        repeat: 4,
        duration: 0.06,
        clearProps: "x" // Чистим за собой после дрожания
    })

    idleTl.pause();

    //исчезновение тени
    openTl.to(".shadow", {
        duration: 0.3,
        scale: 0.4,
        opacity: 0,
    })
        //  падение печати
        .to(".seal-group", {
            duration: 0.7,
            y: 400,              // Улетает далеко вниз
            rotation: 15,        // Легкий поворот по часовой стрелке
            rotationX: 20,       // Наклон "от нас" для 3D эффекта
            opacity: 0,
            scale: 0.9,          // Немного уменьшается, имитируя удаление
            display: "none",
            transformOrigin: "center center",
            ease: "power2.in"    // Ускорение вниз
        }, "-=0.2")

        //исчезновение текста на печати 
        .to(".seal-group text", {
            duration: 0.3,
            opacity: 0,
            ease: "none"
        }, "-=0.7")

        // падение и исчезновение печати 
        .to(".seal-group", {
            opacity: 0,
            duration: 0.4,
            ease: "power1.in"
        }, "-=0.5") // Начинает исчезать за полсекунды до конца падения

        .to(".env-flap", {
            duration: 0.6,
            scaleY: -1,          // Зеркально переворачивает крышку вверх
            fill: "#d1d1d1",     // (Опционально) Меняем цвет внутренней стороны крышки
            ease: "power2.inOut",
            onStart: startPetalFall, // <--- ЛЕПЕСТКИ ВЫЛЕТАЮТ ТУТ
        }, "-=0.6")              // Начинаем чуть раньше, пока печать до конца не исчезла

        // 2. В момент старта письма меняем ему z-index
        .set(".env-flap", { zIndex: 2 }) // Теперь оно выше крышки (z-index: 15)

        // 2. ВЫЛЕТ И ПЕРЕХОД (Самый важный этап)
        .to(".letter-svg-proxy", {
            yPercent: -80,           // Вылетает из кармашка
            duration: 0.8,
            scale: .8,
            ease: "power1.Out"
        }, "<")
        .set(".letter-svg-proxy", { zIndex: 100 }) // Теперь оно выше крышки (z-index: 15)
        .to(".letter-svg-proxy", {
            yPercent: 30,           // Вылетает из кармашка
            duration: 0.8,
            scale: 1.3,
            ease: "power1.inOut"
        }, "<")

        // 3. ПРЕВРАЩЕНИЕ В ЛЕНДИНГ
        .to(".letter-svg-proxy", {
            scale: 4,               // Письмо "взрывается" на весь экран
            opacity: 0,             // И растворяется
            filter: "blur(15px)",   // С мягким размытием
            duration: 0.7,
            ease: "power2.in"       // Ускоряемся в камеру
        })
        // ... твой код в конце таймлайна
        .to(".landing-card", {
            opacity: 1,   // Проявляем карточку лендинга
            scale: 1,    // Возвращаем масштаб к нормальному
            duration: 0.5,
            ease: "power3.out", // Плавная остановка перед пользователем
            pointerEvents: "all", // Включаем взаимодействие
            onStart: () => {
                gsap.set(".landing-card", { scale: 0.7, opacity: 0 });
                // Проявляем саму ПЛОЩАДКУ секции чуть раньше, чем контент
                initInvitationSwiper();
            },
            onComplete: () => {
                initInvitationSwiper(); // <--- Запуск здесь!
                if (cardTimelines[0]) {
                    cardTimelines[0].play(); // Явно запускаем ПЕРВЫЙ таймлайн из массива
                }
            }
        }, "-=0.5")
        .to(".wrapper-envelope", {
            autoAlpha: 0,
            display: "none", // Полностью убираем из дерева отрисовки
            duration: 0.5
        }, "+=1.0"); // Спустя секунду после появления лендинга

})

//свайп карточек
function initInvitationSwiper() {
    const sections = document.querySelectorAll(".section");
    let currentIndex = 0;
    let isAnimating = false;

    sections.forEach((sec, i) => {
        // 1. СОЗДАЕМ ТАЙМЛАЙН ДЛЯ КАЖДОЙ КАРТОЧКИ
        const tl = gsap.timeline({ paused: true });


        // Настраиваем анимации (замени селекторы на свои реальные классы)
        if (i === 0) {
            // Анимация элементов ПЕРВОЙ карточки
            tl.to(sec.querySelector(".card-bg"), {
                opacity: 1,
                scale: 1,
                duration: 1.5,
                ease: "power2.out"
            })
                // Анимации текста идут следом с нахлестом (координаты y: 0)
                .to(sec.querySelector(".status-badge"), { y: 0, opacity: 1 }, "-=1.0")
                .to(sec.querySelectorAll(".names"), { y: 0, opacity: 1, stagger: 0.2 }, "-=0.8")
                .to(sec.querySelector(".divider"), { scaleX: 1, opacity: 1 }, "-=0.6")
                .to(sec.querySelectorAll(".date-hero, .scroll-hint"), { y: 0, opacity: 1, filter: "blur(0px)" }, "-=0.4")
                // ФИНАЛЬНЫЙ БЛЮР ФОНА
                // Мы ставим его в конец, чтобы он сработал, когда текст уже почти готов
                .to(sec.querySelector(".card-bg"), {
                    filter: "blur(1.5px)",
                    duration: 0.8,
                    ease: "power1.inOut"
                }, "-=0.5"); // Начинаем блюрить за полсекунды до конца анимации текста
        } else if (i === 1) {

            tl.to(sec.querySelector(".glass-panel"), {
                opacity: 1,
                y: 0,
                duration: 0.8, // Было 1.2 — теперь быстрее
                ease: "power3.out"
            }, "-=0.2")

                // ШАГ 3: ДЕТАЛИ (Четкий ритм)
                .to(sec.querySelector(".anim-title"), { opacity: 1, y: 0, duration: 0.5 }, "-=0.3")
                .to(sec.querySelectorAll(".anim-text"), { opacity: 1, y: 0, stagger: 0.1, duration: 0.5 }, "-=0.2")
                .to(sec.querySelectorAll(".timer-item"), { opacity: 1, scale: 1, y: 0, stagger: 0.05, duration: 0.5 }, "-=0.2");
        } else if (i === 2) {
            tl.to(sec.querySelector(".anim-title"), {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: "power3.out"
            }, "-=0.4")
                // ШАГ 3: Появление самих карточек (две штуки сразу или по очереди)
                .to(sec.querySelectorAll(".location-card"), {
                    opacity: 1,
                    y: 0,
                    stagger: 0.3, // Сначала одна, через 0.3 сек вторая
                    duration: 1,
                    ease: "power2.out"
                }, "-=0.2")
                // ШАГ 4: "Прорастание" текста внутри карточек (финальный штрих)
                .to(sec.querySelectorAll(".location-card .anim-text"), {
                    opacity: 1,
                    y: 0,
                    stagger: 0.05, // Очень быстрый каскад букв
                    duration: 0.6
                }, "-=0.4");
        } else if (i === 3) {
            // Анимация ЧЕТВЕРТОЙ карточки (Тайминг)

            // 1. Заголовок "Программа"
            tl.to(sec.querySelector(".anim-title"), {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: "power3.out"
            })
                // 2. Общий контейнер (чуть проявляем)
                .to(sec.querySelector(".timeline-container"), {
                    opacity: 1,
                    duration: 0.5
                }, "-=0.4")
                // 3. Каскадное появление пунктов программы
                // Мы анимируем сразу все .timeline-item внутри этой секции
                .to(sec.querySelectorAll(".timeline-item"), {
                    opacity: 1,
                    x: 0,           // Будут вылетать слева направо (если добавим x в CSS)
                    y: 0,           // И всплывать вверх
                    stagger: 0.2,  // Задержка между пунктами 0.15 сек
                    duration: 1,
                    ease: "power2.out"
                }, "-=0.5");
        } else if (i === 4) {
            // Анимация ПЯТОЙ карточки (Дресс-код и Детали)

            tl.to(sec.querySelector(".anim-title"), {
                opacity: 1,
                y: 0,
                duration: 0.8
            })
                .to(sec.querySelector(".glass-panel"), {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    ease: "power3.out"
                }, "-=0.6")
                .to(sec.querySelectorAll(".dress-code-text"), {
                    opacity: 1,
                    y: 0,
                    stagger: 0.2, // Тексты выходят чуть медленнее
                    duration: 0.8
                }, "-=0.8")

                // ЭФФЕКТ ЖИВЫХ КРУЖОЧКОВ
                .to(sec.querySelectorAll(".swatch-item"), {
                    opacity: 1,
                    scale: 1,         // Вырастают из 0
                    y: 0,             // Всплывают из 10px
                    stagger: 0.12,    // Эффект домино
                    duration: 0.9,
                    // back.out(1.7) — это тот самый "прыжок"
                    ease: "back.out(1.7)"
                }, "-=0.5");
        } else if (i === 5) {
            // Анимация ШЕСТОЙ карточки (RSVP)
            tl.to(sec.querySelector(".anim-title"), { opacity: 1, y: 0, duration: 0.8 })
                .to(sec.querySelector(".anim-text"), { opacity: 1, y: 0, duration: 0.8 }, "-=0.6")
                .to(sec.querySelector(".rsvp-selection"), {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    ease: "back.out(1.7)" // Кнопки выбора "выпрыгивают"
                }, "-=0.4");
        }

        cardTimelines.push(tl);

        // Начальные настройки отображения
        gsap.set(sec, {
            zIndex: sections.length - i,
            autoAlpha: i === 0 ? 1 : 0
        });
    });

    // 2. ЗАПУСКАЕМ ПЕРВУЮ КАРТОЧКУ СРАЗУ
    // if (cardTimelines[0]) cardTimelines[0].play();

    Observer.create({
        target: ".landing-card",
        type: "wheel,touch,pointer",
        wheelSpeed: -1,
        onUp: () => !isAnimating && changeSection(currentIndex + 1),
        onDown: () => !isAnimating && changeSection(currentIndex - 1),
        tolerance: 50,
        preventDefault: true
    });

    function changeSection(index) {
        if (index < 0 || index >= sections.length) return;
        isAnimating = true;

        const isNext = index > currentIndex;
        const current = sections[currentIndex];
        const next = sections[index];

        // Скрываем все лишнее, чтобы не было "каши" под прозрачными элементами
        sections.forEach((sec, i) => {
            if (i !== currentIndex && i !== index) gsap.set(sec, { autoAlpha: 0 });
        });

        const tlMain = gsap.timeline({
            onComplete: () => {
                isAnimating = false;
                currentIndex = index;
                // После приземления карточки запускаем текст (только если идем ВПЕРЕД)
                if (isNext && cardTimelines[index]) cardTimelines[index].play();
            }
        });

        if (isNext) {
            // Подготавливаем контент следующей карты (сброс в 0)
            if (cardTimelines[index]) cardTimelines[index].pause(0);

            gsap.set(next, { autoAlpha: 1 });

            // --- МАГИЯ: Запускаем проявление ФОНА раньше, чем закончится свайп ---
            const nextBG = next.querySelector('div[class*="-bg"]'); // Ищем любой фон в секции
            if (nextBG) {
                gsap.to(nextBG, {
                    opacity: 1,
                    scale: 1,
                    duration: 1.2,
                    delay: 0.3, // Начнет проявляться через 0.3с после начала свайпа
                    ease: "power2.out"
                });
            }

            // ТВОЯ АНИМАЦИЯ: Улёт текущей вверх
            tlMain.to(current, {
                y: -window.innerHeight * 1.3,
                rotation: -5,
                duration: 0.9,
                ease: "power2.inOut"
            });
            // ТВОЯ АНИМАЦИЯ: Приближение следующей
            tlMain.fromTo(next,
                { scale: 0.95 },
                { scale: 1, duration: 0.9, ease: "power2.inOut" },
                "<"
            );

            // В конце свайпа запускаем только ТЕКСТ (в массиве уберем анимацию фото)
            tlMain.add(() => {
                if (cardTimelines[index]) cardTimelines[index].play();
            });

        } else {
            // ПРИ ВОЗВРАТЕ: Сразу показываем готовый контент (без анимации текста)
            if (cardTimelines[index]) cardTimelines[index].progress(1);

            gsap.set(next, { autoAlpha: 1 });

            // ТВОЯ АНИМАЦИЯ: Возврат сверху
            tlMain.fromTo(next,
                { y: -window.innerHeight, rotation: -5 },
                { y: 0, rotation: 0, duration: 0.9, ease: "power2.out" }
            );
            // ТВОЯ АНИМАЦИЯ: Уход текущей на задний план
            tlMain.to(current, { scale: 0.95, duration: 0.9 }, "<");
        }
    }
}


//леепестки роз
function startPetalFall() {
    const canvasBack = document.getElementById('petalCanvasBack');
    const canvasFront = document.getElementById('petalCanvasFront');
    const ctxBack = canvasBack.getContext('2d');
    const ctxFront = canvasFront.getContext('2d');

    const resize = () => {
        [canvasBack, canvasFront].forEach(c => {
            c.width = window.innerWidth;
            c.height = window.innerHeight;
        });
    };
    window.addEventListener('resize', resize);
    resize();

    const petalsBack = [];
    const petalsFront = [];
    const totalCount = 20; // Всего лепестков
    const colors = ['#ff4d6d', '#ff758c', '#ff8fa3', '#fff5f7'];

    class Petal {
        constructor() {
            this.reset(); // Убрали true, теперь все за кадром сверху
        }
        reset() {
            this.x = Math.random() * canvasBack.width;
            // Начинают от -20 до -100 пикселей выше верхней границы экрана
            this.y = -(Math.random() * 100 + 20);
            this.size = Math.random() * 8 + 5;
            this.speed = Math.random() * 1.5 + 1;
            this.spin = Math.random() * 0.02 + 0.01;
            this.phi = Math.random() * Math.PI * 2;
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.opacity = Math.random() * 0.6 + 0.2;
        }
        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.phi);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(this.size, -this.size, this.size, this.size, 0, this.size * 1.3);
            ctx.bezierCurveTo(-this.size, this.size, -this.size, -this.size, 0, 0);
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.opacity;
            ctx.fill();
            ctx.restore();
        }
        update() {
            this.y += this.speed;
            this.phi += this.spin;
            this.x += Math.sin(this.phi * 0.5) * 0.5;
            if (this.y > canvasBack.height) this.reset();
        }
    }

    // Распределяем: 40% вперед, 60% назад
    for (let i = 0; i < totalCount; i++) {
        const p = new Petal();
        if (Math.random() < 0.1) {
            petalsFront.push(p);
        } else {
            petalsBack.push(p);
        }
    }

    function animate() {
        ctxBack.clearRect(0, 0, canvasBack.width, canvasBack.height);
        ctxFront.clearRect(0, 0, canvasFront.width, canvasFront.height);

        petalsBack.forEach(p => { p.update(); p.draw(ctxBack); });
        petalsFront.forEach(p => { p.update(); p.draw(ctxFront); });

        requestAnimationFrame(animate);
    }

    animate();
}



//таймер
const weddingDate = new Date("2026-07-01T10:00:00").getTime();

function updateTimer() {
    const now = new Date().getTime();
    const distance = weddingDate - now;

    if (distance < 0) return;

    const newData = {
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
    };

    Object.keys(newData).forEach(key => {
        const el = document.getElementById(key);
        const newValue = String(newData[key]).padStart(2, '0');

        // Анимируем только если значение изменилось
        if (el.innerText !== newValue) {
            // Анимация GSAP: число чуть уменьшается, меняется и возвращается
            gsap.to(el, {
                duration: 0.3,
                y: -10,
                opacity: 0,
                onComplete: () => {
                    el.innerText = newValue;
                    gsap.to(el, { duration: 0.3, y: 0, opacity: 1 });
                }
            });
        }
    });
}

// Запускаем
setInterval(updateTimer, 60000); // Раз в минуту достаточно, если нет секунд
updateTimer();




//анкета
// 1. Оставляем глобальной для кнопок "Я приду" / "Меня не будет"
function showRSVPForm(isComing) {
    const controls = document.getElementById('rsvp-controls');
    const formYes = document.getElementById('form-yes');
    const formNo = document.getElementById('form-no');

    // Ищем заголовки только внутри текущей (6-й) секции, чтобы не задеть остальные
    const section = controls.closest('.section');
    const title = section.querySelector('.anim-title');
    const subtitle = section.querySelector('.anim-text');


    const targetForm = isComing ? formYes : formNo;

    gsap.to([controls, title, subtitle], {
        opacity: 0,
        y: -20,
        duration: 0.4,
        stagger: 0.05,
        onComplete: () => {
            // Скрываем их так же, как ты скрывал форму — через display
            [controls, title, subtitle].forEach(el => {
                if (el) el.style.setProperty('display', 'none', 'important');
            });

            targetForm.classList.add('rsvp-active');

            // Находим все скрытые элементы внутри (текст, смайлик, кнопки)
            const innerContent = targetForm.querySelectorAll('.anim-text, .anim-item, .sad-image');

            gsap.fromTo(targetForm,
                { opacity: 0, y: 20 },
                {
                    opacity: 1, y: 0, duration: 0.6, ease: "power2.out", onStart: () => {
                        // ПРИНУДИТЕЛЬНО проявляем текст и иконки внутри
                        gsap.to(innerContent, {
                            opacity: 1,
                            y: 0,
                            duration: 0.5,
                            stagger: 0.1, // Чтобы текст и кнопка вылетали по очереди
                            overwrite: true // На случай, если анимация уже запускалась
                        });
                    }
                }
            );
        }
    });
}

// 2. Ждем загрузки DOM и вешаем логику отправки
document.addEventListener('DOMContentLoaded', () => {
    const rsvpForm = document.getElementById('form-yes');

    if (rsvpForm) {
        rsvpForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const form = this;
            const submitBtn = form.querySelector('button[type="submit"]');
            const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzNudI21NkrIxsNbkEIWBqdKJujtWonZ8AmFSof52eD0796UepgCez2JADyHDQ5_wwt/exec';

            submitBtn.disabled = true;
            submitBtn.innerText = 'Отправка...';

            // Сбор данных для Google
            const formData = new FormData(form);
            const barPreferences = [];
            form.querySelectorAll('input[name="bar"]:checked').forEach((checkbox) => {
                barPreferences.push(checkbox.parentNode.textContent.trim());
            });

            const data = {
                name: formData.get('name'),
                guests: formData.get('guests'),
                transfer: formData.get('transfer'),
                hotel: formData.get('hotel'),
                bar: barPreferences.join(', '),
                comment: formData.get('comment')
            };

            fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                cache: 'no-cache',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
                .then(() => {
                    const thanksBlock = document.getElementById('rsvp-thanks');

                    const formYes = document.getElementById('form-yes');
                    // Находим верхние заголовки
                    const mainTitle = document.querySelector('.rsvp-page .anim-title');
                    const mainSubtitle = document.querySelector('.rsvp-page .anim-text');

                    // 1. Скрываем ВСЁ лишнее (форму и заголовки)
                    gsap.to([formYes, mainTitle, mainSubtitle], {
                        opacity: 0,
                        y: -20,
                        duration: 0.4,
                        stagger: 0.05, // Чтобы исчезали чуть-чуть вразнобой
                        onComplete: () => {
                            // Прячем физически
                            [formYes, mainTitle, mainSubtitle].forEach(el => {
                                if (el) el.style.setProperty('display', 'none', 'important');
                            });

                            // 2. Показываем блок благодарности
                            thanksBlock.classList.add('rsvp-active');
                            gsap.fromTo(thanksBlock,
                                { opacity: 0, scale: 0.9 },
                                { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.7)" }
                            );
                        }
                    });
                })
                .catch(error => {
                    console.error('Ошибка:', error);
                    alert('Что-то пошло не так. Попробуйте еще раз.');
                    submitBtn.disabled = false;
                    submitBtn.innerText = 'Отправить';
                });
        });
    }
});



//возврат при клике "изменить решение"
//возврат при клике "изменить решение"
function resetRSVP() {
    const controls = document.getElementById('rsvp-controls');
    const formNo = document.getElementById('form-no');

    // 1. Находим "пропавшие" заголовки (ищем их рядом с кнопками)
    const section = controls.closest('.section');
    const title = section.querySelector('.anim-title');
    const subtitle = section.querySelector('.anim-text');

    // 2. Прячем блок "Меня не будет"
    gsap.to(formNo, {
        opacity: 0,
        y: 20,
        duration: 0.4,
        onComplete: () => {
            formNo.style.display = 'none';
            formNo.classList.remove('rsvp-active');

            // 3. Возвращаем заголовки и кнопки в поток (display)
            // Используем flex для кнопок и block для текстов
            if (title) title.style.display = 'block';
            if (subtitle) subtitle.style.display = 'block';
            controls.style.display = 'flex';

            // 4. Подготавливаем всё к плавному появлению
            gsap.set([title, subtitle, controls], { opacity: 0, y: -20 });

            // 5. Плавно возвращаем ВСЁ на место со стаггером (по очереди)
            gsap.to([title, subtitle, controls], {
                opacity: 1,
                y: 0,
                duration: 0.5,
                stagger: 0.1, // Сначала заголовок, потом подзаголовок, потом кнопки
                ease: "back.out(1.7)"
            });
        }
    });
}


