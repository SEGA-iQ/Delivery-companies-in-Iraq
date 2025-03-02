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
    // أضف المزيد من المطاعم هنا
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
showServiceFeeButton.addEventListener('click', function() {
    serviceFeeTotalContainer.style.display = 'block'; // إظهار العنصر
    showServiceFeeButton.style.display = 'none'; // إخفاء الزر
});

// وظيفة إخفاء مجموع رسوم الخدمة
closeServiceFeeButton.addEventListener('click', function() {
    serviceFeeTotalContainer.style.display = 'none'; // إخفاء العنصر
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
document.getElementById('clearServiceFeeTotal').addEventListener('click', function() {
    // إظهار مربع إدخال الرقم السري
    document.getElementById('secretCodeModal').style.display = 'block';
});

// مستمع زر تأكيد إدخال الرقم السري
document.getElementById('confirmClearServiceFee').addEventListener('click', function() {
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
document.getElementById('cancelClearServiceFee').addEventListener('click', function() {
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


// دالة لحفظ الطلب في localStorage
function saveOrder(order) {
    const ordersKey = `${currentRestaurant.name}_orders`;
    const existingOrders = JSON.parse(localStorage.getItem(ordersKey)) || [];
    existingOrders.push(order);
    localStorage.setItem(ordersKey, JSON.stringify(existingOrders));
    console.log('تم حفظ الطلب بنجاح في localStorage.');
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
        showErrorMessage(` ${data.suspensionReason}`);
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

    // حساب مجموع رسوم الخدمة بناءً على الطلبات المخزنة
    const totalServiceFee = existingOrders.reduce((sum, order) => sum + (order.serviceFee || 0), 0);

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
});


// دوال لعرض رسائل النجاح والخطأ
function showSuccessMessage(message) {
    const successMessage = document.getElementById('successMessage');
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    setTimeout(() => {
        successMessage.style.display = 'none';
    }, 6000);
}

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

function showErrorMessage(message) {
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    errorText.textContent = message;
    errorMessage.style.display = 'block';
}


function showLoadingIndicator() {
    document.getElementById('loadingIndicator').style.display = 'block';
}

function hideLoadingIndicator() {
    document.getElementById('loadingIndicator').style.display = 'none';
}


// متغير لتخزين الطلبات الحالية
let currentOrders = [];
let currentDataTable = null;
let currentFilter = 'all';

// دالة لعرض سجل الطلبات
function displayOrders(filter = 'all') {
    if (!currentRestaurant) {
        showErrorMessage('يرجى تسجيل الدخول أولاً لعرض سجل الطلبات.');
        return;
    }

    const ordersKey = `${currentRestaurant.name}_orders`;
    const orders = JSON.parse(localStorage.getItem(ordersKey)) || [];
    currentOrders = orders; // تخزين الطلبات في المتغير العام
    currentFilter = filter; // تخزين التصفية الحالية

    if (orders.length === 0) {
        showErrorMessage('لا توجد طلبات مسجلة لهذا المطعم.');
        return;
    }

    // تحديث عنوان الفلتر الحالي
    updateCurrentFilterText(filter);

    // تصفية الطلبات بناءً على المرشح
    let filteredOrders = filterOrdersByFilter(orders, filter);

    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = ''; // تنظيف الجدول

    // عرض الطلبات المصفاة
    filteredOrders.reverse().forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.customerNumber || '-'}</td>
            <td>${order.location}</td>
            <td>${order.price} دينار</td>
            <td>${order.orderPrice} دينار</td>
            <td>${order.serviceFee} دينار</td>
            <td>${order.note || '-'}</td>
            <td>${formatDate(order.date)}</td>
        `;
        ordersList.appendChild(row);
    });

    // حساب ملخص الطلبات
    calculateOrderSummary(orders);

    // عرض النافذة المنبثقة لسجل الطلبات
    document.getElementById('ordersModal').style.display = 'block';

    // إعادة تهيئة جدول البيانات
    initializeDataTable();

    // تفعيل وظيفة السحب في الجدول
    setTimeout(() => {
        // تأخير قليل للتأكد من تحميل العناصر بشكل كامل
        initializeOrdersModal(); //This call is now correct, as it's only called once after the DataTable is initialized.
    }, 300);
}

// تحديث نص التصفية الحالية
function updateCurrentFilterText(filter) {
    const filterTexts = {
        'all': 'جميع الطلبات',
        'today': 'طلبات اليوم',
        'yesterday': 'طلبات الأمس',
        'week': 'طلبات الأسبوع',
        'month': 'طلبات الشهر'
    };

    document.getElementById('currentFilter').textContent = filterTexts[filter] || 'جميع الطلبات';
}

// دالة تنسيق التاريخ بشكل أفضل
function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // تحقق مما إذا كان التاريخ هو اليوم
    if (date.toDateString() === today.toDateString()) {
        return `اليوم ${date.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}`;
    }

    // تحقق مما إذا كان التاريخ هو الأمس
    if (date.toDateString() === yesterday.toDateString()) {
        return `الأمس ${date.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}`;
    }

    // تنسيق التاريخ الكامل
    return date.toLocaleString('ar-IQ', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// دالة لتصفية الطلبات بناءً على الفلتر المحدد
function filterOrdersByFilter(orders, filter) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // ضبط الوقت إلى بداية اليوم

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    switch (filter) {
        case 'today':
            return orders.filter(order => {
                const orderDate = new Date(order.date);
                return orderDate >= today;
            });

        case 'yesterday':
            return orders.filter(order => {
                const orderDate = new Date(order.date);
                return orderDate >= yesterday && orderDate < today;
            });

        case 'week':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            return orders.filter(order => {
                const orderDate = new Date(order.date);
                return orderDate >= weekStart;
            });

        case 'month':
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            return orders.filter(order => {
                const orderDate = new Date(order.date);
                return orderDate >= monthStart;
            });

        default:
            return orders;
    }
}

// تهيئة نافذة سجل الطلبات وتفعيل خاصية السحب
function initializeOrdersModal() {
    // تفعيل وظيفة السحب للتمرير
    enableTableDragScroll();

    // إضافة خاصية التكبير والتصغير بالإصبعين للأجهزة اللمسية
    const tableContainer = document.querySelector('.table-responsive');
    if (tableContainer) {
        // تحسين مظهر الجدول ليكون قابل للسحب بشكل واضح
        tableContainer.style.cursor = 'grab';
        tableContainer.style.overflowY = 'auto';
        tableContainer.style.maxHeight = '60vh';
        tableContainer.style.webkitOverflowScrolling = 'touch';

        // إضافة تلميح واضح للمستخدم حول إمكانية السحب
        const dragHint = document.createElement('div');
        dragHint.className = 'drag-hint';
        dragHint.innerHTML = '<i class="fas fa-arrows-alt"></i> اسحب الجدول للأعلى والأسفل لرؤية جميع الطلبات';
        dragHint.style.textAlign = 'center';
        dragHint.style.padding = '8px';
        dragHint.style.margin = '10px 0';
        dragHint.style.color = '#0056b3';
        dragHint.style.fontSize = '14px';
        dragHint.style.backgroundColor = '#f8f9fa';
        dragHint.style.borderRadius = '5px';
        dragHint.style.border = '1px solid #ddd';

        // إضافة التلميح قبل الجدول
        tableContainer.parentNode.insertBefore(dragHint, tableContainer);

        // إخفاء التلميح بعد 8 ثوانٍ
        setTimeout(() => {
            dragHint.style.opacity = '0';
            dragHint.style.transition = 'opacity 1s';
            setTimeout(() => {
                dragHint.style.display = 'none';
            }, 1000);
        }, 8000);
    }

    // تفعيل التمرير السلس على الأجهزة اللمسية
    const ordersModalContent = document.querySelector('.orders-modal-content');
    if (ordersModalContent) {
        ordersModalContent.style.overscrollBehavior = 'contain';
        ordersModalContent.style.webkitOverflowScrolling = 'touch';
    }
}

// دالة البحث في الطلبات
function searchOrders(query) {
    if (!query || query.trim() === '') {
        displayOrders(currentFilter);
        return;
    }

    query = query.trim().toLowerCase();

    // تصفية الطلبات بناءً على البحث
    const searchResults = currentOrders.filter(order => {
        const searchFields = [
            order.customerNumber,
            order.location,
            order.note,
            order.price,
            order.orderPrice,
            new Date(order.date).toLocaleString('ar-IQ')
        ];

        return searchFields.some(field =>
            field && field.toString().toLowerCase().includes(query)
        );
    });

    if (searchResults.length === 0) {
        // إظهار رسالة عدم وجود نتائج ضمن الجدول وليس كخطأ منبثق
        const ordersList = document.getElementById('ordersList');
        ordersList.innerHTML = `
            <tr>
                <td colspan="7" class="no-results">
                    <i class="fas fa-search-minus"></i>
                    <p>لا توجد نتائج مطابقة للبحث</p>
                </td>
            </tr>
        `;

        if (currentDataTable) {
            currentDataTable.destroy();
        }

        // تهيئة الجدول مع رسالة البحث
        currentDataTable = $('#ordersTable').DataTable({
            responsive: true,
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.11.3/i18n/ar.json',
                emptyTable: "لا توجد نتائج مطابقة للبحث"
            },
            paging: false,
            info: false
        });

        return;
    }

    // عرض نتائج البحث
    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = '';

    searchResults.reverse().forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.customerNumber || '-'}</td>
            <td>${order.location}</td>
            <td>${order.price} دينار</td>
            <td>${order.orderPrice} دينار</td>
            <td>${order.serviceFee} دينار</td>
            <td>${order.note || '-'}</td>
            <td>${formatDate(order.date)}</td>
        `;
        ordersList.appendChild(row);
    });

    // إعادة تهيئة جدول البيانات مع عرض رسالة عدد النتائج
    initializeDataTable();

    // تحديث نص التصفية الحالية ليعكس نتائج البحث
    document.getElementById('currentFilter').textContent = `نتائج البحث (${searchResults.length})`;
}

// تصدير الطلبات إلى ملف اكسل 
function exportToExcel() {
    if (currentOrders.length === 0) {
        showErrorMessage('لا توجد طلبات للتصدير');
        return;
    }

    // تحديد الطلبات التي سيتم تصديرها (الفلترة الحالية أو نتائج البحث)
    const ordersToExport = filterOrdersByFilter(currentOrders, currentFilter);

    if (ordersToExport.length === 0) {
        showErrorMessage('لا توجد طلبات للتصدير في التصفية الحالية');
        return;
    }

    // إنشاء جدول بالبيانات للتصدير
    let tableHtml = '<table dir="rtl"><thead><tr>';
    tableHtml += '<th>رقم الزبون</th>';
    tableHtml += '<th>المنطقة</th>';
    tableHtml += '<th>السعر</th>';
    tableHtml += '<th>سعر الطلب</th>';
    tableHtml += '<th>رسوم الخدمة</th>';
    tableHtml += '<th>ملاحظة</th>';
    tableHtml += '<th>التاريخ</th>';
    tableHtml += '</tr></thead><tbody>';

    // إضافة بيانات الطلبات
    ordersToExport.reverse().forEach(order => {
        tableHtml += '<tr>';
        tableHtml += `<td>${order.customerNumber || '-'}</td>`;
        tableHtml += `<td>${order.location}</td>`;
        tableHtml += `<td>${order.price} دينار</td>`;
        tableHtml += `<td>${order.orderPrice} دينار</td>`;
        tableHtml += `<td>${order.serviceFee} دينار</td>`;
        tableHtml += `<td>${order.note || '-'}</td>`;
        tableHtml += `<td>${new Date(order.date).toLocaleString('ar-IQ')}</td>`;
        tableHtml += '</tr>';
    });

    // إضافة صف إحصائي في النهاية
    const totalDriverFees = ordersToExport.reduce((sum, order) => sum + (parseInt(order.price) || 0), 0);
    const totalServiceFee = ordersToExport.reduce((sum, order) => sum + (parseInt(order.serviceFee) || 0), 0);

    tableHtml += '<tr><th colspan="7" style="text-align:center; background-color:#f0f0f0;">إحصائيات</th></tr>';
    tableHtml += `<tr><td colspan="2">عدد الطلبات: ${ordersToExport.length}</td><td>مجموع الأجور: ${totalDriverFees} دينار</td><td colspan="3">مجموع رسوم الخدمة: ${totalServiceFee} دينار</td><td>تاريخ التصدير: ${new Date().toLocaleDateString('ar-IQ')}</td></tr>`;

    tableHtml += '</tbody></table>';

    // إنشاء ملف اكسل
    const filterText = document.getElementById('currentFilter').textContent;
    const filename = `طلبات_${currentRestaurant.name}_${filterText}_${new Date().toLocaleDateString('ar-IQ')}.xls`;

    // إنشاء رابط للتحميل مع دعم كامل للغة العربية
    const uri = 'data:application/vnd.ms-excel;base64,';
    const template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gtemso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayDirectionRTL/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--><meta http-equiv="content-type" content="text/plain; charset=UTF-8"/></head><body><table dir="rtl">{table}</table></body></html>';
    const base64 = function(s) {
        return window.btoa(unescape(encodeURIComponent(s)));
    };

    const format = function(s, c) {
        return s.replace(/{(\w+)}/g, function(m, p) {
            return c[p];
        });
    };

    const ctx = { worksheet: 'الطلبات', table: tableHtml };

    // إنشاء رابط التحميل وتنزيل الملف
    const link = document.createElement('a');
    link.download = filename;
    link.href = uri + base64(format(template, ctx));
    link.click();

    showSuccessMessage('تم تصدير الطلبات بنجاح');
}

// دالة لطباعة الطلبات
function printOrders() {
    if (currentOrders.length === 0) {
        showErrorMessage('لا توجد طلبات للطباعة');
        return;
    }

    // تحديد الطلبات التي سيتم طباعتها (الفلترة الحالية أو نتائج البحث)
    const ordersToPrint = filterOrdersByFilter(currentOrders, currentFilter);

    if (ordersToPrint.length === 0) {
        showErrorMessage('لا توجد طلبات للطباعة في التصفية الحالية');
        return;
    }

    // إنشاء نافذة طباعة جديدة
    const printWindow = window.open('', '_blank');

    // إنشاء محتوى HTML للطباعة
    const printContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <title>طلبات ${currentRestaurant.name}</title>
            <style>
                body {
                    font-family: 'Cairo', 'Arial', sans-serif;
                    direction: rtl;
                    padding: 20px;
                }
                h1 {
                    text-align: center;
                    color: #0056b3;
                    margin-bottom: 20px;
                }
                .print-info {
                    text-align: center;
                    margin-bottom: 20px;
                    font-size: 14px;
                    color: #666;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: right;
                }
                th {
                    background-color: #f2f2f2;
                    font-weight: bold;
                }
                tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                .summary {
                    margin-top: 30px;
                    border-top: 2px solid #ddd;
                    padding-top: 10px;
                }
                .summary p {
                    margin: 5px 0;
                }
                @media print {
                    body {
                        font-size: 12px;
                    }
                    h1 {
                        font-size: 18px;
                    }
                    .print-info {
                        font-size: 10px;
                    }
                }
            </style>
        </head>
        <body>
            <h1>سجل طلبات ${currentRestaurant.name}</h1>
            <div class="print-info">
                <p>التصفية: ${document.getElementById('currentFilter').textContent}</p>
                <p>تاريخ الطباعة: ${new Date().toLocaleString('ar-IQ')}</p>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>رقم الزبون</th>
                        <th>المنطقة</th>
                        <th>السعر</th>
                        <th>سعر الطلب</th>
                        <th>رسوم الخدمة</th>
                        <th>ملاحظة</th>
                        <th>التاريخ</th>
                    </tr>
                </thead>
                <tbody>
                    ${ordersToPrint.reverse().map(order => `
                        <tr>
                            <td>${order.customerNumber || '-'}</td>
                            <td>${order.location}</td>
                            <td>${order.price} دينار</td>
                            <td>${order.orderPrice} دينار</td>
                            <td>${order.serviceFee} دينار</td>
                            <td>${order.note || '-'}</td>
                            <td>${new Date(order.date).toLocaleString('ar-IQ')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="summary">
                <p><strong>إجمالي عدد الطلبات:</strong> ${ordersToPrint.length}</p>
                <p><strong>مجموع أجور السائقين:</strong> ${ordersToPrint.reduce((sum, order) => sum + (parseInt(order.price) || 0), 0)} دينار</p>
                <p><strong>مجموع رسوم الخدمة:</strong> ${ordersToPrint.reduce((sum, order) => sum + (parseInt(order.serviceFee) || 0), 0)} دينار</p>
            </div>
        </body>
        </html>
    `;

    // كتابة المحتوى في نافذة الطباعة
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();

    // انتظار تحميل الصفحة ثم إظهار مربع حوار الطباعة
    printWindow.onload = function() {
        printWindow.print();
    };
}

// دالة لتفعيل DataTable على جدول الطلبات
function initializeDataTable() {
    // تدمير الجدول السابق إذا كان موجودًا
    if (currentDataTable) {
        currentDataTable.destroy();
    }

    // إنشاء جدول جديد مع تحسينات
    currentDataTable = $('#ordersTable').DataTable({
        retrieve: true,
        responsive: true,
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.11.3/i18n/ar.json'
        },
        pageLength: 10, // عدد الطلبات الظاهرة في كل صفحة
        lengthMenu: [5, 10, 15, 20, 50, 100], // خيارات أعداد الطلبات للعرض
        order: [[6, 'desc']], // ترتيب الطلبات حسب التاريخ (العمود السابع) تنازلياً
        dom: '<"top"flp>rt<"bottom"ip>', // تخصيص موضع عناصر الجدول
        columnDefs: [
            { className: "dt-center", targets: "_all" }, // محاذاة كل الخلايا للوسط
            { className: "all", targets: [1, 6] }, // المنطقة والتاريخ دائما ظاهرين
            { className: "min-tablet", targets: [0, 2] }, // رقم الزبون والسعر يظهران على الأجهزة اللوحية وما فوق
            { className: "desktop", targets: [3, 4, 5] } // باقي العناصر تظهر فقط على سطح المكتب
        ],
        drawCallback: function() {
            // تحسين مظهر عناصر التنقل بين الصفحات
            $('.dataTables_paginate .paginate_button').addClass('pagination-btn');

            // إضافة رسالة عدد النتائج
            const info = this.api().page.info();
            $('.dataTables_info').html(`إجمالي النتائج: <strong>${info.recordsTotal}</strong>`);

            // تحسين مظهر مربع البحث
            $('.dataTables_filter input').attr('placeholder', 'بحث في الجدول...');
        }
    });
}

// دالة لحساب ملخص الطلبات
function calculateOrderSummary(orders) {
    const totalOrders = orders.length;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // ضبط الوقت إلى بداية اليوم

    const todayOrders = orders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= today;
    }).length;

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weeklyOrders = orders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= weekStart;
    }).length;

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyOrders = orders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= monthStart;
    }).length;

    // حساب مجموع رسوم الخدمة
    const totalServiceFee = orders.reduce((sum, order) => sum + (parseInt(order.serviceFee) || 0), 0);

    // حساب مجموع رسوم الخدمة
    const totalServiceFeeSum = orders.reduce((sum, order) => {
        const serviceFee = parseInt(order.serviceFee) || 0;
        return sum + serviceFee;
    }, 0);

    // تحديث البطاقات
    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('todayOrders').textContent = todayOrders;
    document.getElementById('weeklyOrders').textContent = weeklyOrders;
    document.getElementById('monthlyOrders').textContent = monthlyOrders;
    document.getElementById('totalDriverFees').textContent = `${totalServiceFeeSum} د.ع`;

    // تحديث مجموع رسوم الخدمة
    document.getElementById('serviceFeeTotal').textContent = `${totalServiceFee} دينار`;
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

// إعداد مستمعي الأحداث عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    if (currentRestaurant) {
        initializeOrderPage();
    }

    // مستمع زر القائمة الجانبية
    document.getElementById('menuToggle').addEventListener('click', function() {
        document.getElementById('sideMenu').classList.add('open');
    });

    // مستمع زر إغلاق القائمة الجانبية
    document.getElementById('closeSideMenu').addEventListener('click', function() {
        document.getElementById('sideMenu').classList.remove('open');
    });

    // مستمع زر تسجيل الدخول
    document.getElementById('loginBtn').addEventListener('click', function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        login(email, password);
    });

    // مستمع زر إرسال الطلب
    document.getElementById('submitOrder').addEventListener('click', function(e) {
        e.preventDefault();
        handleOrderSubmission();
    });

    // مستمع زر عرض سجل الطلبات
    document.getElementById('showOrders').addEventListener('click', function(e) {
        e.preventDefault();
        displayOrders('all');
    });

    // مستمع زر إغلاق نافذة السجل (السفلي)
    document.getElementById('closeModal').addEventListener('click', function() {
        document.getElementById('ordersModal').style.display = 'none';

        // إعادة تعيين حقل البحث
        const searchInput = document.getElementById('orderSearch');
        if (searchInput) searchInput.value = '';
    });

    // مستمع زر إغلاق نافذة السجل (العلوي)
    document.getElementById('closeHeaderBtn').addEventListener('click', function() {
        document.getElementById('ordersModal').style.display = 'none';

        // إعادة تعيين حقل البحث
        const searchInput = document.getElementById('orderSearch');
        if (searchInput) searchInput.value = '';
    });

    // مستمع زر الإغلاق العائم
    document.getElementById('floatingCloseBtn').addEventListener('click', function() {
        document.getElementById('ordersModal').style.display = 'none';

        // إعادة تعيين حقل البحث
        const searchInput = document.getElementById('orderSearch');
        if (searchInput) searchInput.value = '';
    });

    // مستمع حقل البحث في الطلبات
    document.getElementById('orderSearch')?.addEventListener('input', function() {
        const query = this.value;
        searchOrders(query);
    });

    // مستمع زر تحديث الطلبات
    document.getElementById('refreshOrders')?.addEventListener('click', function() {
        displayOrders('all');
        // إعادة تعيين حقل البحث
        document.getElementById('orderSearch').value = '';
    });

    // مستمع زر تصدير الطلبات
    document.getElementById('exportOrders')?.addEventListener('click', function() {
        exportToExcel();
    });

    // مستمع زر طباعة الطلبات
    document.getElementById('printOrders')?.addEventListener('click', function() {
        printOrders();
    });

    // مستمع زر التصفية
    document.getElementById('filterButton')?.addEventListener('click', function(e) {
        e.stopPropagation(); // منع انتشار الحدث
        const filterOptions = document.querySelector('.filter-options');
        filterOptions.style.display = filterOptions.style.display === 'block' ? 'none' : 'block';
    });

    // مستمع لإخفاء قائمة التصفية عند النقر خارجها
    document.addEventListener('click', function() {
        const filterOptions = document.querySelector('.filter-options');
        if (filterOptions) {
            filterOptions.style.display = 'none';
        }
    });

    // منع إخفاء قائمة التصفية عند النقر داخلها
    document.querySelector('.filter-options')?.addEventListener('click', function(e) {
        e.stopPropagation();
    });

    // مستمع خيارات التصفية
    document.querySelectorAll('.filter-option')?.forEach(option => {
        option.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            displayOrders(filter);
            document.querySelector('.filter-options').style.display = 'none';
        });
    });

    // مستمع زر تسجيل الخروج مع إظهار رسالة التأكيد المخصصة
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        showLogoutConfirmation();
    });
});

// إضافة وظيفة السحب (drag-to-scroll) لجدول الطلبات
function enableTableDragScroll() {
    const tableContainer = document.querySelector('.table-responsive');
    if (!tableContainer) return;

    let isDown = false;
    let startX, startY, scrollLeft, scrollTop;

    // بداية السحب
    tableContainer.addEventListener('mousedown', (e) => {
        isDown = true;
        tableContainer.style.cursor = 'grabbing';
        startX = e.pageX - tableContainer.offsetLeft;
        startY = e.pageY - tableContainer.offsetTop;
        scrollLeft = tableContainer.scrollLeft;
        scrollTop = tableContainer.scrollTop;
    });

    // الخروج من منطقة السحب
    tableContainer.addEventListener('mouseleave', () => {
        isDown = false;
        tableContainer.style.cursor = 'grab';
    });

    // نهاية السحب
    tableContainer.addEventListener('mouseup', () => {
        isDown = false;
        tableContainer.style.cursor = 'grab';
    });

    // أثناء السحب
    tableContainer.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - tableContainer.offsetLeft;
        const y = e.pageY - tableContainer.offsetTop;
        const walkX = (x - startX) * 1.5; // تسريع التمرير الأفقي
        const walkY = (y - startY) * 1.5; // تسريع التمرير الرأسي
        tableContainer.scrollLeft = scrollLeft - walkX;
        tableContainer.scrollTop = scrollTop - walkY;
    });

    // دعم الأجهزة اللمسية
    tableContainer.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            isDown = true;
            startX = e.touches[0].pageX - tableContainer.offsetLeft;
            startY = e.touches[0].pageY - tableContainer.offsetTop;
            scrollLeft = tableContainer.scrollLeft;
            scrollTop = tableContainer.scrollTop;
        }
    }, { passive: false });

    tableContainer.addEventListener('touchend', () => {
        isDown = false;
    });

    tableContainer.addEventListener('touchmove', (e) => {
        if (!isDown || e.touches.length !== 1) return;
        const x = e.touches[0].pageX - tableContainer.offsetLeft;
        const y = e.touches[0].pageY - tableContainer.offsetTop;
        const walkX = (x - startX) * 1.5;
        const walkY = (y - startY) * 1.5;
        tableContainer.scrollLeft = scrollLeft - walkX;
        tableContainer.scrollTop = scrollTop - walkY;

        // منع السحب فقط عند وجود تمرير كبير للمحتوى
        if (Math.abs(walkX) > 10 || Math.abs(walkY) > 10) {
            e.preventDefault();
        }
    }, { passive: false });
}

// تهيئة نافذة سجل الطلبات وتفعيل خاصية السحب
function initializeOrdersModal() {
    // تفعيل وظيفة السحب للتمرير
    enableTableDragScroll();

    // إضافة خاصية التكبير والتصغير بالإصبعين للأجهزة اللمسية
    const tableContainer = document.querySelector('.table-responsive');
    if (tableContainer) {
        // تحسين مظهر الجدول ليكون قابل للسحب بشكل واضح
        tableContainer.style.cursor = 'grab';
        tableContainer.style.overflowY = 'auto';
        tableContainer.style.maxHeight = '60vh';
        tableContainer.style.webkitOverflowScrolling = 'touch';

        // إضافة تلميح واضح للمستخدم حول إمكانية السحب
        const dragHint = document.createElement('div');
        dragHint.className = 'drag-hint';
        dragHint.innerHTML = '<i class="fas fa-arrows-alt"></i> اسحب الجدول للأعلى والأسفل لرؤية جميع الطلبات';
        dragHint.style.textAlign = 'center';
        dragHint.style.padding = '8px';
        dragHint.style.margin = '10px 0';
        dragHint.style.color = '#0056b3';
        dragHint.style.fontSize = '14px';
        dragHint.style.backgroundColor = '#f8f9fa';
        dragHint.style.borderRadius = '5px';
        dragHint.style.border = '1px solid #ddd';

        // إضافة التلميح قبل الجدول
        tableContainer.parentNode.insertBefore(dragHint, tableContainer);

        // إخفاء التلميح بعد 8 ثوانٍ
        setTimeout(() => {
            dragHint.style.opacity = '0';
            dragHint.style.transition = 'opacity 1s';
            setTimeout(() => {
                dragHint.style.display = 'none';
            }, 1000);
        }, 8000);
    }

    // تفعيل التمرير السلس على الأجهزة اللمسية
    const ordersModalContent = document.querySelector('.orders-modal-content');
    if (ordersModalContent) {
        ordersModalContent.style.overscrollBehavior = 'contain';
        ordersModalContent.style.webkitOverflowScrolling = 'touch';
    }
}

// دالة لطباعة الطلبات
function printOrders() {
    if (currentOrders.length === 0) {
        showErrorMessage('لا توجد طلبات للطباعة');
        return;
    }

    // تحديد الطلبات التي سيتم طباعتها (الفلترة الحالية أو نتائج البحث)
    const ordersToPrint = filterOrdersByFilter(currentOrders, currentFilter);

    if (ordersToPrint.length === 0) {
        showErrorMessage('لا توجد طلبات للطباعة في التصفية الحالية');
        return;
    }

    // إنشاء نافذة طباعة جديدة
    const printWindow = window.open('', '_blank');

    // إنشاء محتوى HTML للطباعة
    const printContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <title>طلبات ${currentRestaurant.name}</title>
            <style>
                body {
                    font-family: 'Cairo', 'Arial', sans-serif;
                    direction: rtl;
                    padding: 20px;
                }
                h1 {
                    text-align: center;
                    color: #0056b3;
                    margin-bottom: 20px;
                }
                .print-info {
                    text-align: center;
                    margin-bottom: 20px;
                    font-size: 14px;
                    color: #666;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: right;
                }
                th {
                    background-color: #f2f2f2;
                    font-weight: bold;
                }
                tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                .summary {
                    margin-top: 30px;
                    border-top: 2px solid #ddd;
                    padding-top: 10px;
                }
                .summary p {
                    margin: 5px 0;
                }
                @media print {
                    body {
                        font-size: 12px;
                    }
                    h1 {
                        font-size: 18px;
                    }
                    .print-info {
                        font-size: 10px;
                    }
                }
            </style>
        </head>
        <body>
            <h1>سجل طلبات ${currentRestaurant.name}</h1>
            <div class="print-info">
                <p>التصفية: ${document.getElementById('currentFilter').textContent}</p>
                <p>تاريخ الطباعة: ${new Date().toLocaleString('ar-IQ')}</p>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>رقم الزبون</th>
                        <th>المنطقة</th>
                        <th>السعر</th>
                        <th>سعر الطلب</th>
                        <th>رسوم الخدمة</th>
                        <th>ملاحظة</th>
                        <th>التاريخ</th>
                    </tr>
                </thead>
                <tbody>
                    ${ordersToPrint.reverse().map(order => `
                        <tr>
                            <td>${order.customerNumber || '-'}</td>
                            <td>${order.location}</td>
                            <td>${order.price} دينار</td>
                            <td>${order.orderPrice} دينار</td>
                            <td>${order.serviceFee} دينار</td>
                            <td>${order.note || '-'}</td>
                            <td>${new Date(order.date).toLocaleString('ar-IQ')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="summary">
                <p><strong>إجمالي عدد الطلبات:</strong> ${ordersToPrint.length}</p>
                <p><strong>مجموع أجور السائقين:</strong> ${ordersToPrint.reduce((sum, order) => sum + (parseInt(order.price) || 0), 0)} دينار</p>
                <p><strong>مجموع رسوم الخدمة:</strong> ${ordersToPrint.reduce((sum, order) => sum + (parseInt(order.serviceFee) || 0), 0)} دينار</p>
            </div>
        </body>
        </html>
    `;

    // كتابة المحتوى في نافذة الطباعة
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();

    // انتظار تحميل الصفحة ثم إظهار مربع حوار الطباعة
    printWindow.onload = function() {
        printWindow.print();
    };
}

// دالة لتفعيل DataTable على جدول الطلبات
function initializeDataTable() {
    // تدمير الجدول السابق إذا كان موجودًا
    if (currentDataTable) {
        currentDataTable.destroy();
    }

    // إنشاء جدول جديد مع تحسينات
    currentDataTable = $('#ordersTable').DataTable({
        retrieve: true,
        responsive: true,
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.11.3/i18n/ar.json'
        },
        pageLength: 10, // عدد الطلبات الظاهرة في كل صفحة
        lengthMenu: [5, 10, 15, 20, 50, 100], // خيارات أعداد الطلبات للعرض
        order: [[6, 'desc']], // ترتيب الطلبات حسب التاريخ (العمود السابع) تنازلياً
        dom: '<"top"flp>rt<"bottom"ip>', // تخصيص موضع عناصر الجدول
        columnDefs: [
            { className: "dt-center", targets: "_all" }, // محاذاة كل الخلايا للوسط
            { className: "all", targets: [1, 6] }, // المنطقة والتاريخ دائما ظاهرين
            { className: "min-tablet", targets: [0, 2] }, // رقم الزبون والسعر يظهران على الأجهزة اللوحية وما فوق
            { className: "desktop", targets: [3, 4, 5] } // باقي العناصر تظهر فقط على سطح المكتب
        ],
        drawCallback: function() {
            // تحسين مظهر عناصر التنقل بين الصفحات
            $('.dataTables_paginate .paginate_button').addClass('pagination-btn');

            // إضافة رسالة عدد النتائج
            const info = this.api().page.info();
            $('.dataTables_info').html(`إجمالي النتائج: <strong>${info.recordsTotal}</strong>`);

            // تحسين مظهر مربع البحث
            $('.dataTables_filter input').attr('placeholder', 'بحث في الجدول...');
        }
    });
}

// دالة لحساب ملخص الطلبات
function calculateOrderSummary(orders) {
    const totalOrders = orders.length;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // ضبط الوقت إلى بداية اليوم

    const todayOrders = orders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= today;
    }).length;

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weeklyOrders = orders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= weekStart;
    }).length;

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyOrders = orders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= monthStart;
    }).length;

    // حساب مجموع رسوم الخدمة
    const totalServiceFee = orders.reduce((sum, order) => sum + (parseInt(order.serviceFee) || 0), 0);

    // حساب مجموع رسوم الخدمة
    const totalServiceFeeSum = orders.reduce((sum, order) => {
        const serviceFee = parseInt(order.serviceFee) || 0;
        return sum + serviceFee;
    }, 0);

    // تحديث البطاقات
    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('todayOrders').textContent = todayOrders;
    document.getElementById('weeklyOrders').textContent = weeklyOrders;
    document.getElementById('monthlyOrders').textContent = monthlyOrders;
    document.getElementById('totalDriverFees').textContent = `${totalServiceFeeSum} د.ع`;

    // تحديث مجموع رسوم الخدمة
    document.getElementById('serviceFeeTotal').textContent = `${totalServiceFee} دينار`;
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

// إعداد مستمعي الأحداث عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    if (currentRestaurant) {
        initializeOrderPage();
    }

    // مستمع زر القائمة الجانبية
    document.getElementById('menuToggle').addEventListener('click', function() {
        document.getElementById('sideMenu').classList.add('open');
    });

    // مستمع زر إغلاق القائمة الجانبية
    document.getElementById('closeSideMenu').addEventListener('click', function() {
        document.getElementById('sideMenu').classList.remove('open');
    });

    // مستمع زر تسجيل الدخول
    document.getElementById('loginBtn').addEventListener('click', function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        login(email, password);
    });

    // مستمع زر إرسال الطلب
    document.getElementById('submitOrder').addEventListener('click', function(e) {
        e.preventDefault();
        handleOrderSubmission();
    });

    // مستمع زر عرض سجل الطلبات
    document.getElementById('showOrders').addEventListener('click', function(e) {
        e.preventDefault();
        displayOrders('all');
    });

    // مستمع زر إغلاق نافذة السجل (السفلي)
    document.getElementById('closeModal').addEventListener('click', function() {
        document.getElementById('ordersModal').style.display = 'none';

        // إعادة تعيين حقل البحث
        const searchInput = document.getElementById('orderSearch');
        if (searchInput) searchInput.value = '';
    });

    // مستمع زر إغلاق نافذة السجل (العلوي)
    document.getElementById('closeHeaderBtn').addEventListener('click', function() {
        document.getElementById('ordersModal').style.display = 'none';

        // إعادة تعيين حقل البحث
        const searchInput = document.getElementById('orderSearch');
        if (searchInput) searchInput.value = '';
    });

    // مستمع زر الإغلاق العائم
    document.getElementById('floatingCloseBtn').addEventListener('click', function() {
        document.getElementById('ordersModal').style.display = 'none';

        // إعادة تعيين حقل البحث
        const searchInput = document.getElementById('orderSearch');
        if (searchInput) searchInput.value = '';
    });

    // مستمع حقل البحث في الطلبات
    document.getElementById('orderSearch')?.addEventListener('input', function() {
        const query = this.value;
        searchOrders(query);
    });

    // مستمع زر تحديث الطلبات
    document.getElementById('refreshOrders')?.addEventListener('click', function() {
        displayOrders('all');
        // إعادة تعيين حقل البحث
        document.getElementById('orderSearch').value = '';
    });

    // مستمع زر تصدير الطلبات
    document.getElementById('exportOrders')?.addEventListener('click', function() {
        exportToExcel();
    });

    // مستمع زر طباعة الطلبات
    document.getElementById('printOrders')?.addEventListener('click', function() {
        printOrders();
    });

    // مستمع زر التصفية
    document.getElementById('filterButton')?.addEventListener('click', function(e) {
        e.stopPropagation(); // منع انتشار الحدث
        const filterOptions = document.querySelector('.filter-options');
        filterOptions.style.display = filterOptions.style.display === 'block' ? 'none' : 'block';
    });

    // مستمع لإخفاء قائمة التصفية عند النقر خارجها
    document.addEventListener('click', function() {
        const filterOptions = document.querySelector('.filter-options');
        if (filterOptions) {
            filterOptions.style.display = 'none';
        }
    });

    // منع إخفاء قائمة التصفية عند النقر داخلها
    document.querySelector('.filter-options')?.addEventListener('click', function(e) {
        e.stopPropagation();
    });

    // مستمع خيارات التصفية
    document.querySelectorAll('.filter-option')?.forEach(option => {
        option.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            displayOrders(filter);
            document.querySelector('.filter-options').style.display = 'none';
        });
    });

    // مستمع زر تسجيل الخروج مع إظهار رسالة التأكيد المخصصة
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        showLogoutConfirmation();
    });
});

// إضافة وظيفة السحب (drag-to-scroll) لجدول الطلبات
function enableTableDragScroll() {
    const tableContainer = document.querySelector('.table-responsive');
    if (!tableContainer) return;

    let isDown = false;
    let startX, startY, scrollLeft, scrollTop;

    // بداية السحب
    tableContainer.addEventListener('mousedown', (e) => {
        isDown = true;
        tableContainer.style.cursor = 'grabbing';
        startX = e.pageX - tableContainer.offsetLeft;
        startY = e.pageY - tableContainer.offsetTop;
        scrollLeft = tableContainer.scrollLeft;
        scrollTop = tableContainer.scrollTop;
    });

    // الخروج من منطقة السحب
    tableContainer.addEventListener('mouseleave', () => {
        isDown = false;
        tableContainer.style.cursor = 'grab';
    });

    // نهاية السحب
    tableContainer.addEventListener('mouseup', () => {
        isDown = false;
        tableContainer.style.cursor = 'grab';
    });

    // أثناء السحب
    tableContainer.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - tableContainer.offsetLeft;
        const y = e.pageY - tableContainer.offsetTop;
        const walkX = (x - startX) * 1.5; // تسريع التمرير الأفقي
        const walkY = (y - startY) * 1.5; // تسريع التمرير الرأسي
        tableContainer.scrollLeft = scrollLeft - walkX;
        tableContainer.scrollTop = scrollTop - walkY;
    });

    // دعم الأجهزة اللمسية
    tableContainer.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            isDown = true;
            startX = e.touches[0].pageX - tableContainer.offsetLeft;
            startY = e.touches[0].pageY - tableContainer.offsetTop;
            scrollLeft = tableContainer.scrollLeft;
            scrollTop = tableContainer.scrollTop;
        }
    }, { passive: false });

    tableContainer.addEventListener('touchend', () => {
        isDown = false;
    });

    tableContainer.addEventListener('touchmove', (e) => {
        if (!isDown || e.touches.length !== 1) return;
        const x = e.touches[0].pageX - tableContainer.offsetLeft;
        const y = e.touches[0].pageY - tableContainer.offsetTop;
        const walkX = (x - startX) * 1.5;
        const walkY = (y - startY) * 1.5;
        tableContainer.scrollLeft = scrollLeft - walkX;
        tableContainer.scrollTop = scrollTop - walkY;

        // منع السحب فقط عند وجود تمرير كبير للمحتوى
        if (Math.abs(walkX) > 10 || Math.abs(walkY) > 10) {
            e.preventDefault();
        }
    }, { passive: false });
}

// تهيئة نافذة سجل الطلبات وتفعيل خاصية السحب
function initializeOrdersModal() {
    // تفعيل وظيفة السحب للتمرير
    enableTableDragScroll();

    // إضافة خاصية التكبير والتصغير بالإصبعين للأجهزة اللمسية
    const tableContainer = document.querySelector('.table-responsive');
    if (tableContainer) {
        // تحسين مظهر الجدول ليكون قابل للسحب بشكل واضح
        tableContainer.style.cursor = 'grab';
        tableContainer.style.overflowY = 'auto';
        tableContainer.style.maxHeight = '60vh';
        tableContainer.style.webkitOverflowScrolling = 'touch';

        // إضافة تلميح واضح للمستخدم حول إمكانية السحب
        const dragHint = document.createElement('div');
        dragHint.className = 'drag-hint';
        dragHint.innerHTML = '<i class="fas fa-arrows-alt"></i> اسحب الجدول للأعلى والأسفل لرؤية جميع الطلبات';
        dragHint.style.textAlign = 'center';
        dragHint.style.padding = '8px';
        dragHint.style.margin = '10px 0';
        dragHint.style.color = '#0056b3';
        dragHint.style.fontSize = '14px';
        dragHint.style.backgroundColor = '#f8f9fa';
        dragHint.style.borderRadius = '5px';
        dragHint.style.border = '1px solid #ddd';

        // إضافة التلميح قبل الجدول
        tableContainer.parentNode.insertBefore(dragHint, tableContainer);

        // إخفاء التلميح بعد 8 ثوانٍ
        setTimeout(() => {
            dragHint.style.opacity = '0';
            dragHint.style.transition = 'opacity 1s';
            setTimeout(() => {
                dragHint.style.display = 'none';
            }, 1000);
        }, 8000);
    }

    // تفعيل التمرير السلس على الأجهزة اللمسية
    const ordersModalContent = document.querySelector('.orders-modal-content');
    if (ordersModalContent) {
        ordersModalContent.style.overscrollBehavior = 'contain';
        ordersModalContent.style.webkitOverflowScrolling = 'touch';
    }
}

// دالة لطباعة الطلبات
function printOrders() {
    if (currentOrders.length === 0) {
        showErrorMessage('لا توجد طلبات للطباعة');
        return;
    }

    // تحديد الطلبات التي سيتم طباعتها (الفلترة الحالية أو نتائج البحث)
    const ordersToPrint = filterOrdersByFilter(currentOrders, currentFilter);

    if (ordersToPrint.length === 0) {
        showErrorMessage('لا توجد طلبات للطباعة في التصفية الحالية');
        return;
    }

    // إنشاء نافذة طباعة جديدة
    const printWindow = window.open('', '_blank');

    // إنشاء محتوى HTML للطباعة
    const printContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <title>طلبات ${currentRestaurant.name}</title>
            <style>
                body {
                    font-family: 'Cairo', 'Arial', sans-serif;
                    direction: rtl;
                    padding: 20px;
                }
                h1 {
                    text-align: center;
                    color: #0056b3;
                    margin-bottom: 20px;
                }
                .print-info {
                    text-align: center;
                    margin-bottom: 20px;
                    font-size: 14px;
                    color: #666;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: right;
                }
                th {
                    background-color: #f2f2f2;
                    font-weight: bold;
                }
                tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                .summary {
                    margin-top: 30px;
                    border-top: 2px solid #ddd;
                    padding-top: 10px;
                }
                .summary p {
                    margin: 5px 0;
                }
                @media print {
                    body {
                        font-size: 12px;
                    }
                    h1 {
                        font-size: 18px;
                    }
                    .print-info {
                        font-size: 10px;
                    }
                }
            </style>
        </head>
        <body>
            <h1>سجل طلبات ${currentRestaurant.name}</h1>
            <div class="print-info">
                <p>التصفية: ${document.getElementById('currentFilter').textContent}</p>
                <p>تاريخ الطباعة: ${new Date().toLocaleString('ar-IQ')}</p>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>رقم الزبون</th>
                        <th>المنطقة</th>
                        <th>السعر</th>
                        <th>سعر الطلب</th>
                        <th>رسوم الخدمة</th>
                        <th>ملاحظة</th>
                        <th>التاريخ</th>
                    </tr>
                </thead>
                <tbody>
                    ${ordersToPrint.reverse().map(order => `
                        <tr>
                            <td>${order.customerNumber || '-'}</td>
                            <td>${order.location}</td>
                            <td>${order.price} دينار</td>
                            <td>${order.orderPrice} دينار</td>
                            <td>${order.serviceFee} دينار</td>
                            <td>${order.note || '-'}</td>
                            <td>${new Date(order.date).toLocaleString('ar-IQ')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="summary">
                <p><strong>إجمالي عدد الطلبات:</strong> ${ordersToPrint.length}</p>
                <p><strong>مجموع أجور السائقين:</strong> ${ordersToPrint.reduce((sum, order) => sum + (parseInt(order.price) || 0), 0)} دينار</p>
                <p><strong>مجموع رسوم الخدمة:</strong> ${ordersToPrint.reduce((sum, order) => sum + (parseInt(order.serviceFee) || 0), 0)} دينار</p>
            </div>
        </body>
        </html>
    `;

    // كتابة المحتوى في نافذة الطباعة
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();

    // انتظار تحميل الصفحة ثم إظهار مربع حوار الطباعة
    printWindow.onload = function() {
        printWindow.print();
    };
}

// دالة لتفعيل DataTable على جدول الطلبات
function initializeDataTable() {
    // تدمير الجدول السابق إذا كان موجودًا
    if (currentDataTable) {
        currentDataTable.destroy();
    }

    // إنشاء جدول جديد مع تحسينات
    currentDataTable = $('#ordersTable').DataTable({
        retrieve: true,
        responsive: true,
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.11.3/i18n/ar.json'
        },
        pageLength: 10, // عدد الطلبات الظاهرة في كل صفحة
        lengthMenu: [5, 10, 15, 20, 50, 100], // خيارات أعداد الطلبات للعرض
        order: [[6, 'desc']], // ترتيب الطلبات حسب التاريخ (العمود السابع) تنازلياً
        dom: '<"top"flp>rt<"bottom"ip>', // تخصيص موضع عناصر الجدول
        columnDefs: [
            { className: "dt-center", targets: "_all" }, // محاذاة كل الخلايا للوسط
            { className: "all", targets: [1, 6] }, // المنطقة والتاريخ دائما ظاهرين
            { className: "min-tablet", targets: [0, 2] }, // رقم الزبون والسعر يظهران على الأجهزة اللوحية وما فوق
            { className: "desktop", targets: [3, 4, 5] } // باقي العناصر تظهر فقط على سطح المكتب
        ],
        drawCallback: function() {
            // تحسين مظهر عناصر التنقل بين الصفحات
            $('.dataTables_paginate .paginate_button').addClass('pagination-btn');

            // إضافة رسالة عدد النتائج
            const info = this.api().page.info();
            $('.dataTables_info').html(`إجمالي النتائج: <strong>${info.recordsTotal}</strong>`);

            // تحسين مظهر مربع البحث
            $('.dataTables_filter input').attr('placeholder', 'بحث في الجدول...');
        }
    });
}

// دالة لحساب ملخص الطلبات
function calculateOrderSummary(orders) {
    const totalOrders = orders.length;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // ضبط الوقت إلى بداية اليوم

    const todayOrders = orders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= today;
    }).length;

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weeklyOrders = orders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= weekStart;
    }).length;

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyOrders = orders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= monthStart;
    }).length;

    // حساب مجموع رسوم الخدمة
    const totalServiceFee = orders.reduce((sum, order) => sum + (parseInt(order.serviceFee) || 0), 0);

    // حساب مجموع رسوم الخدمة
    const totalServiceFeeSum = orders.reduce((sum, order) => {
        const serviceFee = parseInt(order.serviceFee) || 0;
        return sum + serviceFee;
    }, 0);

    // تحديث البطاقات
    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('todayOrders').textContent = todayOrders;
    document.getElementById('weeklyOrders').textContent = weeklyOrders;
    document.getElementById('monthlyOrders').textContent = monthlyOrders;
    document.getElementById('totalDriverFees').textContent = `${totalServiceFeeSum} د.ع`;

    // تحديث مجموع رسوم الخدمة
    document.getElementById('serviceFeeTotal').textContent = `${totalServiceFee} دينار`;
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

// إعداد مستمعي الأحداث عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    if (currentRestaurant) {
        initializeOrderPage();
    }

    // مستمع زر القائمة الجانبية
    document.getElementById('menuToggle').addEventListener('click', function() {
        document.getElementById('sideMenu').classList.add('open');
    });

    // مستمع زر إغلاق القائمة الجانبية
    document.getElementById('closeSideMenu').addEventListener('click', function() {
        document.getElementById('sideMenu').classList.remove('open');
    });

    // مستمع زر تسجيل الدخول
    document.getElementById('loginBtn').addEventListener('click', function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        login(email, password);
    });

    // مستمع زر إرسال الطلب
    document.getElementById('submitOrder').addEventListener('click', function(e) {
        e.preventDefault();
        handleOrderSubmission();
    });

    // مستمع زر عرض سجل الطلبات
    document.getElementById('showOrders').addEventListener('click', function(e) {
        e.preventDefault();
        displayOrders('all');
    });

    // مستمع زر إغلاق نافذة السجل (السفلي)
    document.getElementById('closeModal').addEventListener('click', function() {
        document.getElementById('ordersModal').style.display = 'none';

        // إعادة تعيين حقل البحث
        const searchInput = document.getElementById('orderSearch');
        if (searchInput) searchInput.value = '';
    });

    // مستمع زر إغلاق نافذة السجل (العلوي)
    document.getElementById('closeHeaderBtn').addEventListener('click', function() {
        document.getElementById('ordersModal').style.display = 'none';

        // إعادة تعيين حقل البحث
        const searchInput = document.getElementById('orderSearch');
        if (searchInput) searchInput.value = '';
    });

    // مستمع زر الإغلاق العائم
    document.getElementById('floatingCloseBtn').addEventListener('click', function() {
        document.getElementById('ordersModal').style.display = 'none';

        // إعادة تعيين حقل البحث
        const searchInput = document.getElementById('orderSearch');
        if (searchInput) searchInput.value = '';
    });

    // مستمع حقل البحث في الطلبات
    document.getElementById('orderSearch')?.addEventListener('input', function() {
        const query = this.value;
        searchOrders(query);
    });

    // مستمع زر تحديث الطلبات
    document.getElementById('refreshOrders')?.addEventListener('click', function() {
        displayOrders('all');
        // إعادة تعيين حقل البحث
        document.getElementById('orderSearch').value = '';
    });

    // مستمع زر تصدير الطلبات
    document.getElementById('exportOrders')?.addEventListener('click', function() {
        exportToExcel();
    });

    // مستمع زر طباعة الطلبات
    document.getElementById('printOrders')?.addEventListener('click', function() {
        printOrders();
    });

    // مستمع زر التصفية
    document.getElementById('filterButton')?.addEventListener('click', function(e) {
        e.stopPropagation(); // منع انتشار الحدث
        const filterOptions = document.querySelector('.filter-options');
        filterOptions.style.display = filterOptions.style.display === 'block' ? 'none' : 'block';
    });

    // مستمع لإخفاء قائمة التصفية عند النقر خارجها
    document.addEventListener('click', function() {
        const filterOptions = document.querySelector('.filter-options');
        if (filterOptions) {
            filterOptions.style.display = 'none';
        }
    });

    // منع إخفاء قائمة التصفية عند النقر داخلها
    document.querySelector('.filter-options')?.addEventListener('click', function(e) {
        e.stopPropagation();
    });

    // مستمع خيارات التصفية
    document.querySelectorAll('.filter-option')?.forEach(option => {
        option.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            displayOrders(filter);
            document.querySelector('.filter-options').style.display = 'none';
        });
    });

    // مستمع زر تسجيل الخروج مع إظهار رسالة التأكيد المخصصة
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        showLogoutConfirmation();
    });
});
