// --- OYUN AYARLARI ---
const GRID_SIZE = 5;
const MAX_HEALTH = 100;
const INITIAL_BUDGET = 1000;
const INITIAL_AP = 3;
const FIREWALL_COST = 100;

const DURUM_MAP = {
    EMPTY: 'cell-empty',
    CORE: 'cell-core',
    F1: 'cell-firewall',
    V1: 'cell-virus'
};

let oyunDurumu = {
    tur: 1,
    butce: INITIAL_BUDGET,
    ap: INITIAL_AP,
    saglik: MAX_HEALTH,
    harita: [], // [row][col]
    seciliEylem: null,
    oyunBitti: false
};

// --- DOM Elementleri ---
const agHaritasiDOM = document.getElementById('ag-haritasi');
const turGosterge = document.getElementById('tur-gosterge');
const butceGosterge = document.getElementById('butce-gosterge');
const apGosterge = document.getElementById('ap-gosterge');
const sistemGosterge = document.getElementById('sistem-gosterge');
const mesajKutusu = document.getElementById('mesaj-kutusu');

// --- BAŞLATMA VE YÜKLEME ---

function oyunuSifirla(onay = true) {
    if (onay && !confirm("Oyunu sıfırlamak istediğinizden emin misiniz?")) return;
    
    // Haritayı sıfırla (Başlangıç pozisyonları)
    let yeniHarita = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill('EMPTY'));
    yeniHarita[0][GRID_SIZE - 1] = 'CORE'; // Core: (0, 4)
    
    oyunDurumu = {
        tur: 1,
        butce: INITIAL_BUDGET,
        ap: INITIAL_AP,
        saglik: MAX_HEALTH,
        harita: yeniHarita,
        seciliEylem: null,
        oyunBitti: false
    };
    localStorage.removeItem('siber_savunma');
    oyunuYukle();
    mesajKutusu.innerText = 'Yeni Ağ Kurulumu Tamamlandı.';
}

function oyunuYukle() {
    const kaydedilenDurum = localStorage.getItem('siber_savunma');
    if (kaydedilenDurum) {
        oyunDurumu = JSON.parse(kaydedilenDurum);
    } else {
        oyunuSifirla(false);
    }
    haritayiCiz();
    ekraniGuncelle();
    butonlariKontrolEt();
}

function haritayiCiz() {
    agHaritasiDOM.innerHTML = '';
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cell = document.createElement('div');
            cell.className = `grid-cell ${DURUM_MAP[oyunDurumu.harita[r][c]] || DURUM_MAP.EMPTY}`;
            cell.dataset.row = r;
            cell.dataset.col = c;

            // Hücre içeriğini ayarla (Core veya Virüs etiketleri)
            if (oyunDurumu.harita[r][c] === 'CORE') {
                cell.innerText = 'CORE';
            } else if (oyunDurumu.harita[r][c].startsWith('V')) {
                cell.innerText = 'V1';
            } else if (oyunDurumu.harita[r][c].startsWith('F')) {
                 cell.innerText = 'F1';
            }
            
            cell.onclick = () => hucreTiklandi(r, c);
            agHaritasiDOM.appendChild(cell);
        }
    }
}

function ekraniGuncelle() {
    turGosterge.innerText = `Tur: ${oyunDurumu.tur}`;
    butceGosterge.innerText = `Bütçe: ${oyunDurumu.butce} B`;
    apGosterge.innerText = `Eylem Puanı (AP): ${oyunDurumu.ap}`;
    sistemGosterge.innerText = `Sistem Bütünlüğü (H): ${oyunDurumu.saglik}%`;
    
    if (oyunDurumu.saglik <= 20) {
        sistemGosterge.style.color = 'red';
    } else if (oyunDurumu.saglik <= 50) {
        sistemGosterge.style.color = 'yellow';
    } else {
        sistemGosterge.style.color = '#00ff00';
    }
}

function butonlariKontrolEt() {
    document.getElementById('yerlestir-btn').disabled = oyunDurumu.ap < 1 || oyunDurumu.butce < FIREWALL_COST || oyunDurumu.oyunBitti;
    document.getElementById('saldiri-btn').disabled = oyunDurumu.ap < 1 || oyunDurumu.oyunBitti;
}

// --- OYUNCU EYLEMLERİ ---

function eylemHazirla(eylem) {
    if (oyunDurumu.oyunBitti) return;
    oyunDurumu.seciliEylem = eylem;
    mesajKutusu.innerText = `Eylem Hazır: ${eylem.toUpperCase()}. Haritada bir hücre seçin.`;
}

function hucreTiklandi(r, c) {
    if (oyunDurumu.oyunBitti || !oyunDurumu.seciliEylem) return;
    
    const hedef = oyunDurumu.harita[r][c];
    let islemBasarili = false;
    
    if (oyunDurumu.seciliEylem === 'yerlestir' && oyunDurumu.ap >= 1 && oyunDurumu.butce >= FIREWALL_COST) {
        if (hedef === 'EMPTY') {
            oyunDurumu.harita[r][c] = 'F1'; // Güvenlik Duvarı seviye 1
            oyunDurumu.butce -= FIREWALL_COST;
            oyunDurumu.ap -= 1;
            mesajKutusu.innerText = `Güvenlik Duvarı (${r}, ${c}) adresine kuruldu.`;
            islemBasarili = true;
        } else {
            mesajKutusu.innerText = "Buraya yerleştirilemez! Hücre dolu veya Çekirdek.";
        }
    } else if (oyunDurumu.seciliEylem === 'saldiri' && oyunDurumu.ap >= 1) {
        if (hedef.startsWith('V')) {
            oyunDurumu.harita[r][c] = 'EMPTY';
            oyunDurumu.ap -= 1;
            oyunDurumu.butce += 50; // Virüs silindi, ufak ödül
            mesajKutusu.innerText = `Virüs (${r}, ${c}) adresinden silindi. +50 Bütçe.`;
            islemBasarili = true;
        } else {
            mesajKutusu.innerText = "Saldırı başarısız! Burada Virüs yok.";
        }
    }

    if (islemBasarili) {
        oyunDurumu.seciliEylem = null;
        haritayiCiz();
        ekraniGuncelle();
        oyunuKaydet();
    }
}

// --- TUR MANTIĞI ---

function sonrakiTur() {
    if (oyunDurumu.oyunBitti) return;

    // 1. Virüs Hareketleri ve Çarpışmalar
    let yeniHarita = JSON.parse(JSON.stringify(oyunDurumu.harita));
    let yeniVirüsler = 0;
    
    for (let r = GRID_SIZE - 1; r >= 0; r--) {
        for (let c = GRID_SIZE - 1; c >= 0; c--) {
            const mevcut = oyunDurumu.harita[r][c];
            
            if (mevcut.startsWith('V')) {
                yeniHarüsler++;
                // Sadece mevcut Virüsleri yeni haritadan sil
                yeniHarita[r][c] = 'EMPTY'; 
                
                // Basit hareket: Sola doğru ilerle (col--)
                const yeniC = c - 1;
                
                if (yeniC < 0) {
                    // Virüs hedefe ulaştı (CORE (0, 4) adresinde değil, haritanın dışına çıktı)
                    oyunDurumu.saglik -= 10;
                    mesajKutusu.innerText += ` | UYARI: Virüs Sisteme Sızdı! -10% Sağlık.`;
                } else if (yeniHarita[r][yeniC] === 'CORE') {
                    // CORE'a ulaştı (Yanlış pozisyonda, biz CORE'u (0,4) koyduk)
                    // Hareketi daha karmaşık yapalım: CORE'a doğru mesafe bazlı hareket
                    // Basitlik için sadece Sola ilerleme kalsın. (Core adresini (r, 0) yapalım)

                    // Eğer soldaki hücre BOŞ ise ilerle
                    if (yeniHarita[r][yeniC] === 'EMPTY') {
                        yeniHarita[r][yeniC] = mevcut;
                    } else if (yeniHarita[r][yeniC].startsWith('F')) {
                        // Çarpışma: Duvarı kaldır
                        yeniHarita[r][yeniC] = 'EMPTY';
                        mesajKutusu.innerText += ` | Duvar Kırıldı! (${r}, ${yeniC}).`;
                    } else {
                        // Başka bir Virüsle çarpıştı, yerinde kal
                        yeniHarita[r][c] = mevcut;
                    }
                } else {
                     yeniHarita[r][c] = mevcut;
                }
            }
        }
    }
    
    // 2. Yeni Virüs Yaratma (Rastgele)
    if (Math.random() < 0.7) { // %70 ihtimalle yeni virüs
        const r = Math.floor(Math.random() * GRID_SIZE);
        if (yeniHarita[r][0] === 'EMPTY' && yeniHarita[r][GRID_SIZE - 1] !== 'CORE') {
            yeniHarita[r][0] = 'V1';
            mesajKutusu.innerText += ` | Yeni Virüs (${r}, 0) adresinde belirdi.`;
        }
    }
    
    // 3. Durumları Güncelle
    oyunDurumu.harita = yeniHarita;
    oyunDurumu.tur++;
    oyunDurumu.ap = INITIAL_AP;
    oyunDurumu.butce += 50; // Tur Başı Bütçe Kazanımı
    
    oyunBitisiniKontrolEt();
    
    haritayiCiz();
    ekraniGuncelle();
    oyunuKaydet();
}

function oyunBitisiniKontrolEt() {
    if (oyunDurumu.saglik <= 0) {
        oyunDurumu.oyunBitti = true;
        mesajKutusu.innerText = `OYUN BİTTİ! Sistem Bütünlüğü Tükendi. Tur: ${oyunDurumu.tur}.`;
        return;
    }
    // Kazanma koşulu: 20 tur hayatta kalmak (Veya daha karmaşık)
    if (oyunDurumu.tur > 20) { 
        oyunDurumu.oyunBitti = true;
        mesajKutusu.innerText = `TEBRİKLER! Ağınız 20 tur hayatta kaldı. Görev Başarılı.`;
    }
}

window.onload = oyunuYukle;
      
