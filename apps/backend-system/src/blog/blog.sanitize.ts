import sanitizeHtml from 'sanitize-html';

/**
 * Membersihkan isi tulisan dari editor berformat.
 *
 * Isinya HTML yang dikirim browser, jadi tidak boleh dipercaya: tanpa
 * pembersihan, siapa pun yang bisa menulis blog dapat menitipkan skrip yang
 * berjalan di halaman publik, termasuk mencuri sesi pembaca.
 *
 * Yang diizinkan sengaja sempit — persis sebanyak tombol yang ada di editor.
 * Menambah tag baru harus jadi keputusan sadar, bukan kelolosan.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'h2',
    'h3',
    'h4',
    'ul',
    'ol',
    'li',
    'blockquote',
    'a',
    'img',
    'figure',
    'figcaption',
    'hr',
    'code',
    'pre',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
  },
  /// Tautan hanya boleh ke skema yang aman. `javascript:` sengaja tidak ada.
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  /// Tautan keluar dibuka di tab baru tanpa membocorkan halaman asalnya.
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', {
      target: '_blank',
      rel: 'noopener noreferrer',
    }),
  },
};

export function sanitizeBlogContent(html: string) {
  return sanitizeHtml(html, OPTIONS);
}

/**
 * Ringkasan otomatis dari awal tulisan, untuk kartu daftar dan deskripsi di
 * hasil pencarian — dipakai kalau penulis mengosongkan ringkasannya.
 */
export function excerptFromContent(html: string, maxLength = 200) {
  /// Penutup blok diberi spasi lebih dulu. Tanpa ini, "…perawatan</h2><p>Cuci…"
  /// berubah jadi "perawatanCuci" begitu tagnya dibuang.
  const spaced = html.replace(
    /<\/(p|h[1-6]|li|ul|ol|blockquote|figcaption|pre|div)>|<br\s*\/?>/gi,
    '$& ',
  );

  const text = sanitizeHtml(spaced, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length <= maxLength) return text;

  /// Dipotong di spasi terakhir supaya tidak memotong kata di tengah.
  const cut = text.slice(0, maxLength);
  return `${cut.slice(0, cut.lastIndexOf(' ')) || cut}...`;
}

/**
 * Mengumpulkan URL gambar milik kita sendiri dari isi tulisan.
 *
 * Dipakai untuk membersihkan Cloudinary saat tulisan dihapus atau gambarnya
 * dikeluarkan dari isi. Yang dikumpulkan HANYA gambar di folder blog milik
 * kita: gambar yang ditempel dari situs lain bukan hak kita untuk menghapus,
 * dan gambar dari folder lain (mis. produk) masih dipakai halaman lain.
 *
 * Isi tulisan sudah melewati `sanitizeBlogContent` sebelum tersimpan, jadi
 * bentuk `<img>`-nya seragam dan aman dibaca dengan pola sederhana.
 */
const BLOG_IMAGE_TAG = /<img[^>]+src=["']([^"']+)["']/gi;

export function collectBlogImages(html: string): string[] {
  const urls = new Set<string>();

  for (const match of html.matchAll(BLOG_IMAGE_TAG)) {
    const url = match[1];
    if (url.includes('res.cloudinary.com') && url.includes('/blogs/')) {
      urls.add(url);
    }
  }

  return [...urls];
}
