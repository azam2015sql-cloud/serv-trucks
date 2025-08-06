document.addEventListener('DOMContentLoaded', () => {
    const engineers = {
        '1234': 'سفيان',
        '5678': 'عزام'
    };

    // عناصر واجهة المستخدم
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    const passwordInput = document.getElementById('passwordInput');
    const loginBtn = document.getElementById('loginBtn');
    const loginError = document.getElementById('loginError');
    const currentEngineerSpan = document.getElementById('currentEngineer');
    const logoutBtn = document.getElementById('logoutBtn');

    // إدارة تسجيل الدخول
    loginBtn.addEventListener('click', () => {
        const password = passwordInput.value;
        
        if (engineers[password]) {
            // تسجيل الدخول الناجح
            currentEngineerSpan.textContent = `المهندس: ${engineers[password]}`;
            loginScreen.style.display = 'none';
            mainApp.style.display = 'block';
        } else {
            // فشل تسجيل الدخول
            loginError.textContent = 'كلمة المرور غير صحيحة';
        }
    });

    // إدارة تسجيل الخروج
    logoutBtn.addEventListener('click', () => {
        loginScreen.style.display = 'flex';
        mainApp.style.display = 'none';
        passwordInput.value = '';
        loginError.textContent = '';
    });

    // تهيئة اتصال Socket.io (إذا كنت تستخدمه)
    const socket = io();
    socket.on('connect', () => {
        document.getElementById('connectionText').textContent = 'متصل بالخادم';
    });
});
