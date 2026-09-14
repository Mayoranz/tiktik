<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Transaction extends Model
{
    protected $fillable = [
        'user_id',
        'event_id',
        'midtrans_order_id',
        'snap_token',
        'snap_url',
        'payment_type',
        'total_amount',
        'payment_proof',
        'status',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'total_amount' => 'decimal:2',
            'expires_at' => 'datetime',
        ];
    }

    // ── Relationships ──

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(TransactionItem::class);
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }

    // ── Helpers ──

    public function isExpired(): bool
    {
        return $this->status === 'pending' && $this->expires_at->isPast();
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }
}
