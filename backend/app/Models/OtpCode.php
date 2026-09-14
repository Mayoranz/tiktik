<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OtpCode extends Model
{
    protected $fillable = [
        'email',
        'code',
        'type',
        'is_verified',
        'expired_at',
    ];

    protected $casts = [
        'is_verified' => 'boolean',
        'expired_at'  => 'datetime',
    ];

    /**
     * Cek apakah OTP sudah kedaluwarsa.
     */
    public function isExpired(): bool
    {
        return now()->isAfter($this->expired_at);
    }
}
