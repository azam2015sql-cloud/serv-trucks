document.addEventListener('DOMContentLoaded', () => {
    // بيانات المهندسين وكلمات المرور
    const engineers = {
        '11742': 'سفيان',
        '11708': 'عزام',
        '20091': 'محمد علي',
        '10841': 'عبدالهادي',
        '10596': 'سامي',
        '12252': 'جعفر',
        '11674': 'وليد',
        '10341': 'عادل',
        '10156': 'محمد محجوب'
    };
    
    let currentEngineer = 'غير معروف';
    let unitsData = {};
    let socket;
    
    // عناصر واجهة المستخدم
    const connectionStatus = document.getElementById('connectionStatus');
    const connectionText = document.getElementById('connectionText');
    const userCount = document.getElementById('userCount');
    const loginScreen = document.getElementById('loginScreen');
    const passwordInput = document.getElementById('passwordInput');
    const loginBtn = document.getElementById('loginBtn');
    const loginError = document.getElementById('loginError');
    const mainApp = document.getElementById('mainApp');
    const currentEngineerSpan = document.getElementById('currentEngineer');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // تهيئة اتصال WebSocket
    function initializeWebSocket() {
        const wsUrl = window.location.hostname === 'localhost' ? 
            'http://localhost:3000' : 
            'https://your-production-server.com';
        
        socket = io(wsUrl);
        
        socket.on('connect', () => {
            connectionStatus.classList.add('connected');
            connectionStatus.classList.remove('disconnected');
            connectionText.textContent = 'متصل بالخادم';
        });
        
        socket.on('disconnect', () => {
            connectionStatus.classList.remove('connected');
            connectionStatus.classList.add('disconnected');
            connectionText.textContent = 'غير متصل بالخادم - جاري إعادة المحاولة...';
        });
        
        socket.on('connect_error', () => {
            connectionStatus.classList.remove('connected');
            connectionStatus.classList.add('disconnected');
            connectionText.textContent = 'خطأ في الاتصال بالخادم';
        });
        
        socket.on('userCount', (count) => {
            userCount.textContent = `${count} مستخدم متصل`;
        });
        
        socket.on('initialData', (data) => {
            unitsData = data.units;
            loadUnitsFromServer();
        });
        
        socket.on('unitMoved', (data) => {
            const { unitNumber, newSection, engineer, time } = data;
            
            // تحديث البيانات المحلية
            unitsData[unitNumber] = {
                section: newSection,
                lastMoveTime: time,
                engineer: engineer
            };
            
            // تحديث الواجهة
            updateUnitDisplay(unitNumber, newSection, time, engineer);
            updateAllCounts();
        });
    }
    
    // تحديث عرض الوحدة
    function updateUnitDisplay(unitNumber, newSection, time, engineer) {
        const unitElement = document.querySelector(`.unit-number:contains("${unitNumber}")`)?.parentElement;
        if (!unitElement) return;
        
        const targetContainer = getContainerById(newSection);
        if (!targetContainer) return;
        
        // تحديث المعلومات
        const unitTime = unitElement.querySelector('.unit-time');
        const unitEngineer = unitElement.querySelector('.unit-engineer');
        
        if (unitTime) unitTime.textContent = time;
        if (unitEngineer) unitEngineer.textContent = engineer;
        
        // نقل الوحدة إذا لزم الأمر
        if (unitElement.parentElement !== targetContainer) {
            targetContainer.appendChild(unitElement);
            updateUnitColor(unitElement, targetContainer);
        }
    }
    
    // تحميل الوحدات من الخادم
    function loadUnitsFromServer() {
        // مسح جميع الوحدات الحالية
        document.querySelectorAll('.units-grid').forEach(grid => {
            grid.innerHTML = '';
        });
        
        // إنشاء الوحدات من البيانات
        Object.keys(unitsData).forEach(unitNumber => {
            const unitInfo = unitsData[unitNumber];
            const targetContainer = getContainerById(unitInfo.section);
            
            if (targetContainer) {
                createUnitWithData(unitNumber, unitInfo, targetContainer);
            }
        });
        
        updateAllCounts();
    }
    
    // إرسال حدث نقل الوحدة إلى الخادم
    function sendUnitMove(unit, targetContainer) {
        const unitNumber = unit.querySelector('.unit-number').textContent;
        const parentElement = targetContainer.closest('.drop-zone, .subsection-drop-zone');
        const time = getCurrentDateTime();
        
        if (socket && socket.connected && parentElement) {
            socket.emit('moveUnit', {
                unitNumber: unitNumber,
                newSection: parentElement.id,
                engineer: currentEngineer,
                time: time
            });
        }
    }
    
    // تعديل دالة نقل الوحدة لاستخدام WebSocket
    function moveUnit(unit, targetContainer) {
        if (unit && targetContainer && unit.parentElement !== targetContainer) {
            const unitNumber = unit.querySelector('.unit-number').textContent;
            const parentElement = targetContainer.closest('.drop-zone, .subsection-drop-zone');
            
            targetContainer.appendChild(unit);
            updateUnitInfo(unit);
            updateUnitColor(unit, targetContainer);
            updateAllCounts();
            
            // إرسال التحديث إلى الخادم
            sendUnitMove(unit, targetContainer);
        }
    }
    
    // باقي الدوال تبقى كما هي مع استبدال localStorage بالاتصال بالخادم
    // ...
    
    // تهيئة التطبيق
    function initializeApp() {
        initializeWebSocket();
        setupDropZones();
        setupSearch();
    }
    
    // بدء التطبيق عند تحميل الصفحة
    initializeApp();
});