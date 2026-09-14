<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentMethod extends Model
{
    protected $fillable = [
        'event_id',
        'method',
        'bank_name',
        'account_name',
        'account_number',
        'qris_image',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }
}
