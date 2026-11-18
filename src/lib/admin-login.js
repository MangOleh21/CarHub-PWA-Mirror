export function getAdminLoginErrorMessage(error) {
  switch (error?.code) {
    case 'INVALID_CREDENTIALS':
      return 'Email atau kata sandi tidak sesuai.'
    case 'RATE_LIMITED':
      return 'Terlalu banyak percobaan masuk. Tunggu 15 menit sebelum mencoba lagi.'
    case 'NETWORK_ERROR':
      return 'Tidak dapat terhubung ke server. Periksa koneksi internet lalu coba lagi.'
    case 'FORBIDDEN':
      return 'Permintaan masuk ditolak. Pastikan Anda membuka portal dari domain resmi CarHub.'
    default:
      return 'Login sedang tidak dapat diproses. Coba lagi beberapa saat lagi.'
  }
}
