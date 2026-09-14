<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new buyer account.
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'username' => 'required|string|max:50',
            'nik' => 'required|string|size:16|unique:users,nik',
            'email' => 'required|email|max:100|unique:users,email',
            'phone' => 'required|string|max:20|unique:users,phone',
            'password' => 'required|string|min:8|confirmed',
        ], [
            'nik.unique' => 'NIK sudah terdaftar.',
            'nik.size' => 'NIK harus 16 digit.',
            'email.unique' => 'Email sudah terdaftar.',
            'phone.unique' => 'Nomor HP sudah terdaftar.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
        ]);

        $user = User::create([
            'username' => $validated['username'],
            'nik' => $validated['nik'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'password' => $validated['password'],
            'role' => 'buyer',
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        ActivityLog::log('register', "User {$user->username} registered", $user->id);

        return response()->json([
            'message' => 'Registrasi berhasil.',
            'user' => $user->only(['id', 'username', 'email', 'phone', 'role']),
            'token' => $token,
        ], 201);
    }

    /**
     * Login with email/phone and password.
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'login' => 'required|string',
            'password' => 'required|string',
        ]);

        // Find user by email or phone
        $user = User::where('email', $validated['login'])
            ->orWhere('phone', $validated['login'])
            ->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['Email/No. HP atau password salah.'],
            ]);
        }

        if ($user->status !== 'active') {
            throw ValidationException::withMessages([
                'login' => ['Akun Anda telah di-' . $user->status . '.'],
            ]);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        ActivityLog::log('login', "User {$user->username} logged in", $user->id);

        return response()->json([
            'message' => 'Login berhasil.',
            'user' => $user->only(['id', 'username', 'email', 'phone', 'role', 'status']),
            'token' => $token,
        ]);
    }

    /**
     * Get the authenticated user.
     */
    public function user(Request $request)
    {
        return response()->json([
            'user' => $request->user()->only(['id', 'username', 'nik', 'email', 'phone', 'role', 'status']),
        ]);
    }

    /**
     * Logout and revoke token.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout berhasil.',
        ]);
    }

    /**
     * Update profile.
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'username' => 'sometimes|string|max:50',
            'phone' => 'sometimes|string|max:20|unique:users,phone,' . $user->id,
            'current_password' => 'required|string',
        ]);

        if (!\Illuminate\Support\Facades\Hash::check($validated['current_password'], $user->password)) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'current_password' => ['Password saat ini tidak valid.'],
            ]);
        }

        $user->update([
            'username' => $validated['username'] ?? $user->username,
            'phone' => $validated['phone'] ?? $user->phone,
        ]);

        return response()->json([
            'message' => 'Profil berhasil diperbarui.',
            'user' => $user->only(['id', 'username', 'nik', 'email', 'phone', 'role', 'status']),
        ]);
    }
}
