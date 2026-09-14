<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Ticket extends Model
{
    protected $fillable = [
        'transaction_id',
        'ticket_type_id',
        'seat_id',
        'qr_code_token',
        'is_scanned',
        'scanned_at',
    ];

    protected function casts(): array
    {
        return [
            'is_scanned' => 'boolean',
            'scanned_at' => 'datetime',
        ];
    }

    // ── Boot ──

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($ticket) {
            if (empty($ticket->qr_code_token)) {
                $ticket->qr_code_token = 'TIK-' . strtoupper(Str::random(12)) . '-' . time();
            }
        });
    }

    // ── Relationships ──

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }

    public function ticketType(): BelongsTo
    {
        return $this->belongsTo(TicketType::class);
    }

    public function seat(): BelongsTo
    {
        return $this->belongsTo(Seat::class);
    }

    // ── Helpers ──

    public function markAsScanned(): bool
    {
        if ($this->is_scanned) {
            return false;
        }

        $this->update([
            'is_scanned' => true,
            'scanned_at' => now(),
        ]);

        return true;
    }
}
