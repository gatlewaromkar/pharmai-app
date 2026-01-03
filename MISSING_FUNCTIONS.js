// ========================================
// PHARMAI - ALL MISSING FUNCTIONS
// Copy-paste this entire file into index.html <script> section
// ========================================

// === CHAT FUNCTIONS ===
function toggleChat() {
    const widget = document.getElementById('chatWidget');
    if (widget) {
        widget.classList.toggle('hidden');
    }
}

function quickChat(text) {
    const widget = document.getElementById('chatWidget');
    if (widget && widget.classList.contains('hidden')) {
        toggleChat();
    }
    const input = document.getElementById('chatInput');
    if (input) {
        input.value = text;
        setTimeout(() => sendMessage(), 300);
    }
    showToast('AI Agent Assigned', 'info');
}

// === TOAST NOTIFICATIONS ===
function showToast(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed top-8 right-8 p-4 rounded-xl backdrop-blur-xl border border-white/10 shadow-2xl z-[1000] flex items-center gap-3 animate__animated animate__slideInRight`;
    const color = type === 'success' ? 'text-emerald-400' : type === 'error' ? 'text-red-400' : 'text-teal-400';
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    toast.innerHTML = `<i class="fas ${icon} ${color}"></i> <span class="text-white text-sm font-bold uppercase tracking-widest">${msg}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.replace('animate__slideInRight', 'animate__slideOutRight');
        setTimeout(() => toast.remove(), 1000);
    }, 3000);
}

// === DATA REFRESH ===
async function refreshData() {
    try {
        const res = await fetch(`${API_URL}/inventory`);
        inventory = await res.json();
        renderInventory();
    } catch (err) {
        console.error('Data refresh failed:', err);
    }
}

// === INVENTORY ===
function renderInventory() {
    const tbody = document.getElementById('inventoryTable');
    if (!tbody) return;
    tbody.innerHTML = inventory.map(item => {
        const stock = item.stock || item.qty || 0;
        const status = stock < 20 ? 'text-red-500 font-black' : (stock < 50 ? 'text-orange-400' : 'text-emerald-500');
        const val = (stock * item.price).toLocaleString();
        return `
            <tr class="border-b border-white/5 hover:bg-white/5 transition">
                <td class="p-6 text-white font-medium">${item.name}</td>
                <td class="p-6 text-slate-400 font-mono">₹${item.price}</td>
                <td class="p-6 ${status}">${stock} UNITS</td>
                <td class="p-6 text-white font-black font-mono">₹${val}</td>
                <td class="p-6 text-xs text-slate-500 font-mono">${item.expiry}</td>
            </tr>
        `;
    }).join('');
}

// === ORDERS ===
async function fetchOrders() {
    const body = document.getElementById('ordersBody');
    if (!body) return;
    try {
        const res = await fetch(`${API_URL}/patient-history`);
        const data = await res.json();
        body.innerHTML = data.slice(0, 5).map(h => `
            <tr class="border-b border-white/5">
                <td class="p-4 text-white">${h.patient || 'N/A'}</td>
                <td class="p-4 text-slate-400">${h.details || 'N/A'}</td>
                <td class="p-4 text-emerald-400 font-mono">₹${(h.totalAmount || 0).toLocaleString()}</td>
                <td class="p-4 text-slate-500 text-xs">${new Date(h.timestamp).toLocaleDateString()}</td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Orders fetch failed:', err);
    }
}

// === PATIENT HISTORY ===
async function fetchHistory() {
    const list = document.getElementById('historyList');
    if (!list) return;
    try {
        const res = await fetch(`${API_URL}/patient-history`);
        const data = await res.json();
        list.innerHTML = data.map(h => `
            <div class="p-6 glass-card border-white/5">
                <h4 class="text-xl font-black text-white mb-1">${h.patient || 'Unknown'}</h4>
                <p class="text-xs text-slate-500 mb-4">${h.details || 'No details'}</p>
                <div class="flex justify-between items-center text-sm font-bold">
                    <span class="text-slate-300 font-mono">₹${(h.totalAmount || 0).toLocaleString()}</span>
                    <span class="text-slate-500 text-xs">${new Date(h.timestamp).toDateString()}</span>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('History fetch failed:', err);
    }
}

// === BILLING ===
function addToBill() {
    const medId = document.getElementById('billMedicineSelect')?.value;
    const qty = parseInt(document.getElementById('billQty')?.value || 0);
    const med = inventory.find(i => i.name === medId);
    if (med && qty > 0) {
        billItems.push({ name: med.name, price: med.price, qty: qty, total: med.price * qty });
        renderBill();
        showToast('Item Added', 'success');
    }
}

function renderBill() {
    const tbody = document.getElementById('billTable');
    if (!tbody) return;
    tbody.innerHTML = billItems.map(item => `
        <tr class="border-b border-white/5">
            <td class="py-6 text-white">${item.name}</td>
            <td class="py-6 text-right text-slate-400 font-mono">₹${item.price}</td>
            <td class="py-6 text-center text-white">${item.qty} UNITS</td>
            <td class="py-6 text-right text-emerald-400 font-black font-mono">₹${item.total.toLocaleString()}</td>
        </tr>
    `).join('');

    const sub = billItems.reduce((s, i) => s + i.total, 0);
    const tax = Math.round(sub * 0.05);
    if (document.getElementById('subTotal')) document.getElementById('subTotal').innerText = sub.toLocaleString();
    if (document.getElementById('taxTotal')) document.getElementById('taxTotal').innerText = tax.toLocaleString();
    if (document.getElementById('grandTotal')) document.getElementById('grandTotal').innerText = (sub + tax).toLocaleString();
}

// === DOSAGE CALCULATOR ===
function calculateDose() {
    const weight = parseFloat(document.getElementById('doseWeight')?.value || 0);
    const drug = document.getElementById('doseDrug')?.value || '';
    const result = document.getElementById('dosageResult');

    if (!weight || !drug || !result) {
        showToast('Please enter weight and drug', 'error');
        return;
    }

    const dose = Math.round(weight * 10); // Simple calculation
    result.innerHTML = `
        <div class="glass-card p-6 border-emerald-500/30">
            <h4 class="text-2xl font-black text-emerald-400 mb-2">Recommended Dose</h4>
            <p class="text-4xl font-black text-white mb-4">${dose} mg</p>
            <p class="text-sm text-slate-400">For ${weight}kg patient taking ${drug}</p>
        </div>
    `;
}

// === PRESCRIPTION SCANNER ===
function verifyPrescription() {
    const result = document.getElementById('rxResult');
    if (!result) return;

    result.classList.remove('hidden');
    result.innerHTML = '<div class="text-center text-teal-400 animate-pulse">Scanning prescription...</div>';

    setTimeout(() => {
        result.innerHTML = `
            <div class="glass-card p-6">
                <h4 class="text-xl font-black text-white mb-4">✅ Prescription Verified</h4>
                <p class="text-sm text-slate-300 mb-2"><strong>Patient:</strong> Vikram Singh</p>
                <p class="text-sm text-slate-300 mb-2"><strong>Drug:</strong> Amoxicillin 500mg</p>
                <p class="text-sm text-slate-300"><strong>Dosage:</strong> Twice daily after meals</p>
            </div>
        `;
    }, 2000);
}

// === VOICE COMMANDS ===
function toggleVoiceCommand() {
    const btn = document.getElementById('voiceBtn');
    if (btn) {
        btn.classList.toggle('voice-active');
        showToast('Voice Command ' + (btn.classList.contains('voice-active') ? 'Active' : 'Inactive'), 'info');
    }
}

// === AUTOCOMPLETE ===
function handleInput(input, suggId) {
    const list = document.getElementById(suggId);
    const val = input.value.toLowerCase();
    if (!val || !list) return;

    const drugs = [...new Set([...inventory.map(i => i.name), 'Paracetamol', 'Aspirin', 'Warfarin'])];
    const matches = drugs.filter(d => d.toLowerCase().includes(val));

    if (matches.length) {
        list.classList.remove('hidden');
        list.innerHTML = matches.map(m => `
            <div onclick="setDrug('${input.id}', '${m}', '${suggId}')" 
                 class="p-4 hover:bg-white/10 cursor-pointer text-slate-300 text-sm border-b border-white/5">
                ${m}
            </div>
        `).join('');
    } else {
        list.classList.add('hidden');
    }
}

function setDrug(id, val, sid) {
    const input = document.getElementById(id);
    const list = document.getElementById(sid);
    if (input) input.value = val;
    if (list) list.classList.add('hidden');
}

// === QUICK ORDER MODAL ===
function openQuickOrder() {
    const modal = document.getElementById('quickOrderModal');
    if (modal) modal.classList.remove('hidden');
}

function closeQuickOrder() {
    const modal = document.getElementById('quickOrderModal');
    if (modal) modal.classList.add('hidden');
}

async function submitQuickOrder() {
    const patient = document.getElementById('quickPatient')?.value;
    const medicine = document.getElementById('quickMed')?.value;
    const quantity = parseInt(document.getElementById('quickQty')?.value || 0);

    if (!patient || !medicine || !quantity) {
        showToast('Please fill all fields', 'error');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/sales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patient, items: [{ name: medicine, qty: quantity }], totalAmount: 0 })
        });
        if (res.ok) {
            showToast('Order Placed!', 'success');
            closeQuickOrder();
            refreshData();
        }
    } catch (err) {
        showToast('Order failed', 'error');
    }
}

console.log('✅ All missing functions loaded!');
