const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzNudI21NkrIxsNbkEIWBqdKJujtWonZ8AmFSof52eD0796UepgCez2JADyHDQ5_wwt/exec';

document.getElementById('form-yes').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const submitBtn = this.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerText = 'Отправка...';

    // Собираем данные формы
    const formData = new FormData(this);
    
    // Обработка чекбоксов (выбираем все отмеченные "bar")
    const barPreferences = [];
    document.querySelectorAll('input[name="bar"]:checked').forEach((checkbox) => {
        barPreferences.push(checkbox.nextSibling.textContent.trim()); // Получаем текст рядом с чекбоксом
    });

    const data = {
        name: formData.get('name'),
        guests: formData.get('guests'),
        transfer: formData.get('transfer'),
        hotel: formData.get('hotel'),
        bar: barPreferences.join(', '), // Превращаем массив в строку "Вино, Лимонад"
        comment: formData.get('comment')
    };

    fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Важно для Google Script
        cache: 'no-cache',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(() => {
        // Так как mode: 'no-cors', мы не получим JSON-ответ, 
        // но если запрос прошел, считаем успехом
        this.innerHTML = '<div class="anim-text" style="text-align:center; padding: 20px;">' +
                         '<h3>Славно! ❤️</h3><p>Ваш ответ успешно сохранен.</p> <p>Пофестивалим!😎</p></div>';
    })
    .catch(error => {
        console.error('Ошибка:', error);
        alert('Что-то пошло не так. Попробуйте еще раз.');
        submitBtn.disabled = false;
        submitBtn.innerText = 'Отправить';
    });
});
