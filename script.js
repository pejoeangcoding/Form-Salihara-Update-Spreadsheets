document.addEventListener('DOMContentLoaded', () => {
    const konfirmasiPesanan = document.getElementById('daftarPesanan');
    const totalHargaElement = document.getElementById('totalHarga');
    const namaPelangganInput = document.getElementById('namaPelanggan');
    const kirimPesananBtn = document.getElementById('kirimPesananBtn');

    let pesanan = {};
    // URL WEB APP GOOGLE APPS SCRIPT ANDA
    const spreadsheetID = 'https://script.google.com/macros/s/AKfycbzZfZwdqN2Yz4ro-iae0U-yjRLCoxUKh6TawBdiV20Hl-f8h5UYhwVBDLvDZ5TVE9K97g/exec';

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(number);
    };

    const updateKonfirmasi = () => {
        konfirmasiPesanan.innerHTML = '';
        let totalHarga = 0;
        let hasOrder = false;

        for (const item in pesanan) {
            const { qty, price, subtotal } = pesanan[item];
            if (qty > 0) {
                totalHarga += subtotal;
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${item} x ${qty}</span>
                    <span>${formatRupiah(subtotal)}</span>
                `;
                konfirmasiPesanan.appendChild(li);
                hasOrder = true;
            }
        }

        totalHargaElement.textContent = formatRupiah(totalHarga);

        if (!hasOrder) {
            konfirmasiPesanan.innerHTML = '<li style="text-align: center; color: #95a5a6;">Belum ada pesanan</li>';
        }
    };

    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        const itemName = item.querySelector('h4').textContent;
        const price = parseInt(item.querySelector('.harga').textContent.replace(/[^0-9]/g, ''));

        // Cek jika menu memiliki varian sambal
        const sambalOptionsContainer = item.querySelector('.sambal-options');
        if (sambalOptionsContainer) {
            // Ini adalah menu utama dengan harga, misal "Pecel Ayam Paha Atas"
            pesanan[itemName] = { qty: 0, price: price, subtotal: 0, type: 'utama' };

            // Inisialisasi entri pesanan untuk setiap varian sambal (harga 0)
            const sambalMerahName = `${itemName} (Sambal Merah)`;
            pesanan[sambalMerahName] = { qty: 0, price: 0, subtotal: 0, type: 'sambal' };

            const sambalIjoName = `${itemName} (Sambal Ijo)`;
            pesanan[sambalIjoName] = { qty: 0, price: 0, subtotal: 0, type: 'sambal' };

            const mainQtyDisplay = item.querySelector('.qty-display');
            const qtyDisplaySambalMerah = item.querySelector('.qty-display-sambal[data-sambal="Merah"]');
            const qtyDisplaySambalIjo = item.querySelector('.qty-display-sambal[data-sambal="Ijo"]');
            
            // Logika untuk tombol kuantitas menu utama
            item.querySelectorAll('.item-controls .btn-qty').forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.dataset.action;
                    let currentQty = pesanan[itemName].qty;
                    let newQty = Math.max(0, action === 'increment' ? currentQty + 1 : currentQty - 1);
                    
                    pesanan[itemName].qty = newQty;
                    pesanan[itemName].subtotal = newQty * price;
                    mainQtyDisplay.textContent = newQty;
                    
                    updateKonfirmasi();
                });
            });

            // Logika untuk tombol kuantitas varian sambal (harga 0)
            item.querySelectorAll('.sambal-controls .btn-qty-sambal').forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.dataset.action;
                    const sambalType = btn.dataset.sambal;
                    const menuKey = `${itemName} (Sambal ${sambalType})`;
                    
                    let currentQty = pesanan[menuKey].qty;
                    let newQty = Math.max(0, action === 'increment' ? currentQty + 1 : currentQty - 1);
                    
                    pesanan[menuKey].qty = newQty;
                    pesanan[menuKey].subtotal = newQty * 0; // Subtotal selalu 0
                    
                    if (sambalType === 'Merah') {
                        qtyDisplaySambalMerah.textContent = newQty;
                    } else {
                        qtyDisplaySambalIjo.textContent = newQty;
                    }

                    updateKonfirmasi();
                });
            });
        } else {
            // Logika untuk menu tanpa varian (Extra Menu & Minuman)
            const qtyDisplay = item.querySelector('.qty-display');
            pesanan[itemName] = { qty: 0, price: price, subtotal: 0, type: 'extra' };

            item.querySelectorAll('.btn-qty').forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.dataset.action;
                    let currentQty = pesanan[itemName].qty;
                    let newQty = Math.max(0, action === 'increment' ? currentQty + 1 : currentQty - 1);
                    
                    pesanan[itemName].qty = newQty;
                    pesanan[itemName].subtotal = newQty * price;
                    qtyDisplay.textContent = newQty;
                    
                    updateKonfirmasi();
                });
            });
        }
    });

    // TOAST VERSION: Super Fast Checkout
    kirimPesananBtn.addEventListener('click', async () => {
        const namaPelanggan = namaPelangganInput.value.trim();
        if (!namaPelanggan) {
            showToast('❌ Mohon isi nama pelanggan terlebih dahulu!', 'error');
            return;
        }

        const dataPesanan = [];
        let totalHargaPesanan = 0;

        for (const item in pesanan) {
            if (pesanan[item].qty > 0) {
                const { qty, price, subtotal } = pesanan[item];
                dataPesanan.push({
                    namaPelanggan,
                    menu: item,
                    qty,
                    hargaSatuan: price,
                    subtotal
                });
                totalHargaPesanan += subtotal;
            }
        }

        if (dataPesanan.length === 0) {
            showToast('❌ Keranjang pesanan masih kosong, kak!', 'error');
            return;
        }

        // INSTANT FEEDBACK
        kirimPesananBtn.innerHTML = `
            <span style="display: inline-flex; align-items: center; gap: 8px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="animation: spin 1s linear infinite;">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-opacity="0.3"/>
                    <path d="M4 12a8 8 0 018-8V0" stroke="currentColor" stroke-width="4"/>
                </svg>
                Berhasil!
            </span>
        `;
        kirimPesananBtn.disabled = true;

        // SUCCESS TOAST
        showToast('✅ Pesanan berhasil! Membuka WhatsApp...', 'success');
        
        // INSTANT RESET FORM
        resetForm();
        
        // OPEN WHATSAPP (super fast - 500ms delay)
        setTimeout(() => {
            openWhatsAppDirect(namaPelanggan, dataPesanan, totalHargaPesanan);
        }, 500);

        // BACKGROUND SAVE TO SPREADSHEET (user tidak tunggu)
        sendToSpreadsheetSilent(namaPelanggan, dataPesanan, totalHargaPesanan);

        // RESET BUTTON AFTER 2 SECONDS
        setTimeout(() => {
            kirimPesananBtn.innerHTML = 'Kirim Pesanan';
            kirimPesananBtn.disabled = false;
        }, 2000);
    });

    // UTILITY FUNCTIONS
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10001;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            font-size: 14px;
            max-width: 350px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideInRight 0.3s ease-out;
            background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        `;
        toast.textContent = message;

        document.body.appendChild(toast);

        // Auto remove after 4 seconds
        setTimeout(() => {
            if (document.body.contains(toast)) {
                toast.style.animation = 'slideOutRight 0.3s ease-out forwards';
                setTimeout(() => {
                    if (document.body.contains(toast)) {
                        document.body.removeChild(toast);
                    }
                }, 300);
            }
        }, 4000);
    }

    function openWhatsAppDirect(namaPelanggan, dataPesanan, totalHargaPesanan) {
        let pesanWa = `*Pecel Ayam & Lele Salihara*\n\n`;
        pesanWa += `Halo kak, *${namaPelanggan}*.\n`;
        pesanWa += `Terima kasih sudah memesan.\n\n`;
        pesanWa += `*Detail Pesanan:*\n`;
        dataPesanan.forEach(item => {
            pesanWa += `- ${item.menu} (${item.qty}x) = ${formatRupiah(item.subtotal)}\n`;
        });
        pesanWa += `\n*Total:* ${formatRupiah(totalHargaPesanan)}\n\n`;
        pesanWa += `Mohon tunggu konfirmasi dari kami ya kak.`;

        const phoneNumber = '6285283212487';
        const waUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(pesanWa)}`;
        
        window.open(waUrl, '_blank');
        
        // Follow-up toast
        setTimeout(() => {
            showToast('📱 WhatsApp terbuka! Klik "Continue to Chat" jika diperlukan', 'info');
        }, 1500);
    }

    function resetForm() {
        pesanan = {};
        menuItems.forEach(item => {
            const itemName = item.querySelector('h4').textContent;
            const price = parseInt(item.querySelector('.harga').textContent.replace(/[^0-9]/g, ''));
            
            const sambalOptionsContainer = item.querySelector('.sambal-options');
            if (sambalOptionsContainer) {
                pesanan[itemName] = { qty: 0, price: price, subtotal: 0, type: 'utama' };
                pesanan[`${itemName} (Sambal Merah)`] = { qty: 0, price: 0, subtotal: 0, type: 'sambal' };
                pesanan[`${itemName} (Sambal Ijo)`] = { qty: 0, price: 0, subtotal: 0, type: 'sambal' };
                
                item.querySelector('.qty-display').textContent = '0';
                const qtyDisplaySambalMerah = item.querySelector('.qty-display-sambal[data-sambal="Merah"]');
                const qtyDisplaySambalIjo = item.querySelector('.qty-display-sambal[data-sambal="Ijo"]');
                if (qtyDisplaySambalMerah) qtyDisplaySambalMerah.textContent = '0';
                if (qtyDisplaySambalIjo) qtyDisplaySambalIjo.textContent = '0';
            } else {
                pesanan[itemName] = { qty: 0, price: price, subtotal: 0, type: 'extra' };
                item.querySelector('.qty-display').textContent = '0';
            }
        });

        namaPelangganInput.value = '';
        updateKonfirmasi();
    }

    async function sendToSpreadsheetSilent(namaPelanggan, dataPesanan, totalHargaPesanan) {
        try {
            console.log('📤 Mengirim data ke spreadsheet...');
            
            await fetch(spreadsheetID, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dataPesanan, totalHargaPesanan, namaPelanggan })
            });
            
            console.log('✅ Data tersimpan ke spreadsheet');
            
            // Success notification (subtle)
            setTimeout(() => {
                showToast('💾 Data pesanan tersimpan di sistem', 'success');
            }, 3000);
            
        } catch (error) {
            console.error('❌ Error menyimpan data:', error);
            
            // Error notification (delayed)
            setTimeout(() => {
                showToast('⚠️ Data belum tersimpan. Hubungi admin jika perlu.', 'error');
            }, 5000);
        }
    }

    // ANIMATION OBSERVER
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, {
        threshold: 0.1
    });

    const elementsToAnimate = document.querySelectorAll('.animate__animated');
    elementsToAnimate.forEach(el => observer.observe(el));

    // ADD CSS FOR TOAST ANIMATIONS
    const toastStyles = document.createElement('style');
    toastStyles.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(toastStyles);
});