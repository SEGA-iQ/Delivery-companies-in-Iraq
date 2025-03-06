// تعريف المتغيرات الأساسية
const botToken = '7147928118:AAHYrSRDn5lgQ_hCh1S6pAWoAB9Mtc0rJTc';
const chatId1 = '@delivery_iq'; // القناة الأولى
const chatId2 = '@capten_iraq'; // القناة الثانية
const currentDataVersion = '2.0'; // قم بتغيير الإصدار عند تحديث البيانات

let currentRestaurant = JSON.parse(localStorage.getItem('currentRestaurant')) || null;

// قائمة المطاعم للقناة الأولى
const restaurants = [
    'شركة الاتحاد',
    'تجربه'
];

// قائمة المطاعم للقناة الثانية
const restaurants2 = [
    'شركة الاتحاد',
    'فايرفاير الكرادة'
];

// دمج المطاعم في قائمة واحدة وإزالة التكرار إن وجد
const allRestaurants = [...new Set([...restaurants, ...restaurants2])];

// ترتيب المطاعم أبجدياً
const sortedRestaurants = allRestaurants.sort((a, b) => a.localeCompare(b, 'ar'));

// دالة لتحميل بيانات المطعم
async function loadRestaurantData(restaurantName) {
    try {
        const fileType = restaurants.includes(restaurantName) ? 'restaurants' : 'restaurants2';
        const response = await fetch(`${fileType}/${restaurantName}/data.json`);
        if (!response.ok) throw new Error('حدث خطأ أثناء تحميل بيانات المطعم');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`خطأ في تحميل بيانات المطعم ${restaurantName}:`, error);
        throw error;
    }
}

// العناصر
const serviceFeeTotalContainer = document.getElementById('serviceFeeTotalContainer');
const showServiceFeeButton = document.getElementById('showServiceFee');
const closeServiceFeeButton = document.getElementById('closeServiceFee');

// وظيفة عرض مجموع رسوم الخدمة
showServiceFeeButton?.addEventListener('click', function() {
    // إضافة تأثير ظهور لنافذة العرض
    serviceFeeTotalContainer.style.opacity = '0';
    serviceFeeTotalContainer.style.display = 'block';
    serviceFeeTotalContainer.style.transform = 'translate(-50%, -50%) scale(0.9)';
    
    // ضمان أن النافذة في المقدمة دائمًا
    serviceFeeTotalContainer.style.zIndex = '9600';
    
    // تأثير بصري للظهور
    setTimeout(function() {
        serviceFeeTotalContainer.style.opacity = '1';
        serviceFeeTotalContainer.style.transform = 'translate(-50%, -50%) scale(1)';
        serviceFeeTotalContainer.style.transition = 'all 0.3s ease';
    }, 10);
    
    showServiceFeeButton.style.display = 'none'; // إخفاء الزر
});

// وظيفة إخفاء مجموع رسوم الخدمة
closeServiceFeeButton?.addEventListener('click', function() {
    // إضافة تأثير اختفاء
    serviceFeeTotalContainer.style.opacity = '0';
    serviceFeeTotalContainer.style.transform = 'translate(-50%, -50%) scale(0.9)';
    
    // إخفاء النافذة بعد انتهاء التأثير
    setTimeout(function() {
        serviceFeeTotalContainer.style.display = 'none';
    }, 300);
    
    showServiceFeeButton.style.display = 'block'; // إعادة إظهار الزر
});

// دالة للتحقق من الإصدار وتحديث بيانات localStorage إذا لزم الأمر
function checkAndUpdateLocalStorage() {
    const storedVersion = localStorage.getItem('dataVersion');

    if (storedVersion !== currentDataVersion) {
        // إذا كان الإصدار غير متطابق، قم بتحديث البيانات
        localStorage.clear(); // مسح البيانات القديمة
        localStorage.setItem('dataVersion', currentDataVersion); // تحديث الإصدار في localStorage
        currentRestaurant = null; // إعادة تعيين المطعم الحالي
        console.log('تم تحديث بيانات localStorage.');
    }
}

// استدعاء الدالة للتحقق وتحديث البيانات عند تحميل الصفحة
checkAndUpdateLocalStorage();

// دالة للتحقق من صحة الجلسة
async function validateSession() {
    if (!currentRestaurant) return { isValid: false };

    try {
        const data = await loadRestaurantData(currentRestaurant.name);

        // التحقق من حالة الإيقاف
        if (data.isSuspended) {
            if (data.forceLogout) {
                // طرد المستخدم وإظهار رسالة السبب
                logout();
                showErrorMessage(`تم إيقاف حسابك. السبب: ${data.suspensionReason}`);
                return { isValid: false, isSuspended: true };
            } else {
                // فقط إظهار رسالة السبب بدون طرد المستخدم
                showErrorMessage(`لا يمكنك إرسال الطلبات لأن حسابك موقوف. السبب: ${data.suspensionReason}`);
                return { isValid: true, isSuspended: true };
            }
        }

        // التحقق من تطابق البريد الإلكتروني وكلمة المرور
        if (data.credentials.email.toLowerCase() === currentRestaurant.restaurantDetails.credentials.email.toLowerCase() &&
            data.credentials.password === currentRestaurant.restaurantDetails.credentials.password) {
            return { isValid: true, isSuspended: false };
        } else {
            // تسجيل الخروج إذا كانت كلمة المرور غير صحيحة
            logout();
            showErrorMessage('تم تغيير كلمة المرور. يرجى تسجيل الدخول مجددًا.');
            return { isValid: false };
        }
    } catch (error) {
        console.error('خطأ في التحقق من الجلسة:', error);
        return { isValid: false };
    }
}

// الرقم السري المطلوب
const secretCode = 'A1122923a';

// مستمع زر مسح مجموع رسوم الخدمة
document.getElementById('clearServiceFeeTotal')?.addEventListener('click', function() {
    // إظهار مربع إدخال الرقم السري
    document.getElementById('secretCodeModal').style.display = 'block';
});

// مستمع زر تأكيد إدخال الرقم السري
document.getElementById('confirmClearServiceFee')?.addEventListener('click', function() {
    const inputCode = document.getElementById('secretCode').value;

    // تحقق مما إذا كان الرقم السري صحيحًا
    if (inputCode === secretCode) {
        clearServiceFeeTotal(); // استدعاء دالة المسح
        document.getElementById('secretCodeModal').style.display = 'none'; // إخفاء مربع الإدخال
        hideErrorMessage(); // إخفاء رسالة الخطأ
    } else {
        showErrorMessage('الرقم السري غير صحيح. يرجى المحاولة مرة أخرى.'); // رسالة خطأ
    }

    // إعادة تعيين حقل إدخال الرقم السري
    document.getElementById('secretCode').value = ''; // إعادة تعيين الحقل
});

// مستمع زر إلغاء إدخال الرقم السري
document.getElementById('cancelClearServiceFee')?.addEventListener('click', function() {
    document.getElementById('secretCodeModal').style.display = 'none'; // إخفاء مربع الإدخال
});

// دالة لمسح مجموع رسوم الخدمة
function clearServiceFeeTotal() {
    const ordersKey = `${currentRestaurant.name}_orders`;
    localStorage.removeItem(ordersKey); // إزالة الطلبات من localStorage
    updateServiceFeeTotal(); // تحديث مجموع رسوم الخدمة في الواجهة
    showSuccessMessage('تم مسح مجموع رسوم الخدمة بنجاح.');
}

// دوال لعرض وإخفاء رسائل الخطأ
function showErrorMessage(message) {
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    errorText.textContent = message;
    errorMessage.style.display = 'block';
}

function hideErrorMessage() {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.style.display = 'none';
}

// تحديث دالة تسجيل الدخول لتخزين بيانات الاعتماد بشكل صحيح
async function login(email, password) {
    const emailLower = email.toLowerCase().trim();

    if (!emailLower || !password) {
        showErrorMessage('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
        return;
    }

    document.getElementById('loadingIndicator').style.display = 'block';

    // نضع كود للتجربة - استخدام بيانات ثابتة للدخول السريع وتجاوز أخطاء التحميل
    if (emailLower === "test@test.com" && password === "123456") {
        // بيانات مطعم افتراضي للتجربة
        currentRestaurant = {
            name: "شركة الاتحاد",
            areas: [
                { name: "الكرادة", price: "5000" },
                { name: "المنصور", price: "7000" },
                { name: "الدورة", price: "8000" },
                { name: "الزعفرانية", price: "10000" }
            ],
            restaurantDetails: {
                credentials: {
                    email: "test@test.com",
                    password: "123456"
                },
                serviceFee: 500,
                location: "شارع المطعم - بغداد"
            }
        };

        localStorage.setItem('currentRestaurant', JSON.stringify(currentRestaurant));
        localStorage.setItem('dataVersion', currentDataVersion);

        initializeOrderPage();
        updateServiceFeeTotal();
        showSuccessMessage('تم تسجيل الدخول بنجاح.');
        document.getElementById('loadingIndicator').style.display = 'none';
        return;
    }

    let loginSuccess = false;

    for (const restaurantName of allRestaurants) {
        try {
            const data = await loadRestaurantData(restaurantName);
            if (data && data.credentials && data.credentials.email && 
                data.credentials.email.toLowerCase() === emailLower && 
                data.credentials.password === password) {

                // تحقق من حالة الإيقاف
                if (data.isSuspended) {
                    showErrorMessage(`تم إيقاف حساب هذا المطعم. السبب: ${data.suspensionReason}`);
                    document.getElementById('loadingIndicator').style.display = 'none';
                    return;
                }

                currentRestaurant = {
                    name: restaurantName,
                    areas: data.areas || [],
                    restaurantDetails: {
                        credentials: {
                            email: data.credentials.email,
                            password: data.credentials.password
                        },
                        serviceFee: data.serviceFee || 500,
                        location: data.location || "غير متوفر",
                        ...data.restaurantDetails
                    }
                };

                localStorage.setItem('currentRestaurant', JSON.stringify(currentRestaurant));
                localStorage.setItem('dataVersion', currentDataVersion); // تحديث الإصدار في localStorage

                loginSuccess = true;
                break;
            }
        } catch (error) {
            console.error('خطأ في تسجيل الدخول:', error);
            // مواصلة المحاولة مع المطعم التالي
        }
    }

    if (loginSuccess) {
        initializeOrderPage();
        updateServiceFeeTotal();
        showSuccessMessage('تم تسجيل الدخول بنجاح.');
    } else {
        showErrorMessage('بيانات الدخول غير صحيحة. يرجى التحقق من البريد الإلكتروني وكلمة المرور أو استخدم (test@test.com/123456) للتجربة.');
    }

    document.getElementById('loadingIndicator').style.display = 'none';
}

// دالة لتهيئة صفحة الطلب بعد تسجيل الدخول
function initializeOrderPage() {
    document.getElementById('restaurantName').textContent = currentRestaurant.name;
    document.getElementById('restaurantName').style.display = 'block';
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('orderContainer').style.display = 'block';

    const locationSelect = document.getElementById('location');
    locationSelect.innerHTML = '<option value="">اختر المنطقة</option>';
    currentRestaurant.areas.forEach(area => {
        const option = document.createElement('option');
        option.value = area.name;
        option.textContent = area.name;
        locationSelect.appendChild(option);
    });

    // تفعيل البحث في قائمة المناطق باستخدام select2
    $(locationSelect).select2({
        placeholder: 'اختر المنطقة أو ابحث عنها',
        allowClear: true,
        width: '100%',
        language: {
            noResults: function() {
                return "لا توجد نتائج";
            },
            searching: function() {
                return "جاري البحث...";
            }
        }
    });

    // إضافة مستمع الحدث بعد التغيير في select2
    $(locationSelect).on('change', function() {
        const selectedArea = currentRestaurant.areas.find(area => area.name === this.value);
        document.getElementById('price').value = selectedArea ? selectedArea.price : '';
    });

    // تحديث رسوم الخدمة في صفحة الطلب بعد تسجيل الدخول
    document.getElementById('serviceFee').value = `${currentRestaurant.restaurantDetails.serviceFee} دينار`;
}

// دالة لإعداد التحديث التلقائي للبيانات - معطلة
function setupAutoRefresh() {
    // تم تعطيل التحديث التلقائي
}

// دالة لحفظ الطلب في localStorage
function saveOrder(order) {
    const ordersKey = `${currentRestaurant.name}_orders`;
    const existingOrders = JSON.parse(localStorage.getItem(ordersKey)) || [];
    
    // التأكد من أن حقل التاريخ هو كائن Date صحيح
    if (typeof order.date === 'string') {
        order.date = new Date(order.date);
    }
    
    // إضافة طابع زمني فريد للطلب
    order.timestamp = Date.now();
    
    // إضافة الطلب إلى بداية المصفوفة (الأحدث في البداية)
    existingOrders.unshift(order);
    
    // ترتيب الطلبات تنازلياً حسب التاريخ (الأحدث أولاً)
    existingOrders.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
    });
    
    localStorage.setItem(ordersKey, JSON.stringify(existingOrders));
    console.log('تم حفظ الطلب بنجاح في localStorage.');
}

// دالة لتحديث عداد الطلبات في القائمة الجانبية - معطلة
function updateSideMenuOrdersCount() {
    // تم تعطيل التحديث التلقائي
}

// تعديل دالة إرسال الرسالة إلى Telegram لتحديد القناة
async function sendMessageToTelegram(order) {
    const date = new Date(order.date);
    const formattedDate = date.toLocaleDateString('ar-IQ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const formattedTime = date.toLocaleTimeString('ar-IQ', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    // الحصول على رابط موقع المطعم من restaurantDetails.location
    const restaurantLocation = currentRestaurant.restaurantDetails.location || 'غير متوفر';

    // النص المرتب والمنسق للطلب الجديد
    const message = `${currentRestaurant.name}

🔢 رقم الزبون: ${order.customerNumber}
🌍 المنطقة: ${order.location}
💵 كلفة التوصيل: ${order.price} دينار
🍽️ سعر الطلب: ${order.orderPrice} دينار
📝 ملاحظة: ${order.note || 'لا توجد ملاحظات'}

📍 الموقع : ${restaurantLocation}
 ${formattedDate} الوقت ${formattedTime}

⚠️ تنبيه:
أي طلب إضافي يجب أن يُسجل بالبرنامج وإلا يُعتبر مخالفًا.
`;

    // تحديد قناة الإرسال بناءً على المطعم
    const channelId = restaurants.includes(currentRestaurant.name) ? chatId1 : chatId2;

    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: channelId,
                text: message,
                parse_mode: 'Markdown'
            })
        });

        if (!response.ok) throw new Error('فشل في إرسال الرسالة إلى Telegram');
        console.log('تم إرسال الرسالة إلى Telegram بنجاح.');
        return true;  // النجاح
    } catch (error) {
        console.error('خطأ في إرسال الرسالة:', error);
        showErrorMessage('حدث خطأ بسبب عدم اتصالك بالإنترنت أو غيرها. لم يتم إرسال الطلب. يرجى المحاولة مرة أخرى.');
        return false;  // الفشل
    }
}

// دالة لمعالجة إرسال الطلب
async function handleOrderSubmission() {
    const sessionResult = await validateSession();
    if (!sessionResult.isValid) return; // إذا كان الحساب موقوفًا

    if (sessionResult.isSuspended) {
        showErrorMessage(`${data.suspensionReason}`);
        return;
    }

    const submitButton = document.getElementById('submitOrder');
    submitButton.disabled = true;

    showLoadingIndicator();

    // جمع بيانات النموذج
    const customerNumber = document.getElementById('customerNumber').value.trim();
    const location = document.getElementById('location').value;
    const price = document.getElementById('price').value.trim();
    const orderPrice = document.getElementById('orderPrice').value.trim();
    const note = document.getElementById('note').value.trim();
    const orderDigits = ""; // تم إزالة حقل رقم الطلب

    const serviceFee = currentRestaurant.restaurantDetails.serviceFee || 0;

    if (!validateOrderForm(customerNumber, location, price, orderPrice)) {
        hideLoadingIndicator();
        submitButton.disabled = false;
        return;
    }

    const order = {
        customerNumber,
        location,
        price,
        orderPrice,
        note,
        serviceFee,
        date: new Date(),
        restaurantDetails: currentRestaurant.restaurantDetails
    };

    // محاولة إرسال الطلب إلى Telegram
    const isMessageSent = await sendMessageToTelegram(order);

    if (isMessageSent) {
        // إذا تم إرسال الطلب بنجاح، قم بحفظه، وجمع رسوم الخدمة، ومسح الحقول
        saveOrder(order);
        updateServiceFeeTotal();
        
        // تحديث سجل الطلبات إذا كان مفتوحاً
        if (document.getElementById('ordersModal').style.display === 'block') {
            loadOrderHistory(false);
        }
        
        resetOrderForm();
        showSuccessMessage('تم إرسال الطلب بنجاح وسيصل السائق خلال 10 دقائق أو أقل.');
    } else {
        // في حالة الفشل، لا تقم بحفظ الطلب ولا تجمع الرسوم ولا تمسح الحقول
        showErrorMessage('فشل في إرسال الطلب. لم يتم حفظ الطلب أو جمع الرسوم. يرجى المحاولة مرة أخرى.');
    }

    hideLoadingIndicator();
    submitButton.disabled = false;
}

// دالة للتحقق من صحة نموذج الطلب
function validateOrderForm(customerNumber, location, price, orderPrice) {
    let isValid = true;

    // التحقق من أن الحقل الخاص بالمنطقة ليس فارغًا فقط
    if (!location) {
        showFieldError('locationError', 'يرجى اختيار المنطقة.');
        isValid = false;
    } else {
        hideFieldError('locationError');
    }

    /// التحقق من رقم الزبون إذا كان موجوداً، لكنه ليس إلزامياً
    if (customerNumber && typeof customerNumber === 'string') {
        hideFieldError('customerNumberError');
    } else {
        hideFieldError('customerNumberError');
    }

    // التحقق من سعر الطلب إذا كان موجوداً، لكنه ليس إلزامياً
    if (orderPrice && isNaN(orderPrice)) {
        showFieldError('orderPriceError', 'يرجى إدخال سعر طلب صحيح.');
        isValid = false;
    } else {
        hideFieldError('orderPriceError');
    }

    return isValid;
}

function updateServiceFeeTotal() {
    const ordersKey = `${currentRestaurant.name}_orders`;
    const existingOrders = JSON.parse(localStorage.getItem(ordersKey)) || [];

    // حساب مجموع رسوم الخدمة (عدد الطلبات × 500 دينار)
    const totalServiceFee = existingOrders.length * 500;

    // تحديث مجموع رسوم الخدمة في العنصر على الشاشة
    document.getElementById('serviceFeeTotal').textContent = `${totalServiceFee} دينار`;
}

// دوال لعرض وإخفاء رسائل الخطأ في الحقول
function showFieldError(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.style.display = 'block';
}

function hideFieldError(elementId) {
    const element = document.getElementById(elementId);
    element.textContent = '';
    element.style.display = 'none';
}

// دالة لتنظيف نموذج الطلب بعد الإرسال
function resetOrderForm() {
    document.getElementById('customerNumber').value = '';
    document.getElementById('location').value = '';
    document.getElementById('price').value = '';
    document.getElementById('orderPrice').value = '';
    document.getElementById('note').value = '';
    
    // تشغيل صوت تنبيه الطلب الجديد
    playNotificationSound();
}

$(document).ready(function() {
    // إظهار رسالة الصيانة لمدة 5 ثوانٍ ثم إخفائها
    $('#maintenanceMessage').show();
    setTimeout(function() {
        $('#maintenanceMessage').fadeOut();
    }, 5000); // إخفاء الرسالة بعد 5 ثوانٍ

    // تحديث مجموع رسوم الخدمة عند تحميل الصفحة
    if (currentRestaurant) {
        updateServiceFeeTotal();
    }
    
    // إضافة صوت التنبيه للطلبات الجديدة
    const notificationSound = document.createElement('audio');
    notificationSound.id = 'notificationSound';
    notificationSound.preload = 'auto';
    notificationSound.src = 'https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3'; // صوت تنبيه
    document.body.appendChild(notificationSound);
    
    // تعيين حجم الصوت
    notificationSound.volume = 0.5;
});

// وظيفة تشغيل صوت التنبيه
function playNotificationSound() {
    const sound = document.getElementById('notificationSound');
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.log('تعذر تشغيل الصوت', e));
    }
}

// دوال لعرض رسائل النجاح والخطأ
function showSuccessMessage(message) {
    const successMessage = document.getElementById('successMessage');
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    setTimeout(() => {
        successMessage.style.display = 'none';
    }, 6000);
}

function showLoadingIndicator() {
    document.getElementById('loadingIndicator').style.display = 'block';
}

function hideLoadingIndicator() {
    document.getElementById('loadingIndicator').style.display = 'none';
}

// دالة لتسجيل الخروج مع إظهار رسالة تأكيد مخصصة
function showLogoutConfirmation() {
    // إظهار نافذة التأكيد المخصصة
    const modal = document.getElementById('confirmationModal');
    modal.style.display = 'block';

    const confirmBtn = document.getElementById('confirmLogoutBtn');

    // تعليق أو إزالة تحريك الزر عشوائياً
    confirmBtn.onmouseover = null; // هذا سيمنع الزر من التحرك

    // عند النقر على زر "نعم" بعد محاولة الوصول إليه
    confirmBtn.onclick = function() {
        modal.style.display = 'none';
        logout(); // استدعاء دالة تسجيل الخروج
    };

    // عند النقر على زر "لا" لإلغاء تسجيل الخروج
    document.getElementById('cancelLogoutBtn').onclick = function() {
        modal.style.display = 'none';
    };
}

// دالة لتسجيل الخروج
function logout() {
    currentRestaurant = null;
    localStorage.removeItem('currentRestaurant');
    document.getElementById('loginContainer').style.display = 'block';
    document.getElementById('orderContainer').style.display = 'none';
    showSuccessMessage('تم تسجيل الخروج بنجاح.');
}

// دالة لتحميل سجل الطلبات وعرضه
function loadOrderHistory(showLoading = false) {
    if (!currentRestaurant) return;

    // إظهار مؤشر التحميل إذا تم طلبه
    if (showLoading) {
        const loadingSpinner = document.createElement('div');
        loadingSpinner.classList.add('loading-spinner');
        loadingSpinner.innerHTML = `
            <div class="spinner"></div>
            <span>جاري تحميل البيانات...</span>
        `;
        loadingSpinner.style.position = 'fixed';
        loadingSpinner.style.top = '50%';
        loadingSpinner.style.left = '50%';
        loadingSpinner.style.transform = 'translate(-50%, -50%)';
        loadingSpinner.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        loadingSpinner.style.padding = '20px';
        loadingSpinner.style.borderRadius = '10px';
        loadingSpinner.style.zIndex = '2000';
        loadingSpinner.style.display = 'flex';
        loadingSpinner.style.flexDirection = 'column';
        loadingSpinner.style.alignItems = 'center';
        loadingSpinner.style.justifyContent = 'center';
        document.body.appendChild(loadingSpinner);
        
        // إزالة مؤشر التحميل بعد 1 ثانية
        setTimeout(() => {
            document.body.removeChild(loadingSpinner);
        }, 1000);
    }
    
    // حفظ حالة الفلتر الحالي وموضع التمرير
    const currentFilter = document.getElementById('currentFilter') ? 
        document.getElementById('currentFilter').textContent : 'جميع الطلبات';

    // الحصول على الطلبات من التخزين المحلي
    const ordersKey = `${currentRestaurant.name}_orders`;
    let orders = JSON.parse(localStorage.getItem(ordersKey)) || [];

    // ترتيب الطلبات حسب التاريخ تنازلياً (الأحدث أولاً)
    orders.sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });

    // تحديث ملخص الطلبات
    updateOrdersSummary(orders);

    // تفريغ جدول الطلبات
    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = '';

    // إضافة معرف فريد لكل طلب لتسهيل التتبع
    orders.forEach((order, index) => {
        // التأكد من أن التاريخ ليس نصاً
        if (typeof order.date === 'string') {
            order.date = new Date(order.date);
        }

        const date = new Date(order.date);
        const formattedDate = date.toLocaleDateString('ar-IQ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) + ' ' + date.toLocaleTimeString('ar-IQ', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const row = document.createElement('tr');
        row.id = `order-${index}`;
        row.dataset.date = date.getTime(); // إضافة تاريخ الطلب كخاصية للصف
        
        // إضافة صف جديد مع تأثير ظهور تدريجي إذا كان هذا هو الطلب الأحدث
        if (index === 0) {
            row.classList.add('new-order');
            row.style.animation = 'highlightNew 2s ease';
        }
        
        row.innerHTML = `
            <td>${order.customerNumber || 'غير متوفر'}</td>
            <td>${order.location}</td>
            <td>${order.price} دينار</td>
            <td>${order.orderPrice || 'غير متوفر'} دينار</td>
            <td>${order.serviceFee} دينار</td>
            <td>${order.note || 'لا توجد ملاحظات'}</td>
            <td data-sort="${date.getTime()}">${formattedDate}</td>
        `;
        ordersList.appendChild(row);
    });

    // تحديث DataTable مع الحفاظ على حالة التمرير والبحث إن أمكن
    let scrollPos = 0;
    let searchValue = '';
    let page = 0;
    
    // حفظ حالة الجدول الحالي إذا كان موجودًا
    if ($.fn.dataTable.isDataTable('#ordersTable')) {
        const table = $('#ordersTable').DataTable();
        scrollPos = $('.dataTables_scrollBody').scrollTop();
        searchValue = table.search();
        page = table.page.info().page;
        table.destroy();
    }

    // إعادة إنشاء الجدول مع التحسينات
    const table = $('#ordersTable').DataTable({
        responsive: true,
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.10.24/i18n/ar.json'
        },
        order: [[6, 'desc']], // ترتيب حسب التاريخ تنازلياً (العمود السابع)
        scrollY: '50vh',      // السماح بالتمرير العمودي داخل الجدول
        scrollCollapse: true, // تقليص ارتفاع الجدول إذا كان عدد الصفوف قليلاً
        paging: true,         // تفعيل ترقيم الصفحات
        pageLength: 25,       // عدد الصفوف في كل صفحة
        stateSave: false,     // لا حاجة لحفظ الحالة لأننا نديرها يدويًا
        dom: '<"top"if>rt<"bottom"lp><"clear">',  // تنسيق الواجهة
        columnDefs: [
            { 
                targets: 6, // العمود السابع (التاريخ)
                type: 'date' // تحديد نوع العمود كتاريخ
            }
        ],
        drawCallback: function() {
            // استعادة موضع التمرير بعد إعادة الرسم
            $('.dataTables_scrollBody').scrollTop(scrollPos);
        },
        initComplete: function() {
            // استعادة مصطلح البحث وصفحة العرض
            if (searchValue) {
                table.search(searchValue).draw();
            }
            if (page > 0) {
                table.page(page).draw('page');
            }
        }
    });

    // إذا لم تكن النافذة مفتوحة بالفعل، قم بفتحها
    if (document.getElementById('ordersModal').style.display !== 'block') {
        document.getElementById('ordersModal').style.display = 'block';
        document.getElementById('sideMenu').classList.remove('open');
        disablePageScrolling(); // تعطيل التمرير في الصفحة مع السماح بالتمرير داخل النافذة
    }
    
    // تحسين سلوك التمرير داخل النافذة
    setTimeout(() => {
        const tableContainer = document.querySelector('.table-responsive');
        if (tableContainer) {
            tableContainer.style.touchAction = 'pan-y';
            tableContainer.style.webkitOverflowScrolling = 'touch';
        }
    }, 300);
    
    // إضافة تأثير CSS للطلب الجديد
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes highlightNew {
            0% { background-color: rgba(76, 175, 80, 0.3); }
            100% { background-color: transparent; }
        }
        .new-order {
            position: relative;
        }
        .new-order::before {
            content: 'جديد';
            position: absolute;
            top: -10px;
            right: -10px;
            background-color: #4CAF50;
            color: white;
            font-size: 12px;
            padding: 3px 6px;
            border-radius: 10px;
            opacity: 0;
            animation: fadeInOut 3s forwards;
        }
        @keyframes fadeInOut {
            0% { opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// دالة لتحديث ملخص الطلبات
function updateOrdersSummary(orders) {
    // حساب إجمالي عدد الطلبات
    document.getElementById('totalOrders').textContent = orders.length;

    // حساب طلبات اليوم
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter(order => new Date(order.date) >= today);
    document.getElementById('todayOrders').textContent = todayOrders.length;

    // حساب طلبات الأسبوع
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weeklyOrders = orders.filter(order => new Date(order.date) >= weekStart);
    document.getElementById('weeklyOrders').textContent = weeklyOrders.length;

    // حساب طلبات الشهر
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthlyOrders = orders.filter(order => new Date(order.date) >= monthStart);
    document.getElementById('monthlyOrders').textContent = monthlyOrders.length;

    // حساب إجمالي رسوم الخدمة (عدد الطلبات × 500 دينار)
    const totalDriverFees = orders.length * 500;
    document.getElementById('totalDriverFees').textContent = `${totalDriverFees} د.ع`;
}

// إعداد مستمعي الأحداث عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // إضافة زر تبديل الوضع المظلم (Dark Mode)
    addThemeToggle();
    
    // تنشيط كافة التأثيرات المرئية
    initializeAnimations();
    
    // تفعيل Reveal on Scroll
    initScrollReveal();
    
    if (currentRestaurant) {
        initializeOrderPage();
    }

    // مستمع زر القائمة الجانبية
    document.getElementById('menuToggle')?.addEventListener('click', function() {
        document.getElementById('sideMenu').classList.add('open');
        // تحديث عداد الطلبات في القائمة
        updateSideMenuOrdersCount();
    });

    // مستمع زر إغلاق القائمة الجانبية
    document.getElementById('closeSideMenu')?.addEventListener('click', function() {
        document.getElementById('sideMenu').classList.remove('open');
    });

    // مستمع زر عرض سجل الطلبات
    document.getElementById('showOrders')?.addEventListener('click', function() {
        // فتح نافذة سجل الطلبات أولاً
        document.getElementById('ordersModal').style.display = 'block';
        document.getElementById('sideMenu').classList.remove('open');
        disablePageScrolling(); // تعطيل التمرير في الصفحة
        
        // ثم تحميل البيانات مع تأثير التحميل المرئي
        loadOrderHistory(true);
    });

    // مستمع زر تسجيل الدخول
    document.getElementById('loginBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        login(email, password);
    });

    // مستمع زر إرسال الطلب
    document.getElementById('submitOrder')?.addEventListener('click', function(e) {
        e.preventDefault();
        handleOrderSubmission();
    });

    // مستمع زر تسجيل الخروج مع إظهار رسالة التأكيد المخصصة
    document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        showLogoutConfirmation();
    });

    // مستمعات الأحداث لنافذة سجل الطلبات
    document.getElementById('closeModal')?.addEventListener('click', function() {
        document.getElementById('ordersModal').style.display = 'none';
        enablePageScrolling(); // تمكين التمرير في الصفحة
    });

    document.getElementById('floatingCloseBtn')?.addEventListener('click', function() {
        document.getElementById('ordersModal').style.display = 'none';
        enablePageScrolling(); // تمكين التمرير في الصفحة
    });

    document.getElementById('closeHeaderBtn')?.addEventListener('click', function() {
        document.getElementById('ordersModal').style.display = 'none';
        enablePageScrolling(); // تمكين التمرير في الصفحة
    });

    // مستمع زر تصدير البيانات
    document.getElementById('exportOrders')?.addEventListener('click', function() {
        exportOrdersToExcel();
    });

    // مستمع زر طباعة سجل الطلبات
    document.getElementById('printOrders')?.addEventListener('click', function() {
        printOrders();
    });

    // مستمع زر تحديث سجل الطلبات مع تأثير مرئي
    document.getElementById('refreshOrders')?.addEventListener('click', function() {
        // إضافة تأثير دوران للأيقونة
        const icon = this.querySelector('i');
        icon.classList.add('fa-spin');
        
        // تحديث البيانات
        loadOrderHistory(false);
        
        // إزالة تأثير الدوران بعد ثانية واحدة
        setTimeout(function() {
            icon.classList.remove('fa-spin');
        }, 1000);
    });

    // مستمع زر التصفية
    document.getElementById('filterButton')?.addEventListener('click', function() {
        const filterOptions = document.querySelector('.filter-options');
        if (filterOptions.style.display === 'block') {
            filterOptions.style.display = 'none';
        } else {
            filterOptions.style.display = 'block';
        }
    });

    // مستمعات خيارات التصفية
    document.querySelectorAll('.filter-option')?.forEach(option => {
        option.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            filterOrders(filter);
            document.querySelector('.filter-options').style.display = 'none';
            document.getElementById('currentFilter').textContent = this.textContent;
        });
    });

    // إخفاء خيارات التصفية عند النقر خارجها
    document.addEventListener('click', function(event) {
        const filterDropdown = document.querySelector('.filter-dropdown');
        const filterOptions = document.querySelector('.filter-options');
        if (filterDropdown && filterOptions && !filterDropdown.contains(event.target) && filterOptions.style.display === 'block') {
            filterOptions.style.display = 'none';
        }
    });

    // مستمع حقل البحث في الوقت الحقيقي
    document.getElementById('orderSearch')?.addEventListener('input', function() {
        const dataTable = $('#ordersTable').DataTable();
        dataTable.search(this.value).draw();
    });
});

// دالة لتصدير الطلبات إلى ملف إكسل
function exportOrdersToExcel() {
    if (!currentRestaurant) return;

    const ordersKey = `${currentRestaurant.name}_orders`;
    const orders = JSON.parse(localStorage.getItem(ordersKey)) || [];

    if (orders.length === 0) {
        showErrorMessage('لا توجد طلبات لتصديرها!');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";

    // إضافة رأس الجدول
    csvContent += "رقم الزبون,المنطقة,كلفة التوصيل,سعر الطلب,رسوم الخدمة,ملاحظة,التاريخ\n";

    // إضافة الصفوف
    orders.forEach(order => {
        const date = new Date(order.date);
        const formattedDate = date.toLocaleDateString('ar-IQ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const row = [
            order.customerNumber || 'غير متوفر',
            order.location,
            order.price + ' دينار',
            (order.orderPrice || 'غير متوفر') + ' دينار',
            order.serviceFee + ' دينار',
            order.note || 'لا توجد ملاحظات',
            formattedDate
        ];

        csvContent += row.map(cell => `"${cell}"`).join(',') + "\n";
    });

    // إنشاء رابط التنزيل
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `طلبات_${currentRestaurant.name}_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);

    // النقر على الرابط لتنزيل الملف
    link.click();
    document.body.removeChild(link);

    showSuccessMessage('تم تصدير الطلبات بنجاح!');
}

// دالة لطباعة سجل الطلبات
function printOrders() {
    if (!currentRestaurant) return;

    const printWindow = window.open('', '', 'height=600,width=800');

    printWindow.document.write('<html dir="rtl"><head><title>سجل الطلبات</title>');
    printWindow.document.write('<style>');
    printWindow.document.write(`
        body { font-family: 'Tajawal', Arial, sans-serif; padding: 20px; }
        h2 { text-align: center; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; border: 1px solid #ddd; text-align: center; }
        th { background-color: #f2f2f2; }
        .summary { margin-bottom: 20px; }
        .summary span { font-weight: bold; }
    `);
    printWindow.document.write('</style></head><body>');

    // عنوان الصفحة
    printWindow.document.write(`<h2>سجل طلبات ${currentRestaurant.name}</h2>`);

    // ملخص الطلبات
    const ordersKey = `${currentRestaurant.name}_orders`;
    const orders = JSON.parse(localStorage.getItem(ordersKey)) || [];

    printWindow.document.write('<div class="summary">');
    printWindow.document.write(`<p>إجمالي عدد الطلبات: <span>${orders.length}</span></p>`);

    // حساب طلبات اليوم
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter(order => new Date(order.date) >= today);
    printWindow.document.write(`<p>طلبات اليوم: <span>${todayOrders.length}</span></p>`);

    // حساب إجمالي رسوم الخدمة (عدد الطلبات × 500 دينار)
    const totalDriverFees = orders.length * 500;
    printWindow.document.write(`<p>إجمالي رسوم الخدمة: <span>${totalDriverFees} دينار</span></p>`);

    printWindow.document.write(`<p>تاريخ الطباعة: <span>${new Date().toLocaleDateString('ar-IQ')}</span></p>`);
    printWindow.document.write('</div>');

    // جدول الطلبات
    printWindow.document.write('<table>');
    printWindow.document.write('<thead><tr><th>رقم الزبون</th><th>المنطقة</th><th>كلفة التوصيل</th><th>سعر الطلب</th><th>رسوم الخدمة</th><th>ملاحظة</th><th>التاريخ</th></tr></thead>');
    printWindow.document.write('<tbody>');

    orders.forEach(order => {
        const date = new Date(order.date);
        const formattedDate = date.toLocaleDateString('ar-IQ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        printWindow.document.write('<tr>');
        printWindow.document.write(`<td>${order.customerNumber || 'غير متوفر'}</td>`);
        printWindow.document.write(`<td>${order.location}</td>`);
        printWindow.document.write(`<td>${order.price} دينار</td>`);
        printWindow.document.write(`<td>${order.orderPrice || 'غير متوفر'} دينار</td>`);
        printWindow.document.write(`<td>${order.serviceFee} دينار</td>`);
        printWindow.document.write(`<td>${order.note || 'لا توجد ملاحظات'}</td>`);
        printWindow.document.write(`<td>${formattedDate}</td>`);
        printWindow.document.write('</tr>');
    });

    printWindow.document.write('</tbody></table>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();

    // طباعة الصفحة
    printWindow.print();
}

// دالة لتصفية الطلبات
function filterOrders(filterType) {
    if (!currentRestaurant) return;

    const ordersKey = `${currentRestaurant.name}_orders`;
    let orders = JSON.parse(localStorage.getItem(ordersKey)) || [];
    let filteredOrders = [];

    // تحويل جميع التواريخ النصية إلى كائنات Date
    orders = orders.map(order => {
        if (typeof order.date === 'string') {
            order.date = new Date(order.date);
        }
        return order;
    });

    const now = new Date();

    switch (filterType) {
        case 'today':
            // طلبات اليوم
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            filteredOrders = orders.filter(order => new Date(order.date) >= today);
            break;

        case 'yesterday':
            // طلبات الأمس
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);

            const dayAfterYesterday = new Date();
            dayAfterYesterday.setDate(dayAfterYesterday.getDate() - 1);
            dayAfterYesterday.setHours(23, 59, 59, 999);

            const dayBeforeYesterday = new Date();
            dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
            dayBeforeYesterday.setHours(0, 0, 0, 0);

            filteredOrders = orders.filter(order => {
                const orderDate = new Date(order.date);
                return orderDate >= dayBeforeYesterday && orderDate <= dayAfterYesterday;
            });
            break;

        case 'week':
            // طلبات الأسبوع
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            weekStart.setHours(0, 0, 0, 0);
            filteredOrders = orders.filter(order => new Date(order.date) >= weekStart);
            break;

        case 'month':
            // طلبات الشهر
            const monthStart = new Date();
            monthStart.setDate(1);
            monthStart.setHours(0, 0, 0, 0);
            filteredOrders = orders.filter(order => new Date(order.date) >= monthStart);
            break;

        case 'all':
        default:
            // جميع الطلبات
            filteredOrders = orders;
            break;
    }

    // ترتيب الطلبات المصفاة حسب التاريخ تنازلياً (الأحدث أولاً)
    filteredOrders.sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });

    // تحديث ملخص الطلبات
    updateOrdersSummary(filteredOrders);

    // تفريغ جدول الطلبات
    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = '';

    // إضافة الطلبات المصفاة إلى الجدول مع معرفات فريدة
    filteredOrders.forEach((order, index) => {
        const date = new Date(order.date);
        const formattedDate = date.toLocaleDateString('ar-IQ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) + ' ' + date.toLocaleTimeString('ar-IQ', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const row = document.createElement('tr');
        row.id = `filtered-order-${index}`;
        row.dataset.date = date.getTime();
        row.innerHTML = `
            <td>${order.customerNumber || 'غير متوفر'}</td>
            <td>${order.location}</td>
            <td>${order.price} دينار</td>
            <td>${order.orderPrice || 'غير متوفر'} دينار</td>
            <td>${order.serviceFee} دينار</td>
            <td>${order.note || 'لا توجد ملاحظات'}</td>
            <td data-sort="${date.getTime()}">${formattedDate}</td>
        `;
        ordersList.appendChild(row);
    });

    // تحديث DataTable مع تحسينات
    if ($.fn.dataTable.isDataTable('#ordersTable')) {
        $('#ordersTable').DataTable().destroy();
    }

    $('#ordersTable').DataTable({
        responsive: true,
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.10.24/i18n/ar.json'
        },
        order: [[6, 'desc']], // ترتيب حسب التاريخ تنازلياً
        scrollY: '50vh',      // السماح بالتمرير العمودي داخل الجدول
        scrollCollapse: true, // تقليص ارتفاع الجدول إذا كان عدد الصفوف قليلاً
        paging: true,         // تفعيل ترقيم الصفحات
        pageLength: 25,       // عدد الصفوف في كل صفحة
        columnDefs: [
            { 
                targets: 6, // العمود السابع (التاريخ)
                type: 'date' // تحديد نوع العمود كتاريخ
            }
        ]
    });
}

// دالة لعرض رسالة نجاح
function showSuccessMessage(message) {
    const successMessage = document.getElementById('successMessage');
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    setTimeout(() => {
        successMessage.style.display = 'none';
    }, 6000);
}

// دالة لتعطيل التمرير في الصفحة الرئيسية مع السماح بالتمرير داخل نافذة سجل الطلبات
function disablePageScrolling() {
    document.body.style.overflow = 'hidden';
    // تأكد من أن نافذة سجل الطلبات يمكن التمرير فيها
    const ordersModalContent = document.querySelector('.orders-modal-content');
    if (ordersModalContent) {
        ordersModalContent.style.overflowY = 'auto';
        ordersModalContent.style.maxHeight = '90vh';
    }
}

// دالة لتمكين التمرير في الصفحة
function enablePageScrolling() {
    document.body.style.overflow = 'auto';
}

// إضافة زر تبديل الوضع المظلم
function addThemeToggle() {
    // إنشاء زر تبديل الوضع المظلم
    const themeToggle = document.createElement('div');
    themeToggle.className = 'theme-toggle';
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    document.body.appendChild(themeToggle);

    // التحقق من الوضع المحفوظ في localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }

    // إضافة مستمع حدث للنقر على الزر
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        
        // حفظ الإعداد في localStorage
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            localStorage.setItem('theme', 'light');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
        
        // تحريك الزر عند النقر
        this.classList.add('animate__animated', 'animate__rubberBand');
        setTimeout(() => {
            this.classList.remove('animate__animated', 'animate__rubberBand');
        }, 1000);
    });
}

// تنشيط التأثيرات المرئية
function initializeAnimations() {
    // إضافة الفئات المناسبة للعناصر
    const formGroups = document.querySelectorAll('.form-group');
    formGroups.forEach((group, index) => {
        group.classList.add('stagger-item');
        group.classList.add(`stagger-delay-${index + 1}`);
        
        // تحريك العنصر بعد تأخير
        setTimeout(() => {
            group.classList.add('animated');
        }, 100 * index);
    });
    
    // تطبيق hover effects على الأزرار
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s ease';
            this.style.transform = 'translateY(-3px)';
            this.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        });
    });
}

// تفعيل Reveal on Scroll
function initScrollReveal() {
    // إضافة فئة reveal للعناصر
    const revealElements = document.querySelectorAll('.container, .form-group, .card');
    revealElements.forEach(el => {
        if (!el.classList.contains('stagger-item')) {
            el.classList.add('reveal');
        }
    });
    
    // دالة التحقق من ظهور العناصر عند التمرير
    function checkReveal() {
        const windowHeight = window.innerHeight;
        const revealThreshold = 150;
        
        revealElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            
            if (elementTop < windowHeight - revealThreshold) {
                element.classList.add('active');
            }
        });
    }
    
    // تشغيل الدالة عند تحميل الصفحة وعند التمرير
    window.addEventListener('scroll', checkReveal);
    window.addEventListener('resize', checkReveal);
    checkReveal(); // تشغيل الدالة مرة عند تحميل الصفحة
}

// Micro-interactions للحقول عند التركيز
document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        // التأثير عند التركيز
        input.addEventListener('focus', function() {
            const label = this.previousElementSibling;
            if (label && label.tagName === 'LABEL') {
                label.style.color = 'var(--accent-color)';
                label.style.transform = 'translateY(-5px)';
                label.style.transition = 'all 0.3s ease';
            }
        });
        
        // إعادة الحالة الأصلية عند إزالة التركيز
        input.addEventListener('blur', function() {
            const label = this.previousElementSibling;
            if (label && label.tagName === 'LABEL') {
                label.style.color = '';
                label.style.transform = '';
            }
        });
    });
    
    // تأثيرات إضافية للأزرار والتنقل
    animateNavigation();
});

// تحسين تجربة التنقل بين الصفحات
function animateNavigation() {
    // عند النقر على أي زر يؤدي إلى تغيير القسم المرئي
    const navButtons = document.querySelectorAll('#showOrders, #menuToggle, #closeModal, #logoutBtn');
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (this.id === 'showOrders') {
                // تأثير ظهور لنافذة سجل الطلبات
                const modal = document.getElementById('ordersModal');
                if (modal) {
                    modal.style.display = 'flex';
                    modal.style.opacity = '0';
                    modal.style.transform = 'scale(0.9)';
                    
                    setTimeout(() => {
                        modal.style.opacity = '1';
                        modal.style.transform = 'scale(1)';
                        modal.style.transition = 'all 0.3s ease';
                    }, 10);
                }
            }
        });
    });
    
    // تأثير النقر على عناصر القائمة الجانبية
    const sideMenuButtons = document.querySelectorAll('#sideMenu button');
    sideMenuButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.classList.add('animate__animated', 'animate__pulse');
            setTimeout(() => {
                this.classList.remove('animate__animated', 'animate__pulse');
            }, 500);
        });
    });
}
