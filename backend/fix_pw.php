<?php

use Illuminate\Support\Facades\Hash;
use App\Models\User;

$users = User::all();
foreach ($users as $user) {
    // Force re-hashing
    $user->password = Hash::make('password123');
    $user->save();
}

echo "All passwords reset to 'password123'!\n";
