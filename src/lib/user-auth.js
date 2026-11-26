export function getUserAuthErrorMessage(error, mode = 'login') {
  switch (error?.code) {
    case 'INVALID_CREDENTIALS':
      return 'Email atau kata sandi tidak sesuai.'
    case 'EMAIL_ALREADY_REGISTERED':
      return 'Email ini sudah terdaftar. Silakan masuk menggunakan akun Anda.'
    case 'RATE_LIMITED':
      return mode === 'register'
        ? 'Terlalu banyak percobaan pendaftaran. Tunggu 15 menit lalu coba lagi.'
        : 'Terlalu banyak percobaan masuk. Tunggu 15 menit lalu coba lagi.'
    case 'NETWORK_ERROR':
      return 'Tidak dapat terhubung ke server. Periksa koneksi internet lalu coba lagi.'
    case 'FORBIDDEN':
      return 'Permintaan ditolak. Pastikan Anda membuka CarHub dari alamat resmi.'
    case 'VALIDATION_ERROR':
      return mode === 'register'
        ? 'Periksa kembali data pendaftaran Anda.'
        : 'Periksa kembali email dan kata sandi Anda.'
    default:
      return mode === 'register'
        ? 'Pendaftaran belum dapat diproses. Coba lagi beberapa saat lagi.'
        : 'Login sedang tidak dapat diproses. Coba lagi beberapa saat lagi.'
  }
}

export function getSafeRedirectTarget(search, fallback = '/profile') {
  const next = new URLSearchParams(search || '').get('next')
  if (!next || typeof next !== 'string') return fallback
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/admin')) {
    return fallback
  }
  return next
}
