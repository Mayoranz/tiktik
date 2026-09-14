<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TicketType extends Model
{
    protected $fillable = [
        'event_id',
        'name',
        'price',
        'quota',
        'is_numbered_seating',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'is_numbered_seating' => 'boolean',
        ];
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function seats(): HasMany
    {
        return $this->hasMany(Seat::class);
    }

    public function transactionItems(): HasMany
    {
        return $this->hasMany(TransactionItem::class);
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }

    /**
     * Get available quota (total quota minus sold/pending tickets)
     */
    public function getAvailableQuotaAttribute(): int
    {
        $soldOrPending = $this->transactionItems()
            ->whereHas('transaction', function ($q) {
                $q->whereIn('status', ['pending', 'approved']);
            })
            ->sum('quantity');

        return max(0, $this->quota - $soldOrPending);
    }
}
