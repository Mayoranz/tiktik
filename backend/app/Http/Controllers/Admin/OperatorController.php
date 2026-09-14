<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class OperatorController extends Controller
{
    public function index(Request $request)
    {
        $operators = User::where('role', 'operator')
            ->withCount('events')
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate(15);

        return response()->json($operators);
    }

    public function approve($id)
    {
        $user = User::where('role', 'operator')->findOrFail($id);
        $user->update(['status' => 'active']);
        ActivityLog::log('admin.operator.approve', "Approved operator: {$user->username}");
        return response()->json(['message' => "Operator {$user->username} diaktifkan."]);
    }

    public function suspend($id)
    {
        $user = User::where('role', 'operator')->findOrFail($id);
        $user->update(['status' => 'suspended']);
        ActivityLog::log('admin.operator.suspend', "Suspended operator: {$user->username}");
        return response()->json(['message' => "Operator {$user->username} di-suspend."]);
    }

    public function block($id)
    {
        $user = User::where('role', 'operator')->findOrFail($id);
        $user->update(['status' => 'banned']);
        ActivityLog::log('admin.operator.block', "Blocked operator: {$user->username}");
        return response()->json(['message' => "Operator {$user->username} diblokir."]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'username' => 'required|string|max:50',
            'nik' => 'required|string|size:16|unique:users,nik',
            'email' => 'required|email|max:100|unique:users,email',
            'phone' => 'required|string|max:20|unique:users,phone',
            'password' => 'required|string|min:8',
        ]);

        $user = User::create([
            'username' => $validated['username'],
            'nik' => $validated['nik'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'password' => \Illuminate\Support\Facades\Hash::make($validated['password']),
            'role' => 'operator',
            'status' => 'active',
        ]);

        ActivityLog::log('admin.operator.create', "Created operator: {$user->username}");
        return response()->json(['message' => 'Operator berhasil ditambahkan', 'data' => $user], 201);
    }

    public function update(Request $request, $id)
    {
        $user = User::where('role', 'operator')->findOrFail($id);

        $validated = $request->validate([
            'username' => 'required|string|max:50',
            'nik' => 'required|string|size:16|unique:users,nik,' . $id,
            'email' => 'required|email|max:100|unique:users,email,' . $id,
            'phone' => 'required|string|max:20|unique:users,phone,' . $id,
            'password' => 'nullable|string|min:8',
        ]);

        $data = [
            'username' => $validated['username'],
            'nik' => $validated['nik'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
        ];

        if (!empty($validated['password'])) {
            $data['password'] = \Illuminate\Support\Facades\Hash::make($validated['password']);
        }

        $user->update($data);

        ActivityLog::log('admin.operator.update', "Updated operator: {$user->username}");
        return response()->json(['message' => 'Operator berhasil diperbarui', 'data' => $user]);
    }
}
