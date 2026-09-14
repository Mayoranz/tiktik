<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $users = User::when($request->role, fn($q) => $q->where('role', $request->role))
            ->when($request->search, fn($q, $s) => $q->where('username', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%"))
            ->latest()
            ->paginate(15);

        return response()->json($users);
    }

    public function ban($id)
    {
        $user = User::findOrFail($id);
        $user->update(['status' => 'banned']);
        $user->tokens()->delete();
        ActivityLog::log('admin.user.ban', "Banned user: {$user->username}");
        return response()->json(['message' => "User {$user->username} telah di-ban."]);
    }

    public function resetPassword($id)
    {
        $user = User::findOrFail($id);
        $newPassword = Str::random(10);
        $user->update(['password' => $newPassword]);
        $user->tokens()->delete();
        ActivityLog::log('admin.user.reset_password', "Reset password for: {$user->username}");
        return response()->json(['message' => "Password direset.", 'new_password' => $newPassword]);
    }
}
