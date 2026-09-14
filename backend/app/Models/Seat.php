<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Seat extends Model
{
    protected $fillable = [
        'ticket_type_id',
        'seat_number',
        'status',
        'locked_until',
    ];

    protected function casts(): array
    {
        return [
            'locked_until' => 'datetime',
        ];
    }

    public function ticketType(): BelongsTo
    {
        return $this->belongsTo(TicketType::class);
    }

    public function ticket()
    {
        return $this->hasOne(Ticket::class);
    }

    // ── Scopes ──

    public function scopeAvailable($query)
    {
        return $query->where('status', 'available');
    }

    public function scopeLocked($query)
    {
        return $query->where('status', 'locked');
    }

    /**
     * Check if seat lock has expired
     */
    public function isLockExpired(): bool
    {
        return $this->status === 'locked'
            && $this->locked_until
            && $this->locked_until->isPast();
    }
}
