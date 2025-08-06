document.addEventListener('DOMContentLoaded', () => {
    // اتصال Socket.io
    const socket = io();
    
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
    let unitsData = JSON.parse(localStorage.getItem('workshopUnits')) || {};
    
    // عناصر تسجيل الدخول
    const loginScreen = document.getElementById('loginScreen');
    const passwordInput = document.getElementById('passwordInput');
    const loginBtn = document.getElementById('loginBtn');
    const loginError = document.getElementById('loginError');
    const mainApp = document.getElementById('mainApp');
    const currentEngineerSpan = document.getElementById('currentEngineer');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // العناصر الرئيسية
    const waitingUnitsContainer = document.getElementById('waiting-units');
    const workshopSections = {
        cargo: {
            element: document.getElementById('cargo'),
            grid: document.querySelector('#cargo .units-grid'),
            stat: document.getElementById('cargo-stat')
        },
        tipper: {
            element: document.getElementById('tipper'),
            grid: document.querySelector('#tipper .units-grid'),
            stat: document.getElementById('tipper-stat')
        },
        tanker: {
            element: document.getElementById('tanker'),
            grid: document.querySelector('#tanker .units-grid'),
            stat: document.getElementById('tanker-stat')
        },
        silo: {
            element: document.getElementById('silo'),
            grid: document.querySelector('#silo .units-grid'),
            stat: document.getElementById('silo-stat')
        },
        rehb: {
            element: document.getElementById('rehb'),
            grid: document.querySelector('#rehb .units-grid'),
            stat: document.getElementById('rehb-stat')
        },
        overhaul: {
            element: document.getElementById('overhaul'),
            grid: document.querySelector('#overhaul .units-grid'),
            stat: document.getElementById('overhaul-stat')
        },
        sparePart: {
            element: document.getElementById('spare-part'),
            grid: document.querySelector('#spare-part .units-grid')
        }
    };
    const outWorkshopGrid = document.querySelector('#out-workshop .units-grid');
    
    // عناصر الحوارات
    const workshopDialog = document.getElementById('workshopDialog');
    const confirmDialog = document.getElementById('confirmDialog');
    const confirmMessage = document.getElementById('confirmMessage');
    const actionDialog = document.getElementById('actionDialog');
    
    // عناصر الإحصائيات
    const waitingCount = document.getElementById('waiting-count');
    const workshopCount = document.getElementById('workshop-count');
    const sparePartCount = document.getElementById('spare-part-count');
    const outCount = document.getElementById('out-count');
    
    // عناصر البحث
    const unitSearch = document.getElementById('unitSearch');
    const clearSearchBtn = document.getElementById('clearSearch');
    
    // المتغيرات
    let selectedUnit = null;
    
    // عرض شاشة تسجيل الدخول أولاً
    loginScreen.style.display = 'flex';
    mainApp.style.display = 'none';
    
    // حدث تسجيل الدخول
    loginBtn.addEventListener('click', () => {
        const password = passwordInput.value.trim();
        
        if (engineers[password]) {
            currentEngineer = engineers[password];
            currentEngineerSpan.textContent = `المهندس: ${currentEngineer}`;
            loginScreen.style.display = 'none';
            mainApp.style.display = 'block';
            
            // تحميل البيانات المحفوظة أو تهيئة جديدة
            if (Object.keys(unitsData).length === 0) {
                initializeUnits();
            } else {
                loadUnitsFromStorage();
            }
            
            initializeApp();
            
            // طلب البيانات الحالية من السيرفر
            socket.emit('requestData');
            
            // الاستماع لتحديثات الوحدات من السيرفر
            socket.on('unitUpdated', (unitData) => {
                if (unitData.engineer !== currentEngineer) {
                    updateUnitFromServer(unitData);
                }
            });
            
            // استقبال البيانات الأولية من السيرفر
            socket.on('initialData', (serverData) => {
                if (Object.keys(serverData).length > 0) {
                    unitsData = serverData;
                    localStorage.setItem('workshopUnits', JSON.stringify(unitsData));
                    loadUnitsFromStorage();
                }
            });
        } else {
            loginError.textContent = 'كلمة المرور غير صحيحة';
        }
    });
    
    // حدث تسجيل الخروج
    logoutBtn.addEventListener('click', () => {
        mainApp.style.display = 'none';
        passwordInput.value = '';
        loginError.textContent = '';
        loginScreen.style.display = 'flex';
        
        // إزالة مستمعي الأحداث
        socket.off('unitUpdated');
        socket.off('initialData');
    });
    
    // دالة لتحديث الوحدة من السيرفر
    function updateUnitFromServer(unitData) {
        const { unitNumber, section, lastMoveTime, engineer } = unitData;
        unitsData[unitNumber] = { section, lastMoveTime, engineer };
        localStorage.setItem('workshopUnits', JSON.stringify(unitsData));
        
        // إعادة تحميل الوحدات
        loadUnitsFromStorage();
    }
    
    // تهيئة الوحدات
    function initializeUnits() {
        // مسح أي بيانات قديمة
        unitsData = {};
        
        // إنشاء الوحدات حسب التسلسل المطلوب
        const unitNumbers = generateUnitNumbers();
        
        // إنشاء جميع الوحدات في منطقة الانتظار
        unitNumbers.forEach(num => {
            createUnit(num, waitingUnitsContainer);
            
            // حفظ البيانات الأولية
            unitsData[num] = {
                section: 'waiting-workshop',
                lastMoveTime: getCurrentDateTime(),
                engineer: currentEngineer
            };
            
            // إرسال التحديث للسيرفر
            socket.emit('updateUnit', unitsData[num]);
        });
        
        localStorage.setItem('workshopUnits', JSON.stringify(unitsData));
        updateAllCounts();
    }
    
    // توليد أرقام الوحدات حسب المطلوب
    function generateUnitNumbers() {
        return [
            // 3001-3221 (221 وحدة)
            ...Array.from({length: 221}, (_, i) => 3001 + i),
            // 3234 (وحدة واحدة)
            3234,
            // 3562-3565 (4 وحدات)
            ...Array.from({length: 4}, (_, i) => 3562 + i),
            // 1551-1560 (10 وحدات)
            ...Array.from({length: 10}, (_, i) => 1551 + i)
        ];
    }
    
    // دالة لتحميل البيانات من localStorage
    function loadUnitsFromStorage() {
        // مسح جميع الوحدات الحالية
        document.querySelectorAll('.units-grid').forEach(grid => {
            grid.innerHTML = '';
        });
        
        // إعادة إنشاء الوحدات من البيانات المحفوظة
        Object.keys(unitsData).forEach(unitNumber => {
            const unitInfo = unitsData[unitNumber];
            const targetContainer = getContainerById(unitInfo.section);
            
            if (targetContainer) {
                createUnitWithData(unitNumber, unitInfo, targetContainer);
            }
        });
        
        updateAllCounts();
    }
    
    // دالة مساعدة للحصول على العنصر الهدف
    function getContainerById(sectionId) {
        if (sectionId === 'waiting-workshop') return waitingUnitsContainer;
        if (sectionId === 'out-workshop') return outWorkshopGrid;
        if (workshopSections[sectionId]) return workshopSections[sectionId].grid;
        return null;
    }
    
    // إنشاء وحدة مع البيانات المحفوظة
    function createUnitWithData(number, unitInfo, container) {
        const unit = document.createElement('div');
        unit.className = 'draggable-unit';
        unit.draggable = true;
        
        const unitNumber = document.createElement('div');
        unitNumber.className = 'unit-number';
        unitNumber.textContent = number;
        
        const unitTime = document.createElement('div');
        unitTime.className = 'unit-time';
        unitTime.textContent = unitInfo.lastMoveTime;
        
        const unitEngineer = document.createElement('div');
        unitEngineer.className = 'unit-engineer';
        unitEngineer.textContent = unitInfo.engineer;
        
        unit.appendChild(unitNumber);
        unit.appendChild(unitTime);
        unit.appendChild(unitEngineer);
        
        setupUnitEvents(unit);
        container.appendChild(unit);
        
        // تحديث لون الوحدة حسب القسم
        updateUnitColor(unit, container);
    }
    
    // إنشاء وحدة جديدة
    function createUnit(number, container) {
        const unit = document.createElement('div');
        unit.className = 'draggable-unit';
        unit.draggable = true;
        
        // إنشاء محتوى الوحدة
        const unitNumber = document.createElement('div');
        unitNumber.className = 'unit-number';
        unitNumber.textContent = number;
        
        const unitTime = document.createElement('div');
        unitTime.className = 'unit-time';
        unitTime.textContent = getCurrentDateTime();
        
        const unitEngineer = document.createElement('div');
        unitEngineer.className = 'unit-engineer';
        unitEngineer.textContent = currentEngineer;
        
        unit.appendChild(unitNumber);
        unit.appendChild(unitTime);
        unit.appendChild(unitEngineer);
        
        // إعداد أحداث الوحدة
        setupUnitEvents(unit);
        
        container.appendChild(unit);
        return unit;
    }
    
    // الحصول على التاريخ والوقت الحالي
    function getCurrentDateTime() {
        const now = new Date();
        const date = now.toLocaleDateString('ar-EG');
        const time = now.toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'});
        return `${date} ${time}`;
    }
    
    // تحديث معلومات الوحدة عند نقلها
    function updateUnitInfo(unit) {
        const timeElement = unit.querySelector('.unit-time');
        const engineerElement = unit.querySelector('.unit-engineer');
        
        if (timeElement) {
            timeElement.textContent = getCurrentDateTime();
        }
        
        if (engineerElement) {
            engineerElement.textContent = currentEngineer;
        }
    }
    
    // إعداد أحداث الوحدة
    function setupUnitEvents(unit) {
        // حدث السحب
        unit.addEventListener('dragstart', (e) => {
            selectedUnit = unit;
            e.dataTransfer.setData('text/plain', unit.querySelector('.unit-number').textContent);
        });
        
        // حدث النقر
        unit.addEventListener('click', (e) => {
            e.stopPropagation();
            handleUnitClick(unit, e.shiftKey);
        });
        
        // حدث النقر المطول (لأجهزة اللمس)
        let pressTimer;
        unit.addEventListener('touchstart', (e) => {
            pressTimer = setTimeout(() => {
                handleUnitClick(unit, true);
            }, 800);
        });
        
        unit.addEventListener('touchend', () => {
            clearTimeout(pressTimer);
        });
    }
    
    // التعامل مع نقر الوحدة
    function handleUnitClick(unit, isShiftPressed) {
        selectedUnit = unit;
        const currentParent = getParentSection(unit);
        
        if (currentParent === 'waiting-workshop') {
            showWorkshopDialog();
        } 
        else if (currentParent === 'spare-part') {
            showWorkshopDialog();
        }
        else if (isShiftPressed) {
            showConfirmDialog('هل أنت متأكد من نقل هذه الوحدة خارج الورشة؟', () => {
                moveUnit(unit, outWorkshopGrid);
            });
        }
        else if (Object.keys(workshopSections).includes(currentParent) && currentParent !== 'sparePart') {
            showActionDialog(unit);
        }
        else if (currentParent === 'out-workshop') {
            moveToWaiting(unit);
        }
    }
    
    // عرض حوار الإجراءات
    function showActionDialog(unit) {
        actionDialog.showModal();
        
        document.getElementById('moveToSpare').onclick = () => {
            moveToSparePart(unit);
            actionDialog.close();
        };
        
        document.getElementById('moveOut').onclick = () => {
            showConfirmDialog('هل أنت متأكد من إخراج هذه الوحدة من الورشة؟', () => {
                moveUnit(unit, outWorkshopGrid);
            });
            actionDialog.close();
        };
        
        document.getElementById('cancelAction').onclick = () => {
            actionDialog.close();
            selectedUnit = null;
        };
    }
    
    // الحصول على القسم الأب للوحدة
    function getParentSection(unit) {
        const parentElement = unit.closest('.drop-zone, .subsection-drop-zone');
        return parentElement ? parentElement.id : null;
    }
    
    // عرض حوار اختيار قسم الورشة
    function showWorkshopDialog() {
        // إعداد أحداث الأزرار
        document.querySelectorAll('#workshopDialog button[data-section]').forEach(btn => {
            btn.onclick = (e) => {
                const sectionId = e.target.dataset.section;
                const targetGrid = workshopSections[sectionId].grid;
                workshopDialog.close();
                moveUnit(selectedUnit, targetGrid);
            };
        });
        
        document.getElementById('cancelWorkshopMove').onclick = () => {
            workshopDialog.close();
            selectedUnit = null;
        };
        
        workshopDialog.showModal();
    }
    
    // عرض حوار التأكيد
    function showConfirmDialog(message, confirmAction) {
        confirmMessage.textContent = message;
        
        document.getElementById('confirmYes').onclick = () => {
            confirmAction();
            confirmDialog.close();
            selectedUnit = null;
        };
        
        document.getElementById('confirmNo').onclick = () => {
            confirmDialog.close();
            selectedUnit = null;
        };
        
        confirmDialog.showModal();
    }
    
    // نقل الوحدة إلى قسم انتظار الإسبير
    function moveToSparePart(unit) {
        moveUnit(unit, workshopSections.sparePart.grid);
    }
    
    // نقل الوحدة إلى منطقة الانتظار
    function moveToWaiting(unit) {
        moveUnit(unit, waitingUnitsContainer);
    }
    
    // نقل الوحدة
    function moveUnit(unit, targetContainer) {
        if (unit && targetContainer && unit.parentElement !== targetContainer) {
            const unitNumber = unit.querySelector('.unit-number').textContent;
            const parentElement = targetContainer.closest('.drop-zone, .subsection-drop-zone');
            
            targetContainer.appendChild(unit);
            updateUnitInfo(unit);
            updateUnitColor(unit, targetContainer);
            updateAllCounts();
            
            // حفظ البيانات في localStorage
            const unitData = {
                unitNumber,
                section: parentElement.id,
                lastMoveTime: getCurrentDateTime(),
                engineer: currentEngineer
            };
            
            unitsData[unitNumber] = unitData;
            localStorage.setItem('workshopUnits', JSON.stringify(unitsData));
            
            // إرسال التحديث للسيرفر
            socket.emit('updateUnit', unitData);
        }
    }
    
    // تحديث لون الوحدة حسب المنطقة
    function updateUnitColor(unit, targetContainer) {
        const parentElement = targetContainer.closest('.drop-zone, .subsection-drop-zone');
        if (!parentElement) return;
        
        const colors = {
            'waiting-workshop': 'var(--accent-orange)',
            'cargo': 'var(--primary-blue)',
            'tipper': 'var(--primary-blue)',
            'tanker': 'var(--primary-blue)',
            'silo': 'var(--primary-blue)',
            'rehb': 'var(--primary-blue)',
            'overhaul': 'var(--primary-blue)',
            'spare-part': 'var(--secondary-green)',
            'out-workshop': 'var(--danger-red)'
        };
        
        unit.style.backgroundColor = colors[parentElement.id] || 'var(--primary-blue)';
    }
    
    // تحديث جميع العدادت
    function updateAllCounts() {
        // تحديث العدادت الرئيسية
        waitingCount.textContent = waitingUnitsContainer.children.length;
        sparePartCount.textContent = workshopSections.sparePart.grid.children.length;
        outCount.textContent = outWorkshopGrid.children.length;
        
        // تحديث عداد الورشة الكلي
        let workshopTotal = 0;
        
        // تحديث إحصائيات الأقسام الفرعية
        Object.keys(workshopSections).forEach(section => {
            if (section !== 'sparePart') {
                const count = workshopSections[section].grid.children.length;
                workshopTotal += count;
                if (workshopSections[section].stat) {
                    workshopSections[section].stat.textContent = count;
                }
            }
        });
        
        workshopCount.textContent = workshopTotal;
        
        // تحديث العدادت في العناوين
        document.querySelectorAll('.count-badge').forEach(badge => {
            const container = badge.closest('.drop-zone, .subsection-drop-zone');
            if (container) {
                const unitsGrid = container.querySelector('.units-grid');
                badge.textContent = unitsGrid ? unitsGrid.children.length : 0;
            }
        });
    }
    
    // إعداد أحداث السحب والإفلات
    function setupDropZones() {
        document.querySelectorAll('.drop-zone, .subsection-drop-zone').forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                zone.classList.add('drag-over');
            });
            
            zone.addEventListener('dragleave', () => {
                zone.classList.remove('drag-over');
            });
            
            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.classList.remove('drag-over');
                
                if (selectedUnit) {
                    const targetGrid = zone.querySelector('.units-grid') || zone;
                    moveUnit(selectedUnit, targetGrid);
                }
            });
        });
    }
    
    // إعداد وظيفة البحث
    function setupSearch() {
        unitSearch.addEventListener('input', () => {
            const searchTerm = unitSearch.value.trim().toLowerCase();
            
            document.querySelectorAll('.draggable-unit').forEach(unit => {
                const unitText = unit.querySelector('.unit-number').textContent.toLowerCase();
                unit.style.display = unitText.includes(searchTerm) ? 'flex' : 'none';
            });
            
            updateAllCounts();
        });
        
        clearSearchBtn.addEventListener('click', () => {
            unitSearch.value = '';
            document.querySelectorAll('.draggable-unit').forEach(unit => {
                unit.style.display = 'flex';
            });
            updateAllCounts();
        });
    }
    
    // تهيئة التطبيق
    function initializeApp() {
        setupDropZones();
        setupSearch();
    }
});
