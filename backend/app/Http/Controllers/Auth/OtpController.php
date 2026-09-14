<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\OtpMail;
use App\Models\OtpCode;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class OtpController extends Controller
{
    /**
     * POST /api/send-otp
     * Kirim kode OTP ke email pengguna.
     * Tipe: 'register' atau 'forgot_password'
     */
    public function sendOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email|max:100',
            'type'  => 'required|in:register,forgot_password',
        ]);

        $email = $request->email;
        $type  = $request->type;

        // Untuk lupa password: pastikan email terdaftar
        if ($type === 'forgot_password') {
            $user = User::where('email', $email)->first();
            if (!$user) {
                throw ValidationException::withMessages([
                    'email' => ['Email tidak terdaftar di sistem kami.'],
                ]);
            }
            if ($user->status !== 'active') {
                throw ValidationException::withMessages([
                    'email' => ['Akun Anda telah di-' . $user->status . '.'],
                ]);
            }
        }

        // Hapus OTP lama dengan email & type yang sama
        OtpCode::where('email', $email)->where('type', $type)->delete();

        // Generate kode 6 digit
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Simpan ke DB, berlaku 5 menit
        OtpCode::create([
            'email'      => $email,
            'code'       => $code,
            'type'       => $type,
            'is_verified' => false,
            'expired_at' => now()->addMinutes(5),
        ]);

        // Kirim email
        Mail::to($email)->send(new OtpMail($code));

        return response()->json([
            'message' => 'Kode OTP telah dikirim ke ' . $email . '. Berlaku selama 5 menit.',
        ]);
    }

    /**
     * POST /api/verify-otp
     * Verifikasi kode OTP yang dimasukkan pengguna.
     */
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp'   => 'required|string|size:6',
            'type'  => 'required|in:register,forgot_password',
        ]);

        $record = OtpCode::where('email', $request->email)
            ->where('type', $request->type)
            ->where('is_verified', false)
            ->latest()
            ->first();

        if (!$record) {
            throw ValidationException::withMessages([
                'otp' => ['Kode OTP tidak ditemukan. Silakan kirim ulang.'],
            ]);
        }

        if ($record->isExpired()) {
            throw ValidationException::withMessages([
                'otp' => ['Kode OTP sudah kedaluwarsa. Silakan kirim ulang.'],
            ]);
        }

        if ($record->code !== $request->otp) {
            throw ValidationException::withMessages([
                'otp' => ['Kode OTP salah.'],
            ]);
        }

        // Tandai sebagai sudah diverifikasi
        $record->update(['is_verified' => true]);

        return response()->json([
            'message' => 'Email berhasil diverifikasi.',
        ]);
    }

    /**
     * POST /api/reset-password
     * Reset password setelah OTP terverifikasi.
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email'                 => 'required|email',
            'otp'                   => 'required|string|size:6',
            'password'              => 'required|string|min:8|confirmed',
            'password_confirmation' => 'required|string',
        ]);

        // Pastikan ada OTP yang sudah terverifikasi
        $record = OtpCode::where('email', $request->email)
            ->where('type', 'forgot_password')
            ->where('code', $request->otp)
            ->where('is_verified', true)
            ->latest()
            ->first();

        if (!$record) {
            throw ValidationException::withMessages([
                'otp' => ['Verifikasi OTP gagal. Silakan ulangi dari awal.'],
            ]);
        }

        // Pastikan tidak kedaluwarsa (toleransi: masih dalam 10 menit dari verifikasi)
        if (now()->diffInMinutes($record->updated_at) > 10) {
            throw ValidationException::withMessages([
                'otp' => ['Sesi reset password sudah habis. Silakan ulangi dari awal.'],
            ]);
        }

        // Cari user dan update password
        $user = User::where('email', $request->email)->first();
        if (!$user) {
            throw ValidationException::withMessages([
                'email' => ['Email tidak ditemukan.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        // Hapus semua token aktif (paksa logout di semua device)
        $user->tokens()->delete();

        // Hapus OTP yang sudah dipakai
        $record->delete();

        return response()->json([
            'message' => 'Password berhasil direset. Silakan masuk dengan password baru Anda.',
        ]);
    }
}
