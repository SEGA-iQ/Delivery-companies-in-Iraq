// Import restaurant lists
const restaurants = [
    'شركة الاتحاد',
    'تجربه'
];

const restaurants2 = [
    'شركة الاتحاد',
    'فايرفاير الكرادة'
];

document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard loaded');
    loadDashboardData();
});

async function loadDashboardData() {
    try {
        // Add error handling for fetch requests
        const ordersResponse = await fetch('/api/orders').catch(error => {
            throw new Error('Failed to fetch orders: ' + error.message);
        });

        const statsResponse = await fetch('/api/stats').catch(error => {
            throw new Error('Failed to fetch stats: ' + error.message);
        });

        if (!ordersResponse.ok || !statsResponse.ok) {
            throw new Error('Server response was not ok');
        }

        const orders = await ordersResponse.json();
        const stats = await statsResponse.json();

        console.log('Fetched orders:', orders); // Debug log
        console.log('Fetched stats:', stats);   // Debug log

        const totalFees = stats.reduce((sum, stat) => sum + Number(stat.totalServiceFees), 0);
        const totalOrders = orders.length;

        updateDashboardUI(totalFees, totalOrders, stats, orders);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        document.getElementById('totalServiceFees').textContent = 'خطأ في التحميل';
        document.getElementById('activeAccounts').textContent = 'خطأ';
        document.getElementById('totalOrders').textContent = 'خطأ';
    }
}

function updateDashboardUI(totalFees, totalOrdersCount, accountsData, allOrders) {
    try {
        document.getElementById('totalServiceFees').textContent = `${totalFees.toLocaleString()} دينار`;
        document.getElementById('activeAccounts').textContent = accountsData.length;
        document.getElementById('totalOrders').textContent = totalOrdersCount;

        updateAccountsTable(accountsData);
        updateOrdersTable(allOrders);
    } catch (error) {
        console.error('Error updating dashboard UI:', error);
    }
}

function updateAccountsTable(accountsData) {
    const tableBody = document.getElementById('accountsList');
    tableBody.innerHTML = '';

    accountsData.forEach(account => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${account.name}</td>
            <td>${account.fees.toLocaleString()} دينار</td>
            <td>${account.orders}</td>
            <td>${account.lastActivity}</td>
        `;
        tableBody.appendChild(row);
    });

    if ($.fn.DataTable.isDataTable('#accountsTable')) {
        $('#accountsTable').DataTable().destroy();
    }

    $('#accountsTable').DataTable({
        language: {
            url: '//cdn.datatables.net/plug-ins/1.13.4/i18n/ar.json'
        },
        order: [[2, 'desc']],
        responsive: true
    });
}

function updateOrdersTable(orders) {
    const tableBody = document.getElementById('ordersList');
    tableBody.innerHTML = '';

    orders.sort((a, b) => new Date(b.date) - new Date(a.date));

    orders.forEach(order => {
        const row = document.createElement('tr');
        const orderDate = new Date(order.date).toLocaleString('ar-IQ');
        
        row.innerHTML = `
            <td>${order.restaurantName}</td>
            <td>${order.customerNumber}</td>
            <td>${order.location}</td>
            <td>${order.price} دينار</td>
            <td>${order.orderPrice} دينار</td>
            <td>${order.orderDigits || 'غير متوفر'}</td>
            <td>${orderDate}</td>
            <td>${order.note || 'لا توجد ملاحظات'}</td>
        `;
        tableBody.appendChild(row);
    });

    if ($.fn.DataTable.isDataTable('#ordersTable')) {
        $('#ordersTable').DataTable().destroy();
    }

    $('#ordersTable').DataTable({
        language: {
            url: '//cdn.datatables.net/plug-ins/1.13.4/i18n/ar.json'
        },
        order: [[6, 'desc']],
        responsive: true
    });
}

// Auto refresh every minute
setInterval(loadDashboardData, 60000);